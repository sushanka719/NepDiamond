"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Mountain, DollarSign, ChevronRight, CreditCard, CheckCircle2 } from "lucide-react";

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

interface Booking {
  id: string;
  status: string;
  amount: number;
  currency: string;
  confirmedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  payment: { id: string; status: string } | null;
  departure: {
    id: string;
    departureDate: string;
    returnDate: string | null;
    status: string;
    trek: { id: string; title: string; slug: string; coverImageUrl: string | null; difficulty: string; durationDays: number };
  };
}

function PayButton({ bookingId }: { bookingId: string }) {
  const [loading, setLoading] = useState(false);

  async function handlePay() {
    setLoading(true);
    try {
      const res = await fetch("/api/payments/trek-booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId }),
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
      className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 text-xs font-medium text-white transition-colors disabled:opacity-60 shrink-0"
    >
      <CreditCard className="h-3.5 w-3.5" />
      {loading ? "Redirecting…" : "Pay Now"}
    </button>
  );
}

export default function BookingsPanel({ bookings }: { bookings: Booking[] }) {
  return (
    <div className="space-y-3">
      {bookings.map((b) => {
        const isPaid = b.payment?.status === "PAID";
        const canPay = b.status === "CONFIRMED" && b.departure.status !== "CANCELLED" && !isPaid;

        return (
          <div
            key={b.id}
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4"
          >
            <div className="flex items-center gap-4">
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
                  {isPaid && (
                    <span className="flex items-center gap-0.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Paid
                    </span>
                  )}
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
                    <DollarSign className="h-3 w-3" />{b.amount.toLocaleString()} {b.currency}
                  </span>
                  <span>{b.departure.trek.durationDays} days</span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {canPay && <PayButton bookingId={b.id} />}
                <Link
                  href={`/treks/${b.departure.trek.slug}`}
                  className="p-1.5 rounded-md text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
