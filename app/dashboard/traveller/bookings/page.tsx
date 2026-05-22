import { createSupabaseServerClient } from "@/lib/supabase-server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Mountain, DollarSign, ChevronRight, Backpack } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  CONFIRMED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  CANCELLED: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-500",
  REFUNDED: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
};

const DEPARTURE_STATUS_COLORS: Record<string, string> = {
  SCHEDULED: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  FULL: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  DEPARTED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  COMPLETED: "bg-slate-100 text-slate-500",
  CANCELLED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

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
        <div className="space-y-3">
          {bookings.map((b) => (
            <div
              key={b.id}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 flex items-center gap-4"
            >
              <div className="h-14 w-14 rounded-lg bg-slate-100 dark:bg-slate-800 shrink-0 overflow-hidden flex items-center justify-center">
                {b.departure.trek.coverImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={b.departure.trek.coverImageUrl} alt={b.departure.trek.title} className="h-full w-full object-cover" />
                ) : (
                  <Mountain className="h-6 w-6 text-slate-400" />
                )}
              </div>

              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{b.departure.trek.title}</h3>
                  <Badge className={STATUS_COLORS[b.status]}>{b.status}</Badge>
                  <Badge className={DEPARTURE_STATUS_COLORS[b.departure.status] ?? ""}>{b.departure.status}</Badge>
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    <CalendarDays className="h-3 w-3" />
                    {new Date(b.departure.departureDate).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
                    {b.departure.returnDate && (
                      <> → {new Date(b.departure.returnDate).toLocaleDateString("en-US", { day: "numeric", month: "short" })}</>
                    )}
                  </span>
                  <span className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />${Number(b.amount).toLocaleString()}
                  </span>
                  <span>{b.departure.trek.durationDays} days</span>
                </div>
              </div>

              <Link
                href={`/treks/${b.departure.trek.slug}`}
                className="p-1.5 rounded-md text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors shrink-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          ))}
        </div>
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
