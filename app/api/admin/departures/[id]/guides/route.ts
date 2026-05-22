import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";
import { NextRequest } from "next/server";

type Params = { params: Promise<{ id: string }> };

/**
 * POST /api/admin/departures/:id/guides
 * Assign a company guide to this departure.
 *
 * Body: { guideId, role? }
 */
export async function POST(request: NextRequest, { params }: Params) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { id } = await params;

  const departure = await prisma.trekDeparture.findUnique({
    where: { id, deletedAt: null },
    select: { id: true, status: true },
  });
  if (!departure) return Response.json({ error: "Departure not found" }, { status: 404 });

  let body: { guideId?: string; role?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.guideId) return Response.json({ error: "guideId is required" }, { status: 400 });

  const guide = await prisma.companyGuide.findUnique({
    where: { id: body.guideId, deletedAt: null, isActive: true },
    select: { id: true },
  });
  if (!guide) return Response.json({ error: "Company guide not found or inactive" }, { status: 404 });

  const existing = await prisma.trekDepartureGuide.findUnique({
    where: { departureId_guideId: { departureId: id, guideId: body.guideId } },
  });
  if (existing) return Response.json({ error: "Guide already assigned to this departure" }, { status: 409 });

  const assignment = await prisma.trekDepartureGuide.create({
    data: { departureId: id, guideId: body.guideId, role: body.role ?? null },
    select: {
      id: true,
      role: true,
      assignedAt: true,
      guide: { select: { id: true, fullName: true, email: true, phone: true } },
    },
  });

  return Response.json({ assignment }, { status: 201 });
}

/**
 * DELETE /api/admin/departures/:id/guides
 * Remove a guide assignment.
 *
 * Body: { guideId }
 */
export async function DELETE(request: NextRequest, { params }: Params) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { id } = await params;

  let body: { guideId?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.guideId) return Response.json({ error: "guideId is required" }, { status: 400 });

  const assignment = await prisma.trekDepartureGuide.findUnique({
    where: { departureId_guideId: { departureId: id, guideId: body.guideId } },
  });
  if (!assignment) return Response.json({ error: "Assignment not found" }, { status: 404 });

  await prisma.trekDepartureGuide.delete({
    where: { departureId_guideId: { departureId: id, guideId: body.guideId } },
  });

  return Response.json({ message: "Guide removed from departure" });
}
