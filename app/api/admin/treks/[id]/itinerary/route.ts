import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";
import { NextRequest } from "next/server";

type Params = { params: Promise<{ id: string }> };

/**
 * GET /api/admin/treks/:id/itinerary
 *
 * Returns all itinerary days for a trek in order.
 */
export async function GET(_req: NextRequest, { params }: Params) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { id } = await params;

  const trek = await prisma.trek.findUnique({
    where: { id, deletedAt: null },
    select: { id: true },
  });
  if (!trek) {
    return Response.json({ error: "Trek not found" }, { status: 404 });
  }

  const days = await prisma.trekItineraryDay.findMany({
    where: { trekId: id },
    orderBy: { dayNumber: "asc" },
    select: {
      id: true,
      dayNumber: true,
      title: true,
      description: true,
      createdAt: true,
    },
  });

  return Response.json({ days });
}

/**
 * POST /api/admin/treks/:id/itinerary
 *
 * Adds one or more itinerary days. Day numbers must not already exist on the trek.
 * Body: { days: { dayNumber, title, description }[] }
 *    OR single: { dayNumber, title, description }
 */
export async function POST(request: NextRequest, { params }: Params) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { id } = await params;

  const trek = await prisma.trek.findUnique({
    where: { id, deletedAt: null },
    select: {
      id: true,
      itinerary: { select: { dayNumber: true } },
    },
  });
  if (!trek) {
    return Response.json({ error: "Trek not found" }, { status: 404 });
  }

  let body: {
    days?: { dayNumber: number; title: string; description: string }[];
    dayNumber?: number;
    title?: string;
    description?: string;
  };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Accept either a single day or an array
  const incoming: { dayNumber: number; title: string; description: string }[] =
    body.days ??
    (body.dayNumber && body.title && body.description
      ? [{ dayNumber: body.dayNumber, title: body.title, description: body.description }]
      : []);

  if (incoming.length === 0) {
    return Response.json(
      { error: "Provide at least one day: { dayNumber, title, description }" },
      { status: 400 }
    );
  }

  const existingDayNumbers = new Set(trek.itinerary.map((d) => d.dayNumber));
  const conflicts = incoming.filter((d) => existingDayNumbers.has(d.dayNumber));

  if (conflicts.length > 0) {
    return Response.json(
      {
        error: `Day number(s) already exist: ${conflicts.map((d) => d.dayNumber).join(", ")}`,
      },
      { status: 409 }
    );
  }

  const created = await prisma.trekItineraryDay.createMany({
    data: incoming.map((d) => ({
      trekId: id,
      dayNumber: d.dayNumber,
      title: d.title.trim(),
      description: d.description.trim(),
    })),
  });

  return Response.json(
    { message: `${created.count} day(s) added` },
    { status: 201 }
  );
}
