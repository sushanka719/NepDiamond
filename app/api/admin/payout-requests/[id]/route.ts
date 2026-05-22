import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";
import { NextRequest } from "next/server";

type Params = { params: Promise<{ id: string }> };

/**
 * PATCH /api/admin/payout-requests/:id
 * Update payout request status.
 * Body: { status: "PROCESSING" | "PAID" | "REJECTED", adminNote? }
 */
export async function PATCH(request: NextRequest, { params }: Params) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { id } = await params;

  let body: { status?: string; adminNote?: string };
  try { body = await request.json(); } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const allowed = ["PROCESSING", "PAID", "REJECTED"];
  if (!body.status || !allowed.includes(body.status)) {
    return Response.json({ error: `status must be one of: ${allowed.join(", ")}` }, { status: 400 });
  }

  const existing = await prisma.payoutRequest.findUnique({
    where: { id },
    select: { status: true },
  });
  if (!existing) return Response.json({ error: "Payout request not found" }, { status: 404 });
  if (existing.status === "PAID") return Response.json({ error: "Already paid out" }, { status: 409 });

  const updated = await prisma.payoutRequest.update({
    where: { id },
    data: {
      status: body.status as "PROCESSING" | "PAID" | "REJECTED",
      adminNote: body.adminNote?.trim() || null,
      processedAt: body.status === "PAID" ? new Date() : undefined,
    },
    select: { id: true, status: true, adminNote: true, processedAt: true },
  });

  return Response.json({ payoutRequest: updated });
}
