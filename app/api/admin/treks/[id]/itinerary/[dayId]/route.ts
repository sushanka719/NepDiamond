import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";
import { NextRequest } from "next/server";

type Params = { params: Promise<{ id: string; dayId: string }> };

/**
 * PUT /api/admin/treks/:id/itinerary/:dayId
 *
 * Updates a single itinerary day.
 * Body: { title?, description?, dayNumber? }
 */
export async function PUT(request: NextRequest, { params }: Params) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { id, dayId } = await params;

  const day = await prisma.trekItineraryDay.findUnique({
    where: { id: dayId },
    select: { id: true, trekId: true, dayNumber: true },
  });

  if (!day || day.trekId !== id) {
    return Response.json({ error: "Itinerary day not found" }, { status: 404 });
  }

  let body: { title?: string; description?: string; dayNumber?: number };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // If changing dayNumber, ensure it isn't taken by another day on the same trek
  if (body.dayNumber !== undefined && body.dayNumber !== day.dayNumber) {
    const conflict = await prisma.trekItineraryDay.findUnique({
      where: { trekId_dayNumber: { trekId: id, dayNumber: body.dayNumber } },
      select: { id: true },
    });
    if (conflict) {
      return Response.json(
        { error: `Day number ${body.dayNumber} already exists on this trek` },
        { status: 409 }
      );
    }
  }

  const updated = await prisma.trekItineraryDay.update({
    where: { id: dayId },
    data: {
      ...(body.title !== undefined && { title: body.title.trim() }),
      ...(body.description !== undefined && { description: body.description.trim() }),
      ...(body.dayNumber !== undefined && { dayNumber: body.dayNumber }),
    },
    select: {
      id: true,
      dayNumber: true,
      title: true,
      description: true,
    },
  });

  return Response.json({ day: updated });
}

/**
 * DELETE /api/admin/treks/:id/itinerary/:dayId
 *
 * Removes a single itinerary day.
 */
export async function DELETE(_req: NextRequest, { params }: Params) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { id, dayId } = await params;

  const day = await prisma.trekItineraryDay.findUnique({
    where: { id: dayId },
    select: { id: true, trekId: true },
  });

  if (!day || day.trekId !== id) {
    return Response.json({ error: "Itinerary day not found" }, { status: 404 });
  }

  await prisma.trekItineraryDay.delete({ where: { id: dayId } });

  return Response.json({ message: "Day removed" });
}
