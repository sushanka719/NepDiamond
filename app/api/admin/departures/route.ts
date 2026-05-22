import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";
import { NextRequest } from "next/server";

const VALID_STATUSES = ["SCHEDULED", "FULL", "DEPARTED", "COMPLETED", "CANCELLED"] as const;

/**
 * GET /api/admin/departures
 * Admin dashboard view of all departures across all treks.
 *
 * Query params:
 *   status   DepartureStatus
 *   trekId   UUID
 *   page     number (default 1)
 *   limit    number (default 20)
 */
export async function GET(request: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { searchParams } = request.nextUrl;
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 20)));
  const skip = (page - 1) * limit;
  const status = searchParams.get("status");
  const trekId = searchParams.get("trekId");

  if (status && !VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])) {
    return Response.json({ error: "Invalid status value" }, { status: 400 });
  }

  const where = {
    deletedAt: null,
    ...(status && { status: status as (typeof VALID_STATUSES)[number] }),
    ...(trekId && { trekId }),
  };

  const [departures, total] = await Promise.all([
    prisma.trekDeparture.findMany({
      where,
      skip,
      take: limit,
      orderBy: { departureDate: "asc" },
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
        trek: { select: { id: true, title: true, slug: true, difficulty: true, coverImageUrl: true } },
        _count: { select: { bookings: true, guides: true } },
      },
    }),
    prisma.trekDeparture.count({ where }),
  ]);

  return Response.json({
    items: departures,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  });
}
