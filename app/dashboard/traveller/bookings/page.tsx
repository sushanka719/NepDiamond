import { createSupabaseServerClient } from "@/lib/supabase-server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Backpack } from "lucide-react";
import BookingsPanel from "./bookings-panel";

export default async function TravellerBookingsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const bookings = await prisma.trekBooking.findMany({
    where: { userId: user.id, deletedAt: null },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      status: true,
      amount: true,
      currency: true,
      confirmedAt: true,
      cancelledAt: true,
      createdAt: true,
      payment: { select: { id: true, status: true } },
      departure: {
        select: {
          id: true,
          departureDate: true,
          returnDate: true,
          status: true,
          trek: {
            select: { id: true, title: true, slug: true, coverImageUrl: true, difficulty: true, durationDays: true },
          },
        },
      },
    },
  });

  const serialized = bookings.map((b) => ({
    ...b,
    amount: Number(b.amount),
    confirmedAt: b.confirmedAt?.toISOString() ?? null,
    cancelledAt: b.cancelledAt?.toISOString() ?? null,
    createdAt: b.createdAt.toISOString(),
    departure: {
      ...b.departure,
      departureDate: b.departure.departureDate.toISOString(),
      returnDate: b.departure.returnDate?.toISOString() ?? null,
    },
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Bookings</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {bookings.length} trek booking{bookings.length !== 1 ? "s" : ""}
        </p>
      </div>

      {bookings.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-700 py-20 text-center">
          <Backpack className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-sm text-slate-500 mb-4">You haven&apos;t booked any treks yet.</p>
          <Link
            href="/treks"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors"
          >
            Browse Upcoming Treks <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <BookingsPanel bookings={serialized} />
      )}

      <div className="pt-2">
        <Link
          href="/treks"
          className="inline-flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400 hover:underline"
        >
          Browse more treks <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
