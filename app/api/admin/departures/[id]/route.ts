import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";
import { NextRequest } from "next/server";

type Params = { params: Promise<{ id: string }> };

/**
 * GET /api/admin/departures/:id
 * Full departure detail including bookings and assigned guides.
 */
export async function GET(_req: NextRequest, { params }: Params) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { id } = await params;

  const departure = await prisma.trekDeparture.findUnique({
    where: { id, deletedAt: null },
    select: {
      id: true,
      departureDate: true,
      returnDate: true,
      pricePerPerson: true,
      maxParticipants: true,
      currency: true,
      status: true,
      notes: true,
      rescheduledFromId: true,
      createdAt: true,
      updatedAt: true,
      trek: {
        select: {
          id: true,
          title: true,
          slug: true,
          difficulty: true,
          durationDays: true,
          coverImageUrl: true,
          region: { select: { id: true, name: true } },
        },
      },
      bookings: {
        where: { deletedAt: null },
        select: {
          id: true,
          status: true,
          amount: true,
          currency: true,
          confirmedAt: true,
          createdAt: true,
          user: { select: { id: true, fullName: true, email: true, avatarUrl: true, phone: true } },
        },
        orderBy: { createdAt: "asc" },
      },
      guides: {
        select: {
          id: true,
          role: true,
          assignedAt: true,
          guide: { select: { id: true, fullName: true, email: true, phone: true, licenseNumber: true } },
        },
      },
    },
  });

  if (!departure) return Response.json({ error: "Departure not found" }, { status: 404 });

  return Response.json({ departure });
}

/**
 * DELETE /api/admin/departures/:id
 * Soft-delete a departure (only if SCHEDULED and has no confirmed bookings).
 */
export async function DELETE(_req: NextRequest, { params }: Params) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { id } = await params;

  const departure = await prisma.trekDeparture.findUnique({
    where: { id, deletedAt: null },
    select: { id: true, status: true, _count: { select: { bookings: true } } },
  });
  if (!departure) return Response.json({ error: "Departure not found" }, { status: 404 });
  if (departure.status !== "SCHEDULED") {
    return Response.json({ error: "Only SCHEDULED departures can be deleted" }, { status: 409 });
  }

  const confirmedCount = await prisma.trekBooking.count({
    where: { departureId: id, status: "CONFIRMED", deletedAt: null },
  });
  if (confirmedCount > 0) {
    return Response.json({ error: "Cannot delete a departure with confirmed bookings" }, { status: 409 });
  }

  await prisma.trekDeparture.update({ where: { id }, data: { deletedAt: new Date() } });

  return Response.json({ message: "Departure deleted" });
}
