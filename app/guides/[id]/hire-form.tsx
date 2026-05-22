"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CalendarDays, DollarSign } from "lucide-react";

interface Props {
  guideId: string;
  guideName: string;
  dailyRate: number;
  currency: string;
}

export default function HireForm({ guideId, guideName, dailyRate, currency }: Props) {
  const router = useRouter();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [requirements, setRequirements] = useState("");
  const [loading, setLoading] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  const daysCount =
    startDate && endDate && endDate > startDate
      ? Math.round(
          (new Date(endDate).getTime() - new Date(startDate).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : 0;

  const totalAmount = daysCount * dailyRate;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!startDate || !endDate) {
      toast.error("Please select start and end dates");
      return;
    }
    if (endDate <= startDate) {
      toast.error("End date must be after start date");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/guide-hires", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guideId,
          startDate,
          endDate,
          requirements: requirements.trim() || undefined,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "Failed to send hire request");
        return;
      }

      toast.success(`Hire request sent to ${guideName}!`);
      router.push("/dashboard/traveller/hires");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="start-date" className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400">
          <CalendarDays className="h-3.5 w-3.5" /> Start date
        </Label>
        <input
          id="start-date"
          type="date"
          required
          min={today}
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="end-date" className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400">
          <CalendarDays className="h-3.5 w-3.5" /> End date
        </Label>
        <input
          id="end-date"
          type="date"
          required
          min={startDate || today}
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        />
      </div>

      {daysCount > 0 && (
        <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900 p-3 space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600 dark:text-slate-400">
              {daysCount} day{daysCount !== 1 ? "s" : ""} × {dailyRate} {currency}
            </span>
          </div>
          <div className="flex justify-between font-semibold text-sm">
            <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
              <DollarSign className="h-3.5 w-3.5 text-emerald-600" /> Total
            </span>
            <span className="text-emerald-700 dark:text-emerald-400">
              {totalAmount.toFixed(0)} {currency}
            </span>
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="requirements" className="text-xs font-medium text-slate-600 dark:text-slate-400">
          Special requirements (optional)
        </Label>
        <Textarea
          id="requirements"
          value={requirements}
          onChange={(e) => setRequirements(e.target.value)}
          placeholder="e.g. High-altitude experience needed, porter assistance…"
          rows={3}
          className="resize-none text-sm"
        />
      </div>

      <Button
        type="submit"
        disabled={loading || daysCount === 0}
        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-11 font-semibold"
      >
        {loading ? "Sending request…" : "Send Hire Request"}
      </Button>

      <p className="text-xs text-center text-slate-400 leading-relaxed">
        You won't be charged yet. The guide must accept before any payment is made.
      </p>
    </form>
  );
}
