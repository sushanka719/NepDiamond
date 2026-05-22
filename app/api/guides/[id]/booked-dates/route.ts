import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

/**
 * GET /api/guides/[id]/booked-dates
 *
 * Returns all booked date ranges for a guide (PENDING + ACCEPTED hires).
 * Public endpoint — no auth required.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const hires = await prisma.guideHire.findMany({
    where: {
      guideId: id,
      status: { in: ["PENDING", "ACCEPTED"] },
      deletedAt: null,
    },
    select: { startDate: true, endDate: true },
  });

  const ranges = hires.map((h) => ({
    startDate: h.startDate.toISOString().split("T")[0],
    endDate: h.endDate.toISOString().split("T")[0],
  }));

  return Response.json({ ranges });
}
