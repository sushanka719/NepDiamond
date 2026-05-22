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

  // Look up without status filter to give specific errors for FULL/CANCELLED
  const departure = await prisma.trekDeparture.findFirst({
    where: { id: body.departureId, deletedAt: null, trek: { slug, deletedAt: null } },
    select: { id: true, status: true, pricePerPerson: true, maxParticipants: true, currency: true, departureDate: true },
  });

  if (!departure) {
    return Response.json({ error: "Departure not found" }, { status: 404 });
  }
  if (departure.status === "FULL") {
    return Response.json({ error: "This departure is fully booked" }, { status: 409 });
  }
  if (departure.status === "CANCELLED") {
    return Response.json({ error: "This departure has been cancelled" }, { status: 409 });
  }
  if (departure.status !== "SCHEDULED") {
    return Response.json({ error: "This departure is no longer open for booking" }, { status: 409 });
  }
  if (departure.departureDate <= new Date()) {
    return Response.json({ error: "This departure date has already passed" }, { status: 409 });
  }

  const existingBooking = await prisma.trekBooking.findUnique({
    where: { departureId_userId: { departureId: body.departureId, userId: user.id } },
    select: { id: true, status: true },
  });
  if (existingBooking) {
    const msg = existingBooking.status === "CANCELLED"
      ? "Your previous booking was cancelled. Contact support to rebook."
      : "You already have a booking for this departure";
    return Response.json({ error: msg }, { status: 409 });
  }

  // Re-verify spot count atomically inside a transaction to prevent race conditions
  let booking: { id: string; status: string; amount: object; currency: string; confirmedAt: Date | null; createdAt: Date } | null = null;
  let isFull = false;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const confirmedCount = await tx.trekBooking.count({
        where: { departureId: body.departureId!, status: "CONFIRMED", deletedAt: null },
      });
      if (confirmedCount >= departure.maxParticipants) {
        throw new Error("DEPARTURE_FULL");
      }

      const created = await tx.trekBooking.create({
        data: {
          departureId: body.departureId!,
          userId: user.id,
          status: "CONFIRMED",
          amount: departure.pricePerPerson,
          currency: departure.currency,
          confirmedAt: new Date(),
        },
        select: { id: true, status: true, amount: true, currency: true, confirmedAt: true, createdAt: true },
      });

      const nowFull = confirmedCount + 1 >= departure.maxParticipants;
      if (nowFull) {
        await tx.trekDeparture.update({ where: { id: body.departureId }, data: { status: "FULL" } });
      }
      return { booking: created, isFull: nowFull };
    });
    booking = result.booking;
    isFull = result.isFull;
  } catch (err) {
    if (err instanceof Error && err.message === "DEPARTURE_FULL") {
      return Response.json({ error: "This departure just filled up — no spots remaining" }, { status: 409 });
    }
    throw err;
  }

  return Response.json({ booking, departureFull: isFull }, { status: 201 });
}
