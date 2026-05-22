import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

/**
 * GET /api/treks
 * Public listing of all SCHEDULED and FULL departures with trek info.
 *
 * Query: page, limit, regionId, difficulty, search
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 20)));
  const skip = (page - 1) * limit;
  const regionId = searchParams.get("regionId");
  const difficulty = searchParams.get("difficulty");
  const search = searchParams.get("search");

  const where = {
    deletedAt: null,
    status: { in: ["SCHEDULED", "FULL"] as ("SCHEDULED" | "FULL")[] },
    trek: {
      deletedAt: null,
      ...(regionId && { regionId }),
      ...(difficulty && { difficulty: difficulty as "EASY" | "MODERATE" | "STRENUOUS" | "EXTREME" }),
      ...(search && { title: { contains: search, mode: "insensitive" as const } }),
    },
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
        trek: {
          select: {
            id: true,
            title: true,
            slug: true,
            description: true,
            difficulty: true,
            durationDays: true,
            coverImageUrl: true,
            region: { select: { id: true, name: true, slug: true } },
          },
        },
        _count: { select: { bookings: true } },
      },
    }),
    prisma.trekDeparture.count({ where }),
  ]);

  return Response.json({
    items: departures,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  });
}
