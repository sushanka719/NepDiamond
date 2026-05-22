import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";
import { NextRequest } from "next/server";

type Params = { params: Promise<{ id: string }> };

const TRANSITIONS: Record<string, string[]> = {
  SCHEDULED: ["FULL", "CANCELLED"],
  FULL: ["DEPARTED", "SCHEDULED", "CANCELLED"],
  DEPARTED: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

/**
 * PATCH /api/admin/departures/:id/status
 * Advance or revert departure status.
 *
 * Body: { status: DepartureStatus }
 */
export async function PATCH(request: NextRequest, { params }: Params) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { id } = await params;

  let body: { status?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.status) return Response.json({ error: "status is required" }, { status: 400 });

  const departure = await prisma.trekDeparture.findUnique({
    where: { id, deletedAt: null },
    select: { id: true, status: true },
  });
  if (!departure) return Response.json({ error: "Departure not found" }, { status: 404 });

  const allowed = TRANSITIONS[departure.status] ?? [];
  if (!allowed.includes(body.status)) {
    return Response.json(
      { error: `Cannot transition from ${departure.status} to ${body.status}` },
      { status: 409 }
    );
  }

  const updated = await prisma.trekDeparture.update({
    where: { id },
    data: { status: body.status as "SCHEDULED" | "FULL" | "DEPARTED" | "COMPLETED" | "CANCELLED" },
    select: { id: true, status: true, updatedAt: true },
  });

  return Response.json({ departure: updated });
}
