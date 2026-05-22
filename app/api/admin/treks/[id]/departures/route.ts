import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";
import { NextRequest } from "next/server";

type Params = { params: Promise<{ id: string }> };

/**
 * GET /api/admin/treks/:id/departures
 * List all departures for a trek.
 */
export async function GET(_req: NextRequest, { params }: Params) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { id } = await params;

  const trek = await prisma.trek.findUnique({ where: { id, deletedAt: null }, select: { id: true } });
  if (!trek) return Response.json({ error: "Trek not found" }, { status: 404 });

  const departures = await prisma.trekDeparture.findMany({
    where: { trekId: id, deletedAt: null },
    orderBy: { departureDate: "desc" },
    select: {
      id: true,
      departureDate: true,
      returnDate: true,
      pricePerPerson: true,
      maxParticipants: true,
      currency: true,
      status: true,
      notes: true,
      createdAt: true,
      rescheduledFromId: true,
      _count: { select: { bookings: true, guides: true } },
    },
  });

  return Response.json({ departures });
}

/**
 * POST /api/admin/treks/:id/departures
 * "List this trek again" — create a new departure with a new date.
 *
 * Body: {
 *   departureDate,
 *   returnDate?,
 *   pricePerPerson?,      ← defaults to trek's pricePerPerson
 *   maxParticipants?,     ← defaults to trek's maxParticipants
 *   currency?,
 *   notes?,
 *   rescheduledFromId?    ← optional lineage pointer
 * }
 */
export async function POST(request: NextRequest, { params }: Params) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { id } = await params;

  const trek = await prisma.trek.findUnique({
    where: { id, deletedAt: null },
    select: { id: true, pricePerPerson: true, maxParticipants: true },
  });
  if (!trek) return Response.json({ error: "Trek not found" }, { status: 404 });

  let body: {
    departureDate?: string;
    returnDate?: string;
    pricePerPerson?: number;
    maxParticipants?: number;
    currency?: string;
    notes?: string;
    rescheduledFromId?: string;
  };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.departureDate) return Response.json({ error: "departureDate is required" }, { status: 400 });
  const parsedDeparture = new Date(body.departureDate);
  if (isNaN(parsedDeparture.getTime())) {
    return Response.json({ error: "departureDate is not a valid date" }, { status: 400 });
  }
  const parsedReturn = body.returnDate ? new Date(body.returnDate) : null;
  if (parsedReturn && isNaN(parsedReturn.getTime())) {
    return Response.json({ error: "returnDate is not a valid date" }, { status: 400 });
  }

  if (body.rescheduledFromId) {
    const parent = await prisma.trekDeparture.findUnique({
      where: { id: body.rescheduledFromId },
      select: { id: true, trekId: true },
    });
    if (!parent || parent.trekId !== id) {
      return Response.json({ error: "rescheduledFromId does not belong to this trek" }, { status: 400 });
    }
  }

  const departure = await prisma.trekDeparture.create({
    data: {
      trekId: id,
      departureDate: parsedDeparture,
      returnDate: parsedReturn,
      pricePerPerson: body.pricePerPerson ?? Number(trek.pricePerPerson),
      maxParticipants: body.maxParticipants ?? trek.maxParticipants,
      currency: body.currency ?? "USD",
      notes: body.notes ?? null,
      rescheduledFromId: body.rescheduledFromId ?? null,
      status: "SCHEDULED",
    },
    select: {
      id: true,
      trekId: true,
      departureDate: true,
      returnDate: true,
      pricePerPerson: true,
      maxParticipants: true,
      currency: true,
      status: true,
      notes: true,
      rescheduledFromId: true,
      createdAt: true,
      _count: { select: { bookings: true, guides: true } },
    },
  });

  return Response.json({ departure }, { status: 201 });
}
