import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

type Params = { params: Promise<{ slug: string }> };

/**
 * GET /api/treks/:slug
 * Public trek detail with itinerary, media, and active departures.
 */
export async function GET(_req: NextRequest, { params }: Params) {
  const { slug } = await params;

  const trek = await prisma.trek.findUnique({
    where: { slug, deletedAt: null },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      difficulty: true,
      durationDays: true,
      pricePerPerson: true,
      maxParticipants: true,
      coverImageUrl: true,
      region: { select: { id: true, name: true, slug: true } },
      itinerary: {
        select: { id: true, dayNumber: true, title: true, description: true },
        orderBy: { dayNumber: "asc" },
      },
      media: {
        select: { id: true, url: true, mediaType: true, caption: true, sortOrder: true },
        orderBy: { sortOrder: "asc" },
      },
      departures: {
        where: { deletedAt: null, status: { in: ["SCHEDULED", "FULL"] as ("SCHEDULED" | "FULL")[] } },
        select: {
          id: true,
          departureDate: true,
          returnDate: true,
          pricePerPerson: true,
          maxParticipants: true,
          currency: true,
          status: true,
          _count: { select: { bookings: true } },
        },
        orderBy: { departureDate: "asc" },
      },
    },
  });

  if (!trek) return Response.json({ error: "Trek not found" }, { status: 404 });

  return Response.json({ trek });
}
