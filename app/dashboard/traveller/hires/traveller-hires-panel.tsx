"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, DollarSign, User, X, Star, CreditCard, CheckCircle2 } from "lucide-react";

interface HireGuide {
  id: string;
  user: { fullName: string; avatarUrl: string | null };
}

interface ExistingReview {
  id: string;
  rating: number;
  comment: string | null;
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
  review: ExistingReview | null;
  payment: { id: string; status: string } | null;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING:   { label: "Pending",   color: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800" },
  ACCEPTED:  { label: "Accepted",  color: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800" },
  REJECTED:  { label: "Rejected",  color: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800" },
  COMPLETED: { label: "Completed", color: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800" },
  CANCELLED: { label: "Cancelled", color: "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700" },
};

const TABS = ["ALL", "PENDING", "ACCEPTED", "REJECTED", "COMPLETED", "CANCELLED"] as const;

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(n)}
          className="p-0.5"
        >
          <Star
            className={`h-5 w-5 transition-colors ${
              n <= (hovered || value)
                ? "fill-amber-400 text-amber-400"
                : "text-slate-300 dark:text-slate-600"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

function ReviewForm({ hireId, onDone }: { hireId: string; onDone: (review: ExistingReview) => void }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (rating === 0) { toast.error("Please select a rating"); return; }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/guide-hires/${hireId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Failed to submit review"); return; }
      toast.success("Review submitted!");
      onDone(data.review);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
      <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Rate your experience</p>
      <StarPicker value={rating} onChange={setRating} />
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Share details about your experience (optional)…"
        rows={3}
        className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
      />
      <div className="flex justify-end">
        <button
          onClick={submit}
          disabled={submitting || rating === 0}
          className="rounded-lg bg-emerald-600 hover:bg-emerald-700 px-4 py-1.5 text-xs font-medium text-white transition-colors disabled:opacity-50"
        >
          {submitting ? "Submitting…" : "Submit Review"}
        </button>
      </div>
    </div>
  );
}

function PayHireButton({ hireId }: { hireId: string }) {
  const [loading, setLoading] = useState(false);
  async function handlePay() {
    setLoading(true);
    try {
      const res = await fetch("/api/payments/guide-hire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hireId }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Could not initiate payment"); return; }
      window.location.href = data.url;
    } catch {
      toast.error("Something went wrong.");
      setLoading(false);
    }
  }
  return (
    <button
      onClick={handlePay}
      disabled={loading}
      className="h-8 flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-3 text-xs font-medium text-white transition-colors disabled:opacity-60"
    >
      <CreditCard className="h-3.5 w-3.5" />
      {loading ? "Redirecting…" : "Pay Now"}
    </button>
  );
}

function ReviewDisplay({ review }: { review: ExistingReview }) {
  return (
    <div className="mt-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900 space-y-1.5">
      <div className="flex items-center gap-1.5">
        <div className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <Star key={n} className={`h-3.5 w-3.5 ${n <= review.rating ? "fill-amber-400 text-amber-400" : "text-slate-300 dark:text-slate-600"}`} />
          ))}
        </div>
        <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">Your review</span>
      </div>
      {review.comment && (
        <p className="text-xs text-slate-600 dark:text-slate-400">{review.comment}</p>
      )}
    </div>
  );
}

export default function TravellerHiresPanel({ initialHires }: { initialHires: Hire[] }) {
  const [hires, setHires] = useState(initialHires);
  const [tab, setTab] = useState<typeof TABS[number]>("ALL");
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [reviewingId, setReviewingId] = useState<string | null>(null);

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
      if (!res.ok) { toast.error(data.error ?? "Failed to cancel hire"); return; }
      setHires((prev) => prev.map((h) => h.id === id ? { ...h, status: "CANCELLED", cancelledAt: new Date().toISOString() } : h));
      toast.success("Hire request cancelled.");
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setCancelling(null);
    }
  }

  function handleReviewDone(hireId: string, review: ExistingReview) {
    setHires((prev) => prev.map((h) => h.id === hireId ? { ...h, review } : h));
    setReviewingId(null);
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
            const canReview = hire.status === "COMPLETED" && !hire.review;
            const isReviewing = reviewingId === hire.id;
            const isPaid = hire.payment?.status === "PAID";
            const canPay = hire.status === "ACCEPTED" && !isPaid;

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
                  <div className="flex items-center gap-1.5">
                    {isPaid && (
                      <span className="flex items-center gap-0.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Paid
                      </span>
                    )}
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${s.color}`}>
                      {s.label}
                    </span>
                  </div>
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

                {/* Pay Now banner — shown prominently when guide just accepted */}
                {canPay && (
                  <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 px-4 py-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">Guide accepted your request!</p>
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">Complete payment to confirm your booking.</p>
                    </div>
                    <PayHireButton hireId={hire.id} />
                  </div>
                )}

                {/* Existing review */}
                {hire.review && <ReviewDisplay review={hire.review} />}

                {/* Review form (inline toggle) */}
                {isReviewing && (
                  <ReviewForm
                    hireId={hire.id}
                    onDone={(review) => handleReviewDone(hire.id, review)}
                  />
                )}

                {/* Action buttons */}
                {(canCancel || canPay || canReview) && (
                  <div className="pt-1 flex items-center gap-2 flex-wrap">
                    {canCancel && (
                      <Button
                        onClick={() => handleCancel(hire.id)}
                        disabled={cancelling === hire.id}
                        className="h-8 text-xs px-3 bg-transparent border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/20"
                      >
                        <X className="h-3.5 w-3.5 mr-1" />
                        {cancelling === hire.id ? "Cancelling…" : "Cancel Request"}
                      </Button>
                    )}
                    {canReview && !isReviewing && (
                      <button
                        onClick={() => setReviewingId(hire.id)}
                        className="h-8 flex items-center gap-1.5 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 px-3 text-xs font-medium hover:bg-amber-100 dark:hover:bg-amber-950/40 transition-colors"
                      >
                        <Star className="h-3.5 w-3.5" />
                        Leave a Review
                      </button>
                    )}
                    {isReviewing && (
                      <button
                        onClick={() => setReviewingId(null)}
                        className="h-8 text-xs px-3 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
