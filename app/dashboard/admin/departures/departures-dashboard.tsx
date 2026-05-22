"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, CalendarDays, Users, DollarSign, ArrowRight, Mountain } from "lucide-react";

interface Departure {
  id: string;
  departureDate: string;
  returnDate: string | null;
  pricePerPerson: number;
  maxParticipants: number;
  currency: string;
  status: string;
  notes: string | null;
  createdAt: string;
  trek: { id: string; title: string; slug: string; difficulty: string; coverImageUrl: string | null };
  _count: { bookings: number; guides: number };
}

interface Props { initialDepartures: Departure[] }

const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  FULL: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  DEPARTED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  COMPLETED: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

const DIFFICULTY_COLORS: Record<string, string> = {
  EASY: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  MODERATE: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  STRENUOUS: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  EXTREME: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

const ALL_STATUSES = ["ALL", "SCHEDULED", "FULL", "DEPARTED", "COMPLETED", "CANCELLED"] as const;

export default function DeparturesDashboard({ initialDepartures }: Props) {
  const [departures] = useState<Departure[]>(initialDepartures);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const filtered = departures.filter((d) => {
    const matchSearch = d.trek.title.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "ALL" || d.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const counts = ALL_STATUSES.reduce((acc, s) => {
    acc[s] = s === "ALL" ? departures.length : departures.filter((d) => d.status === s).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <>
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {ALL_STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                statusFilter === s
                  ? "bg-emerald-600 text-white border-emerald-600"
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-emerald-300"
              }`}
            >
              {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()} ({counts[s]})
              {s === "FULL" && counts[s] > 0 && (
                <span className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-white text-[10px] font-bold">!</span>
              )}
            </button>
          ))}
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by trek name…" className="pl-9" />
        </div>
      </div>

      {statusFilter === "FULL" && filtered.length > 0 && (
        <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 p-4 flex items-start gap-3">
          <span className="text-amber-600 dark:text-amber-400 text-lg">⚡</span>
          <div>
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
              {filtered.length} departure{filtered.length > 1 ? "s" : ""} ready for departure
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
              These are fully booked. Open each one to assign company guides and mark as Departed.
            </p>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-700 py-16 text-center">
            <CalendarDays className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-500">
              {search || statusFilter !== "ALL" ? "No departures match your filters." : "No departures yet."}
            </p>
          </div>
        ) : (
          filtered.map((d) => {
            const spotsLeft = d.maxParticipants - d._count.bookings;
            const isFull = d.status === "FULL";
            return (
              <div
                key={d.id}
                className={`rounded-xl border bg-white dark:bg-slate-900 p-4 flex items-center gap-4 hover:border-emerald-200 dark:hover:border-emerald-800 transition-colors ${
                  isFull ? "border-amber-300 dark:border-amber-700" : "border-slate-200 dark:border-slate-800"
                }`}
              >
                <div className="h-12 w-12 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 overflow-hidden">
                  {d.trek.coverImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={d.trek.coverImageUrl} alt={d.trek.title} className="h-full w-full object-cover" />
                  ) : (
                    <Mountain className="h-5 w-5 text-slate-400" />
                  )}
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm truncate">{d.trek.title}</h3>
                    <Badge className={STATUS_COLORS[d.status]}>{d.status}</Badge>
                    <Badge className={DIFFICULTY_COLORS[d.trek.difficulty]}>{d.trek.difficulty}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <CalendarDays className="h-3 w-3" />
                      {new Date(d.departureDate).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                    <span className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />${d.pricePerPerson}/person
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {d._count.bookings}/{d.maxParticipants} booked
                      {d.status === "SCHEDULED" && spotsLeft > 0 && (
                        <span className="text-emerald-600 dark:text-emerald-400">· {spotsLeft} left</span>
                      )}
                    </span>
                    {d._count.guides > 0 && (
                      <span>{d._count.guides} guide{d._count.guides > 1 ? "s" : ""} assigned</span>
                    )}
                  </div>
                </div>

                <Link
                  href={`/dashboard/admin/departures/${d.id}`}
                  className="p-2 rounded-md text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors shrink-0"
                  title="Manage departure"
                >
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            );
          })
        )}
      </div>
    </>
  );
}
