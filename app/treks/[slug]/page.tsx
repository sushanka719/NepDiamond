import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { notFound } from "next/navigation";
import TrekDetailClient from "./trek-detail-client";

type Params = { params: Promise<{ slug: string }> };

export default async function TrekDetailPage({ params }: Params) {
  const { slug } = await params;

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

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
      region: { select: { name: true, slug: true } },
      itinerary: {
        select: { id: true, dayNumber: true, title: true, description: true },
        orderBy: { dayNumber: "asc" },
      },
      media: {
        select: { id: true, url: true, mediaType: true, caption: true },
        orderBy: { sortOrder: "asc" },
      },
      departures: {
        where: { deletedAt: null, status: { in: ["SCHEDULED", "FULL"] } },
        orderBy: { departureDate: "asc" },
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
      },
    },
  });

  if (!trek) notFound();

  // Check if user has any existing bookings for these departures
  let userBookedDepartureIds = new Set<string>();
  if (user) {
    const bookings = await prisma.trekBooking.findMany({
      where: {
        userId: user.id,
        departureId: { in: trek.departures.map((d) => d.id) },
        status: { in: ["CONFIRMED", "PENDING"] },
        deletedAt: null,
      },
      select: { departureId: true },
    });
    userBookedDepartureIds = new Set(bookings.map((b) => b.departureId));
  }

  const serialized = {
    ...trek,
    pricePerPerson: Number(trek.pricePerPerson),
    departures: trek.departures.map((d) => ({
      ...d,
      pricePerPerson: Number(d.pricePerPerson),
      departureDate: d.departureDate.toISOString(),
      returnDate: d.returnDate?.toISOString() ?? null,
    })),
  };

  return (
    <TrekDetailClient
      trek={serialized}
      isLoggedIn={!!user}
      userBookedDepartureIds={Array.from(userBookedDepartureIds)}
    />
  );
}
