"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CalendarDays, DollarSign } from "lucide-react";
import GuideCalendar from "./guide-calendar";

interface Props {
  guideId: string;
  guideName: string;
  dailyRate: number;
  currency: string;
}

interface BookedRange {
  startDate: string;
  endDate: string;
}

type Step = "start" | "end";

export default function HireForm({ guideId, guideName, dailyRate, currency }: Props) {
  const router = useRouter();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [requirements, setRequirements] = useState("");
  const [loading, setLoading] = useState(false);
  const [bookedRanges, setBookedRanges] = useState<BookedRange[]>([]);
  const [step, setStep] = useState<Step>("start");

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    fetch(`/api/guides/${guideId}/booked-dates`)
      .then((r) => r.json())
      .then((data) => setBookedRanges(data.ranges ?? []))
      .catch(() => {});
  }, [guideId]);

  const daysCount =
    startDate && endDate && endDate > startDate
      ? Math.round(
          (new Date(endDate).getTime() - new Date(startDate).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : 0;

  const totalAmount = daysCount * dailyRate;

  function handleStartSelect(date: string) {
    setStartDate(date);
    setEndDate("");
    setStep("end");
  }

  function handleEndSelect(date: string) {
    if (date <= startDate) {
      toast.error("End date must be after start date");
      return;
    }
    setEndDate(date);
  }

  function resetDates() {
    setStartDate("");
    setEndDate("");
    setStep("start");
  }

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
      {/* Date selection */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400">
            <CalendarDays className="h-3.5 w-3.5" />
            {step === "start" ? "Select start date" : "Select end date"}
          </Label>
          {(startDate || endDate) && (
            <button
              type="button"
              onClick={resetDates}
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              Reset
            </button>
          )}
        </div>

        {/* Selected range display */}
        {(startDate || endDate) && (
          <div className="flex items-center gap-2 text-xs bg-slate-50 dark:bg-slate-800/50 rounded-lg px-3 py-2">
            <span className={`font-medium ${startDate ? "text-emerald-700 dark:text-emerald-400" : "text-slate-400"}`}>
              {startDate || "—"}
            </span>
            <span className="text-slate-300 dark:text-slate-600">→</span>
            <span className={`font-medium ${endDate ? "text-emerald-700 dark:text-emerald-400" : "text-slate-400"}`}>
              {endDate || "pick end date"}
            </span>
          </div>
        )}

        <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-3 bg-white dark:bg-slate-900">
          <GuideCalendar
            value={step === "start" ? startDate : endDate}
            onChange={step === "start" ? handleStartSelect : handleEndSelect}
            minDate={step === "start" ? today : startDate ? (() => {
              const next = new Date(startDate);
              next.setDate(next.getDate() + 1);
              return next.toISOString().split("T")[0];
            })() : today}
            bookedRanges={bookedRanges}
            selectedStart={startDate}
            selectedEnd={endDate}
          />
        </div>
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
        You won&apos;t be charged yet. The guide must accept before any payment is made.
      </p>
    </form>
  );
}
