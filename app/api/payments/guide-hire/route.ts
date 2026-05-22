import { createSupabaseServerClient } from "@/lib/supabase-server";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { NextRequest } from "next/server";

/**
 * POST /api/payments/guide-hire
 * Create a Stripe Checkout Session for an accepted guide hire.
 * Body: { hireId }
 */
export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  let body: { hireId?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.hireId) return Response.json({ error: "hireId is required" }, { status: 400 });

  const hire = await prisma.guideHire.findUnique({
    where: { id: body.hireId, requesterId: user.id, deletedAt: null },
    select: {
      id: true,
      status: true,
      totalAmount: true,
      currency: true,
      daysCount: true,
      startDate: true,
      endDate: true,
      guideId: true,
      payment: { select: { id: true, status: true } },
      guide: { select: { user: { select: { fullName: true, avatarUrl: true } } } },
    },
  });

  if (!hire) return Response.json({ error: "Hire not found" }, { status: 404 });
  if (hire.status !== "ACCEPTED") {
    return Response.json({ error: "Can only pay for accepted hire requests" }, { status: 409 });
  }
  if (hire.payment?.status === "PAID") return Response.json({ error: "Already paid" }, { status: 409 });

  const origin = request.headers.get("origin") ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const amount = Math.round(Number(hire.totalAmount) * 100);
  const currency = hire.currency.toLowerCase();

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency,
          unit_amount: amount,
          product_data: {
            name: `Guide Hire — ${hire.guide.user.fullName}`,
            description: `${hire.daysCount} day${hire.daysCount !== 1 ? "s" : ""} · ${new Date(hire.startDate).toLocaleDateString("en-US", { day: "numeric", month: "short" })} – ${new Date(hire.endDate).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}`,
            ...(hire.guide.user.avatarUrl ? { images: [hire.guide.user.avatarUrl] } : {}),
          },
        },
        quantity: 1,
      },
    ],
    metadata: {
      type: "guide_hire",
      hireId: hire.id,
      userId: user.id,
    },
    success_url: `${origin}/payment/success?type=hire&id=${hire.id}`,
    cancel_url: `${origin}/dashboard/traveller/hires?cancelled=1`,
  });

  // Upsert payment record
  if (hire.payment) {
    await prisma.payment.update({
      where: { guideHireId: hire.id },
      data: { providerTransactionId: session.id, status: "PENDING" },
    });
  } else {
    await prisma.payment.create({
      data: {
        userId: user.id,
        guideHireId: hire.id,
        amount: hire.totalAmount,
        currency: hire.currency,
        provider: "STRIPE",
        providerTransactionId: session.id,
        status: "PENDING",
      },
    });
  }

  return Response.json({ url: session.url });
}
