import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Users, DollarSign, Mountain, ChevronRight } from "lucide-react";

const DIFFICULTY_COLORS: Record<string, string> = {
  EASY: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  MODERATE: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  STRENUOUS: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  EXTREME: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  FULL: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
};

export default async function TreksPage() {
  const departures = await prisma.trekDeparture.findMany({
    where: { deletedAt: null, status: { in: ["SCHEDULED", "FULL"] }, trek: { deletedAt: null } },
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
          region: { select: { name: true } },
        },
      },
      _count: { select: { bookings: true } },
    },
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Upcoming Treks</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {departures.length} departure{departures.length !== 1 ? "s" : ""} available — book your spot now
          </p>
        </div>

        {departures.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 py-24 text-center">
            <Mountain className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <p className="text-slate-500">No upcoming departures at the moment. Check back soon.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {departures.map((d) => {
              const spotsLeft = d.maxParticipants - d._count.bookings;
              const isFull = d.status === "FULL";
              return (
                <Link
                  key={d.id}
                  href={`/treks/${d.trek.slug}`}
                  className={`block rounded-2xl border bg-white dark:bg-slate-900 overflow-hidden hover:shadow-md transition-shadow ${
                    isFull ? "border-amber-200 dark:border-amber-800" : "border-slate-200 dark:border-slate-800"
                  }`}
                >
                  <div className="flex items-stretch">
                    <div className="h-auto w-36 sm:w-48 bg-slate-100 dark:bg-slate-800 shrink-0 overflow-hidden">
                      {d.trek.coverImageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={d.trek.coverImageUrl} alt={d.trek.title} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full flex items-center justify-center">
                          <Mountain className="h-8 w-8 text-slate-400" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 p-5 flex items-center gap-4">
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="font-bold text-slate-800 dark:text-slate-200 text-lg">{d.trek.title}</h2>
                          <Badge className={STATUS_COLORS[d.status]}>
                            {isFull ? "Full — Waitlist" : "Open"}
                          </Badge>
                          <Badge className={DIFFICULTY_COLORS[d.trek.difficulty]}>{d.trek.difficulty}</Badge>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{d.trek.region.name}</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">{d.trek.description}</p>
                        <div className="flex flex-wrap gap-4 text-sm text-slate-600 dark:text-slate-400 pt-1">
                          <span className="flex items-center gap-1.5 font-medium text-slate-800 dark:text-slate-200">
                            <CalendarDays className="h-4 w-4 text-emerald-500" />
                            {new Date(d.departureDate).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" })}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <DollarSign className="h-4 w-4 text-slate-400" />
                            ${Number(d.pricePerPerson).toLocaleString()} / person
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Users className="h-4 w-4 text-slate-400" />
                            {isFull
                              ? "Fully booked"
                              : `${spotsLeft} spot${spotsLeft !== 1 ? "s" : ""} left`}
                          </span>
                          <span className="text-slate-400">{d.trek.durationDays} days</span>
                        </div>
                      </div>

                      <ChevronRight className="h-5 w-5 text-slate-300 shrink-0" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
