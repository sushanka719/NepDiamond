import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { NextRequest } from "next/server";

type Params = { params: Promise<{ slug: string }> };

/**
 * POST /api/treks/:slug/book
 * Book a seat on a departure of this trek.
 * Auto-marks departure as FULL when confirmed bookings reach maxParticipants.
 *
 * Body: { departureId }
 */
export async function POST(request: NextRequest, { params }: Params) {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true, isActive: true, deletedAt: true },
  });

  if (!dbUser || !dbUser.isActive || dbUser.deletedAt) {
    return Response.json({ error: "Account not found or inactive" }, { status: 403 });
  }

  if (dbUser.role !== "TRAVELLER") {
    return Response.json({ error: "Only travellers can book trek departures" }, { status: 403 });
  }

  const { slug } = await params;

  let body: { departureId?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.departureId) return Response.json({ error: "departureId is required" }, { status: 400 });

  const departure = await prisma.trekDeparture.findFirst({
    where: {
      id: body.departureId,
      deletedAt: null,
      status: "SCHEDULED",
      trek: { slug, deletedAt: null },
    },
    select: { id: true, pricePerPerson: true, maxParticipants: true, currency: true, departureDate: true },
  });
  if (!departure) {
    return Response.json({ error: "Departure not found or not open for booking" }, { status: 404 });
  }

  if (departure.departureDate <= new Date()) {
    return Response.json({ error: "This departure date has already passed" }, { status: 409 });
  }

  const existingBooking = await prisma.trekBooking.findUnique({
    where: { departureId_userId: { departureId: body.departureId, userId: user.id } },
    select: { id: true, status: true },
  });
  if (existingBooking) {
    return Response.json({ error: "You already have a booking for this departure" }, { status: 409 });
  }

  const confirmedCount = await prisma.trekBooking.count({
    where: { departureId: body.departureId, status: "CONFIRMED", deletedAt: null },
  });
  if (confirmedCount >= departure.maxParticipants) {
    return Response.json({ error: "This departure is fully booked" }, { status: 409 });
  }

  const { booking, isFull } = await prisma.$transaction(async (tx) => {
    const booking = await tx.trekBooking.create({
      data: {
        departureId: body.departureId!,
        userId: user.id,
        status: "CONFIRMED",
        amount: departure.pricePerPerson,
        currency: departure.currency,
        confirmedAt: new Date(),
      },
      select: {
        id: true,
        status: true,
        amount: true,
        currency: true,
        confirmedAt: true,
        createdAt: true,
      },
    });

    const newCount = confirmedCount + 1;
    const isFull = newCount >= departure.maxParticipants;

    if (isFull) {
      await tx.trekDeparture.update({
        where: { id: body.departureId },
        data: { status: "FULL" },
      });
    }

    return { booking, isFull };
  });

  return Response.json({ booking, departureFull: isFull }, { status: 201 });
}
