"use client";

import { Star, TrendingUp, CheckCircle2, Clock, DollarSign, Calendar } from "lucide-react";

interface MonthEntry { month: string; earnings: number; hires: number }
interface RecentHire {
  id: string;
  totalAmount: number;
  currency: string;
  daysCount: number;
  startDate: string;
  endDate: string;
  completedAt: string | null;
  requester: { fullName: string; avatarUrl: string | null };
}
interface Stats {
  lifetimeEarnings: number;
  completedHires: number;
  avgPerHire: number;
  thisMonthEarnings: number;
  thisYearEarnings: number;
  pendingEarnings: number;
  pendingHires: number;
  avgRating: number | null;
  reviewCount: number;
}
interface Props {
  data: { currency: string; stats: Stats; monthlyBreakdown: MonthEntry[]; recentCompleted: RecentHire[] };
}

function fmt(n: number, currency: string) {
  return `${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} ${currency}`;
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

export default function EarningsPanel({ data: { currency, stats, monthlyBreakdown, recentCompleted } }: Props) {
  const maxEarnings = Math.max(...monthlyBreakdown.map((m) => m.earnings), 1);

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Lifetime Earnings",
            value: fmt(stats.lifetimeEarnings, currency),
            sub: `${stats.completedHires} completed hire${stats.completedHires !== 1 ? "s" : ""}`,
            icon: TrendingUp,
            color: "text-emerald-600",
            bg: "bg-emerald-50 dark:bg-emerald-950/30",
          },
          {
            label: "This Month",
            value: fmt(stats.thisMonthEarnings, currency),
            sub: "Current month",
            icon: Calendar,
            color: "text-blue-600",
            bg: "bg-blue-50 dark:bg-blue-950/30",
          },
          {
            label: "This Year",
            value: fmt(stats.thisYearEarnings, currency),
            sub: new Date().getFullYear().toString(),
            icon: DollarSign,
            color: "text-violet-600",
            bg: "bg-violet-50 dark:bg-violet-950/30",
          },
          {
            label: "Pending",
            value: fmt(stats.pendingEarnings, currency),
            sub: `${stats.pendingHires} active hire${stats.pendingHires !== 1 ? "s" : ""}`,
            icon: Clock,
            color: "text-amber-600",
            bg: "bg-amber-50 dark:bg-amber-950/30",
          },
        ].map(({ label, value, sub, icon: Icon, color, bg }) => (
          <div key={label} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
            <div className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${bg} mb-3`}>
              <Icon className={`h-4 w-4 ${color}`} />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* Secondary stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center shrink-0">
            <Star className="h-4 w-4 text-amber-500" />
          </div>
          <div>
            <p className="text-xs text-slate-500">Avg Rating</p>
            <p className="font-bold text-slate-900 dark:text-white">
              {stats.avgRating !== null ? (
                <>{stats.avgRating} <span className="text-xs font-normal text-slate-400">/ 5 ({stats.reviewCount})</span></>
              ) : (
                <span className="text-sm font-normal text-slate-400">No reviews yet</span>
              )}
            </p>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center shrink-0">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs text-slate-500">Avg per Hire</p>
            <p className="font-bold text-slate-900 dark:text-white">{fmt(stats.avgPerHire, currency)}</p>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center shrink-0">
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-slate-500">Total Hires</p>
            <p className="font-bold text-slate-900 dark:text-white">
              {stats.completedHires} completed
              {stats.pendingHires > 0 && <span className="text-xs font-normal text-amber-500 ml-1">+{stats.pendingHires} ongoing</span>}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly breakdown */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800">
            <h2 className="font-semibold text-slate-800 dark:text-slate-200">Monthly Earnings</h2>
            <p className="text-xs text-slate-400 mt-0.5">Last 12 months</p>
          </div>
          <div className="p-4 space-y-2">
            {monthlyBreakdown.slice().reverse().map((m) => (
              <div key={m.month} className="flex items-center gap-3">
                <span className="text-xs text-slate-500 w-20 shrink-0">{m.month}</span>
                <div className="flex-1 h-5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 dark:bg-emerald-600 rounded-full transition-all"
                    style={{ width: `${(m.earnings / maxEarnings) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300 w-24 text-right shrink-0">
                  {m.earnings > 0 ? fmt(m.earnings, currency) : <span className="text-slate-400">—</span>}
                </span>
                {m.hires > 0 && (
                  <span className="text-xs text-slate-400 w-10 shrink-0">{m.hires}×</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Recent completed hires */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800">
            <h2 className="font-semibold text-slate-800 dark:text-slate-200">Recent Completed</h2>
            <p className="text-xs text-slate-400 mt-0.5">Last 5 completed hires</p>
          </div>
          {recentCompleted.length === 0 ? (
            <div className="py-12 text-center">
              <CheckCircle2 className="h-8 w-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No completed hires yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentCompleted.map((h) => (
                <div key={h.id} className="p-4 flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 overflow-hidden">
                    {h.requester.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={h.requester.avatarUrl} alt={h.requester.fullName} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-xs font-semibold text-slate-500">
                        {getInitials(h.requester.fullName)}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{h.requester.fullName}</p>
                    <p className="text-xs text-slate-400">
                      {new Date(h.startDate).toLocaleDateString("en-US", { day: "numeric", month: "short" })}
                      {" – "}
                      {new Date(h.endDate).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
                      {" · "}{h.daysCount} day{h.daysCount !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">+{fmt(h.totalAmount, h.currency)}</p>
                    {h.completedAt && (
                      <p className="text-[10px] text-slate-400">
                        {new Date(h.completedAt).toLocaleDateString("en-US", { day: "numeric", month: "short" })}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
