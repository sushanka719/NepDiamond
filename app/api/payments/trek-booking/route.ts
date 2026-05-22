import { createSupabaseServerClient } from "@/lib/supabase-server";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { NextRequest } from "next/server";

/**
 * POST /api/payments/trek-booking
 * Create a Stripe Checkout Session for a confirmed trek booking.
 * Body: { bookingId }
 */
export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  let body: { bookingId?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.bookingId) return Response.json({ error: "bookingId is required" }, { status: 400 });

  const booking = await prisma.trekBooking.findUnique({
    where: { id: body.bookingId, userId: user.id, deletedAt: null },
    select: {
      id: true,
      status: true,
      amount: true,
      currency: true,
      payment: { select: { id: true, status: true } },
      departure: {
        select: {
          departureDate: true,
          trek: { select: { title: true, coverImageUrl: true } },
        },
      },
    },
  });

  if (!booking) return Response.json({ error: "Booking not found" }, { status: 404 });
  if (booking.status === "CANCELLED") return Response.json({ error: "Booking is cancelled" }, { status: 409 });
  if (booking.payment?.status === "PAID") return Response.json({ error: "Already paid" }, { status: 409 });

  const origin = request.headers.get("origin") ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const amount = Math.round(Number(booking.amount) * 100); // cents
  const currency = booking.currency.toLowerCase();

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency,
          unit_amount: amount,
          product_data: {
            name: `Trek Booking — ${booking.departure.trek.title}`,
            description: `Departure: ${new Date(booking.departure.departureDate).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" })}`,
            ...(booking.departure.trek.coverImageUrl
              ? { images: [booking.departure.trek.coverImageUrl] }
              : {}),
          },
        },
        quantity: 1,
      },
    ],
    metadata: {
      type: "trek_booking",
      bookingId: booking.id,
      userId: user.id,
    },
    success_url: `${origin}/payment/success?type=booking&id=${booking.id}`,
    cancel_url: `${origin}/dashboard/traveller/bookings?cancelled=1`,
  });

  // Upsert payment record (PENDING until webhook confirms)
  if (booking.payment) {
    await prisma.trekBookingPayment.update({
      where: { bookingId: booking.id },
      data: {
        providerTransactionId: session.id,
        status: "PENDING",
      },
    });
  } else {
    await prisma.trekBookingPayment.create({
      data: {
        bookingId: booking.id,
        userId: user.id,
        amount: booking.amount,
        currency: booking.currency,
        provider: "STRIPE",
        providerTransactionId: session.id,
        status: "PENDING",
      },
    });
  }

  return Response.json({ url: session.url });
}
