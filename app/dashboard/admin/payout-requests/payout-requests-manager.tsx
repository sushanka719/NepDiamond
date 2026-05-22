"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, DollarSign, User, CheckCircle2, Clock, XCircle, Loader2 } from "lucide-react";

interface PayoutRequest {
  id: string;
  status: string;
  guideNote: string | null;
  adminNote: string | null;
  processedAt: string | null;
  createdAt: string;
  guide: {
    id: string;
    currency: string;
    user: { fullName: string; email: string; avatarUrl: string | null };
  };
  payment: {
    id: string;
    amount: number;
    currency: string;
    paidAt: string | null;
    guideHire: {
      daysCount: number;
      startDate: string;
      endDate: string;
      requester: { fullName: string };
    };
  };
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  PENDING:    { label: "Pending",    color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",   icon: Clock },
  PROCESSING: { label: "Processing", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",       icon: Loader2 },
  PAID:       { label: "Paid",       color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400", icon: CheckCircle2 },
  REJECTED:   { label: "Rejected",   color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",           icon: XCircle },
};

const TABS = ["ALL", "PENDING", "PROCESSING", "PAID", "REJECTED"] as const;

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

export default function PayoutRequestsManager({ initialRequests }: { initialRequests: PayoutRequest[] }) {
  const [requests, setRequests] = useState(initialRequests);
  const [tab, setTab] = useState<typeof TABS[number]>("ALL");
  const [processing, setProcessing] = useState<string | null>(null);
  const [noteInputs, setNoteInputs] = useState<Record<string, string>>({});

  const filtered = tab === "ALL" ? requests : requests.filter((r) => r.status === tab);
  const pendingCount = requests.filter((r) => r.status === "PENDING").length;

  async function updateStatus(id: string, status: string) {
    setProcessing(id);
    try {
      const res = await fetch(`/api/admin/payout-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, adminNote: noteInputs[id] }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Failed to update"); return; }
      setRequests((prev) => prev.map((r) => r.id === id ? { ...r, ...data.payoutRequest } : r));
      toast.success(`Payout marked as ${status.toLowerCase()}`);
    } finally {
      setProcessing(null);
    }
  }

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex flex-wrap gap-1.5">
        {TABS.map((t) => {
          const count = t === "ALL" ? requests.length : requests.filter((r) => r.status === t).length;
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border relative ${
                tab === t
                  ? "bg-emerald-600 text-white border-emerald-600"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-emerald-300"
              }`}
            >
              {t === "ALL" ? "All" : STATUS_CONFIG[t]?.label ?? t} ({count})
              {t === "PENDING" && pendingCount > 0 && tab !== "PENDING" && (
                <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-red-500" />
              )}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400 text-sm rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
          No payout requests found.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((req) => {
            const conf = STATUS_CONFIG[req.status] ?? STATUS_CONFIG.PENDING;
            const StatusIcon = conf.icon;
            const guideInitials = getInitials(req.guide.user.fullName);
            const isActive = processing === req.id;
            const canAct = req.status === "PENDING" || req.status === "PROCESSING";

            return (
              <div key={req.id} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {req.guide.user.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={req.guide.user.avatarUrl} alt={req.guide.user.fullName} className="h-10 w-10 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-emerald-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                        {guideInitials}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                        <User className="h-3.5 w-3.5 text-slate-400" />{req.guide.user.fullName}
                      </p>
                      <p className="text-xs text-slate-400">{req.guide.user.email}</p>
                    </div>
                  </div>
                  <Badge className={conf.color}>
                    <StatusIcon className="h-3 w-3 mr-1" />{conf.label}
                  </Badge>
                </div>

                {/* Hire details */}
                <div className="rounded-lg bg-slate-50 dark:bg-slate-800 px-4 py-3 space-y-1.5">
                  <div className="flex flex-wrap gap-4 text-xs text-slate-600 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3 text-emerald-500" />
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {req.payment.amount.toLocaleString()} {req.payment.currency}
                      </span>
                    </span>
                    <span className="flex items-center gap-1">
                      <CalendarDays className="h-3 w-3" />
                      {new Date(req.payment.guideHire.startDate).toLocaleDateString("en-US", { day: "numeric", month: "short" })}
                      {" – "}
                      {new Date(req.payment.guideHire.endDate).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                    <span>{req.payment.guideHire.daysCount} days</span>
                    <span className="text-slate-400">Traveller: {req.payment.guideHire.requester.fullName}</span>
                  </div>
                  {req.payment.paidAt && (
                    <p className="text-xs text-slate-400">Paid by traveller: {new Date(req.payment.paidAt).toLocaleDateString()}</p>
                  )}
                </div>

                {req.guideNote && (
                  <p className="text-xs text-slate-600 dark:text-slate-400 italic bg-amber-50 dark:bg-amber-950/20 px-3 py-2 rounded-lg border border-amber-100 dark:border-amber-900">
                    &quot;{req.guideNote}&quot;
                  </p>
                )}

                {/* Admin actions */}
                {canAct && (
                  <div className="space-y-2 pt-1">
                    <textarea
                      value={noteInputs[req.id] ?? ""}
                      onChange={(e) => setNoteInputs((prev) => ({ ...prev, [req.id]: e.target.value }))}
                      placeholder="Admin note (optional)…"
                      rows={2}
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                    />
                    <div className="flex gap-2">
                      {req.status === "PENDING" && (
                        <button
                          onClick={() => updateStatus(req.id, "PROCESSING")}
                          disabled={isActive}
                          className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 px-3 py-1.5 text-xs font-medium hover:bg-blue-100 disabled:opacity-50 transition-colors"
                        >
                          {isActive ? "Updating…" : "Mark Processing"}
                        </button>
                      )}
                      <button
                        onClick={() => updateStatus(req.id, "PAID")}
                        disabled={isActive}
                        className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 text-xs font-medium disabled:opacity-50 transition-colors"
                      >
                        {isActive ? "Updating…" : "Mark as Paid Out"}
                      </button>
                      <button
                        onClick={() => updateStatus(req.id, "REJECTED")}
                        disabled={isActive}
                        className="rounded-lg border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-3 py-1.5 text-xs font-medium hover:bg-red-50 dark:hover:bg-red-950/20 disabled:opacity-50 transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                )}

                {req.adminNote && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded-lg">
                    Admin note: {req.adminNote}
                  </p>
                )}

                {req.processedAt && (
                  <p className="text-xs text-slate-400">Processed: {new Date(req.processedAt).toLocaleDateString()}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
