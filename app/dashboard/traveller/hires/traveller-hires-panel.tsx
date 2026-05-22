"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CalendarDays, DollarSign, User, X } from "lucide-react";

interface HireGuide {
  id: string;
  user: { fullName: string; avatarUrl: string | null };
}

interface Hire {
  id: string;
  status: string;
  startDate: string;
  endDate: string;
  daysCount: number;
  dailyRate: number;
  totalAmount: number;
  currency: string;
  requirements: string | null;
  rejectionReason: string | null;
  acceptedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  guide: HireGuide;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING:   { label: "Pending",   color: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800" },
  ACCEPTED:  { label: "Accepted",  color: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800" },
  REJECTED:  { label: "Rejected",  color: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800" },
  COMPLETED: { label: "Completed", color: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800" },
  CANCELLED: { label: "Cancelled", color: "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700" },
};

const TABS = ["ALL", "PENDING", "ACCEPTED", "REJECTED", "COMPLETED", "CANCELLED"] as const;

export default function TravellerHiresPanel({ initialHires }: { initialHires: Hire[] }) {
  const [hires, setHires] = useState(initialHires);
  const [tab, setTab] = useState<typeof TABS[number]>("ALL");
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);

  const filtered = tab === "ALL" ? hires : hires.filter((h) => h.status === tab);

  async function handleCancel(id: string) {
    setCancelling(id);
    try {
      const res = await fetch(`/api/guide-hires/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to cancel hire");
        return;
      }
      setHires((prev) => prev.map((h) => h.id === id ? { ...h, status: "CANCELLED", cancelledAt: new Date().toISOString() } : h));
      toast.success("Hire request cancelled.");
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setCancelling(null);
    }
  }

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex flex-wrap gap-1.5">
        {TABS.map((t) => {
          const count = t === "ALL" ? hires.length : hires.filter((h) => h.status === t).length;
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                tab === t
                  ? "bg-emerald-600 text-white border-emerald-600"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-emerald-300"
              }`}
            >
              {t === "ALL" ? "All" : STATUS_LABELS[t].label} ({count})
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400 text-sm">
          No hire requests found.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((hire) => {
            const s = STATUS_LABELS[hire.status] ?? { label: hire.status, color: "" };
            const initials = hire.guide.user.fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
            const canCancel = hire.status === "PENDING" || hire.status === "ACCEPTED";

            return (
              <div
                key={hire.id}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {hire.guide.user.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={hire.guide.user.avatarUrl} alt={hire.guide.user.fullName} className="h-10 w-10 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-emerald-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                        {initials}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-slate-400" />
                        {hire.guide.user.fullName}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Requested {new Date(hire.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${s.color}`}>
                    {s.label}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                  <div className="space-y-0.5">
                    <p className="text-xs text-slate-400 flex items-center gap-1"><CalendarDays className="h-3 w-3" /> Start</p>
                    <p className="font-medium text-slate-700 dark:text-slate-300">{new Date(hire.startDate).toLocaleDateString()}</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs text-slate-400 flex items-center gap-1"><CalendarDays className="h-3 w-3" /> End</p>
                    <p className="font-medium text-slate-700 dark:text-slate-300">{new Date(hire.endDate).toLocaleDateString()}</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs text-slate-400 flex items-center gap-1"><DollarSign className="h-3 w-3" /> Total</p>
                    <p className="font-medium text-slate-700 dark:text-slate-300">
                      {hire.totalAmount.toFixed(0)} {hire.currency}
                      <span className="text-xs text-slate-400 ml-1">({hire.daysCount}d)</span>
                    </p>
                  </div>
                </div>

                {hire.requirements && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2">
                    {hire.requirements}
                  </p>
                )}

                {hire.rejectionReason && (
                  <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 rounded-lg px-3 py-2">
                    Rejection reason: {hire.rejectionReason}
                  </p>
                )}

                {canCancel && (
                  <div className="pt-1">
                    <Button
                      onClick={() => setConfirmCancelId(hire.id)}
                      disabled={cancelling === hire.id}
                      className="h-8 text-xs px-3 bg-transparent border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/20"
                    >
                      <X className="h-3.5 w-3.5 mr-1" />
                      {cancelling === hire.id ? "Cancelling…" : "Cancel Request"}
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      {/* Cancel hire confirmation dialog */}
      <Dialog open={!!confirmCancelId} onOpenChange={(o) => !o && setConfirmCancelId(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Cancel hire request?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-500 dark:text-slate-400 py-2">
            Are you sure you want to cancel this hire request? This cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmCancelId(null)} disabled={!!cancelling}>
              Keep it
            </Button>
            <Button
              onClick={() => { const id = confirmCancelId!; setConfirmCancelId(null); handleCancel(id); }}
              disabled={!!cancelling}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Yes, cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
