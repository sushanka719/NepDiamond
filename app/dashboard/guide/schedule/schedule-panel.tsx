"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Users, DollarSign, Clock, MapPin, Phone, Mail, CheckCircle2 } from "lucide-react";

interface Hire {
  id: string;
  status: string;
  startDate: string;
  endDate: string;
  daysCount: number;
  dailyRate: number;
  totalAmount: number;
  currency: string;
  requirements?: string | null;
  acceptedAt?: string | null;
  completedAt?: string | null;
  requester: { id: string; fullName: string; avatarUrl: string | null; email?: string; phone?: string | null };
}

interface AvailabilityBlock {
  id: string;
  startDate: string;
  endDate: string;
  isBlocked: boolean;
  reason: string | null;
}

interface Props {
  upcomingHires: Hire[];
  pastHires: Hire[];
  availability: AvailabilityBlock[];
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function daysBetween(a: string, b: string) {
  return Math.ceil((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
}

function HireCard({ hire, showStatus = false }: { hire: Hire; showStatus?: boolean }) {
  const daysUntil = daysBetween(new Date().toISOString(), hire.startDate);
  const isOngoing = new Date(hire.startDate) <= new Date() && new Date(hire.endDate) >= new Date();

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 overflow-hidden">
            {hire.requester.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={hire.requester.avatarUrl} alt={hire.requester.fullName} className="h-full w-full object-cover" />
            ) : (
              <span className="text-xs font-semibold text-slate-500">{getInitials(hire.requester.fullName)}</span>
            )}
          </div>
          <div>
            <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{hire.requester.fullName}</p>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
              {hire.requester.email && (
                <span className="flex items-center gap-0.5"><Mail className="h-3 w-3" />{hire.requester.email}</span>
              )}
              {hire.requester.phone && (
                <span className="flex items-center gap-0.5"><Phone className="h-3 w-3" />{hire.requester.phone}</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {showStatus && (
            <Badge className={hire.status === "COMPLETED"
              ? "bg-slate-100 text-slate-500 dark:bg-slate-800"
              : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"}>
              {hire.status}
            </Badge>
          )}
          {isOngoing && !showStatus && (
            <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
              Ongoing
            </Badge>
          )}
          {!isOngoing && !showStatus && daysUntil <= 7 && daysUntil > 0 && (
            <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
              In {daysUntil}d
            </Badge>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-3 text-xs text-slate-600 dark:text-slate-400">
        <span className="flex items-center gap-1">
          <CalendarDays className="h-3.5 w-3.5 text-emerald-500" />
          {new Date(hire.startDate).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
          {" – "}
          {new Date(hire.endDate).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
        </span>
        <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{hire.daysCount} day{hire.daysCount !== 1 ? "s" : ""}</span>
        <span className="flex items-center gap-1 font-semibold text-slate-800 dark:text-slate-200">
          <DollarSign className="h-3.5 w-3.5 text-emerald-500" />{hire.totalAmount.toLocaleString()} {hire.currency}
        </span>
      </div>

      {hire.requirements && (
        <p className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-lg px-3 py-2 line-clamp-2">
          {hire.requirements}
        </p>
      )}
    </div>
  );
}

export default function SchedulePanel({ upcomingHires, pastHires, availability }: Props) {
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");

  const tabs = [
    { key: "upcoming" as const, label: "Upcoming", count: upcomingHires.length },
    { key: "past" as const, label: "History", count: pastHires.length },
  ];

  return (
    <div className="space-y-6">
      {/* Availability blocks */}
      {availability.length > 0 && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-slate-400" />
            <h2 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">Availability Blocks</h2>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {availability.map((a) => (
              <div key={a.id} className="px-4 py-3 flex items-center gap-3">
                <div className={`h-2 w-2 rounded-full shrink-0 ${a.isBlocked ? "bg-red-400" : "bg-emerald-400"}`} />
                <span className="text-xs text-slate-600 dark:text-slate-400">
                  {new Date(a.startDate).toLocaleDateString("en-US", { day: "numeric", month: "short" })}
                  {" – "}
                  {new Date(a.endDate).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
                </span>
                <Badge className={a.isBlocked
                  ? "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400 text-[10px]"
                  : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 text-[10px]"}>
                  {a.isBlocked ? "Blocked" : "Available"}
                </Badge>
                {a.reason && <span className="text-xs text-slate-400 truncate">{a.reason}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === t.key
                ? "border-emerald-600 text-emerald-600 dark:text-emerald-400"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            {t.label}
            {t.count > 0 && (
              <span className="ml-1.5 text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-full px-1.5 py-0.5">
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === "upcoming" && (
        <>
          {upcomingHires.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-700 py-16 text-center">
              <CalendarDays className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-sm text-slate-500">No upcoming hires.</p>
              <p className="text-xs text-slate-400 mt-1">Accepted hire requests will appear here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingHires.map((h) => <HireCard key={h.id} hire={h} />)}
            </div>
          )}
        </>
      )}

      {tab === "past" && (
        <>
          {pastHires.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-700 py-16 text-center">
              <CheckCircle2 className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-sm text-slate-500">No past hires yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pastHires.map((h) => <HireCard key={h.id} hire={h} showStatus />)}
            </div>
          )}
        </>
      )}
    </div>
  );
}
