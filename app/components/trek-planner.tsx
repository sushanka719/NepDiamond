"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  Send,
  Star,
  DollarSign,
  Globe,
  Briefcase,
  CalendarDays,
  CheckCircle2,
  X,
} from "lucide-react";

interface Guide {
  id: string;
  name: string;
  avatarUrl?: string | null;
  dailyRate: number;
  currency: string;
  specializations: string[];
  languages: string[];
  experienceYears: number;
  avgRating: number | null;
  reviewCount: number;
  reason?: string;
}

const EXAMPLES = [
  "14-day Everest Base Camp trek, beginner level, $80/day budget, English-speaking guide, starting June 1",
  "7-day Annapurna Circuit, moderate fitness, solo traveller, budget $60/day, starting July 15",
  "10-day Langtang Valley trek, family with kids aged 10+, $100/day, patient guide, starting August 5",
];

function renderMarkdown(text: string): string {
  return text
    .replace(
      /^## (.+)$/gm,
      '<h2 class="text-lg font-bold text-slate-900 dark:text-white mt-6 mb-2">$1</h2>'
    )
    .replace(
      /^### (.+)$/gm,
      '<h3 class="text-base font-semibold text-slate-800 dark:text-slate-200 mt-4 mb-1">$1</h3>'
    )
    .replace(
      /\*\*(.+?)\*\*/g,
      '<strong class="font-semibold text-slate-900 dark:text-white">$1</strong>'
    )
    .replace(
      /`([^`]+)`/g,
      '<code class="bg-slate-100 dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 rounded px-1 text-sm font-mono">$1</code>'
    )
    .replace(
      /^- (.+)$/gm,
      '<li class="flex gap-2 text-slate-700 dark:text-slate-300"><span class="text-emerald-500 shrink-0">•</span><span>$1</span></li>'
    )
    .replace(
      /^(Day \d+:.+)$/gm,
      '<div class="flex gap-2 py-1"><span class="text-emerald-600 dark:text-emerald-400 font-medium shrink-0">▸</span><span class="text-slate-700 dark:text-slate-300">$1</span></div>'
    )
    .replace(/\n\n/g, '</p><p class="mb-2">')
    .replace(/\n/g, "<br />");
}

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

function GuideCard({
  guide,
  trekSummary,
}: {
  guide: Guide;
  trekSummary: string;
}) {
  const initials = guide.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const [booking, setBooking] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [requirements, setRequirements] = useState(
    trekSummary ? trekSummary.slice(0, 300) : guide.reason ?? ""
  );
  const [submitting, setSubmitting] = useState(false);
  const [booked, setBooked] = useState(false);
  const [bookError, setBookError] = useState<string | null>(null);

  async function handleBook(e: React.FormEvent) {
    e.preventDefault();
    if (!startDate || !endDate) return;
    setSubmitting(true);
    setBookError(null);
    try {
      const res = await fetch("/api/guide-hires", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guideId: guide.id,
          startDate,
          endDate,
          requirements: requirements.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setBookError(json.error ?? "Booking failed");
      } else {
        setBooked(true);
        setBooking(false);
      }
    } catch {
      setBookError("Connection error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;
  const days =
    start && end && end > start
      ? Math.round((end.getTime() - start.getTime()) / 86400000)
      : null;
  const estimatedCost = days ? days * guide.dailyRate : null;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 flex flex-col gap-3 hover:shadow-md hover:border-emerald-200 dark:hover:border-emerald-800 transition-all">
      {/* Guide header */}
      <div className="flex items-start gap-3">
        {guide.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={guide.avatarUrl}
            alt={guide.name}
            className="h-11 w-11 rounded-full object-cover shrink-0"
          />
        ) : (
          <div className="h-11 w-11 rounded-full bg-emerald-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
            {initials}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-slate-900 dark:text-white truncate">
            {guide.name}
          </p>
          <div className="flex items-center gap-1 mt-0.5">
            {guide.avgRating ? (
              <>
                <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  {guide.avgRating}
                </span>
                <span className="text-xs text-slate-400">
                  ({guide.reviewCount})
                </span>
              </>
            ) : (
              <span className="text-xs text-slate-400">No reviews yet</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 rounded-lg px-2.5 py-1 text-sm font-semibold">
          <DollarSign className="h-3.5 w-3.5" />
          {guide.dailyRate}
          <span className="font-normal text-xs">/day</span>
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5">
        {guide.specializations.slice(0, 3).map((s) => (
          <span
            key={s}
            className="inline-flex items-center gap-1 text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full px-2 py-0.5"
          >
            <Briefcase className="h-3 w-3" /> {s}
          </span>
        ))}
        {guide.languages.slice(0, 2).map((l) => (
          <span
            key={l}
            className="inline-flex items-center gap-1 text-xs bg-sky-50 dark:bg-sky-950/30 text-sky-600 dark:text-sky-400 rounded-full px-2 py-0.5"
          >
            <Globe className="h-3 w-3" /> {l}
          </span>
        ))}
      </div>

      {/* AI reason */}
      {guide.reason && (
        <p className="text-xs text-slate-500 dark:text-slate-400 italic border-l-2 border-emerald-300 dark:border-emerald-700 pl-2">
          {guide.reason}
        </p>
      )}

      {/* Booked state */}
      {booked ? (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-3 py-2.5 text-sm text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Request sent! The guide will review and respond.
        </div>
      ) : booking ? (
        /* Inline booking form */
        <form onSubmit={handleBook} className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Select trek dates
            </p>
            <button
              type="button"
              onClick={() => {
                setBooking(false);
                setBookError(null);
              }}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">
                Start date
              </label>
              <input
                type="date"
                required
                min={todayStr()}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">
                End date
              </label>
              <input
                type="date"
                required
                min={startDate || todayStr()}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {days && days > 0 && (
            <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
              {days} days · estimated{" "}
              <span className="font-bold">
                {guide.currency} {estimatedCost?.toLocaleString()}
              </span>
            </p>
          )}

          <div>
            <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">
              Requirements (optional)
            </label>
            <textarea
              rows={2}
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              className="w-full resize-none rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {bookError && (
            <p className="text-xs text-red-600 dark:text-red-400">{bookError}</p>
          )}

          <button
            type="submit"
            disabled={submitting || !startDate || !endDate}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white text-sm font-medium transition-colors disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <span className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Sending…
              </>
            ) : (
              <>
                <CalendarDays className="h-4 w-4" />
                Send Hire Request
              </>
            )}
          </button>
        </form>
      ) : (
        /* Action buttons */
        <div className="flex gap-2 mt-auto">
          <Link
            href={`/guides/${guide.id}`}
            className="flex-1 flex items-center justify-center py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-emerald-300 hover:text-emerald-700 dark:hover:text-emerald-400 text-sm font-medium transition-colors"
          >
            View Profile
          </Link>
          <button
            onClick={() => setBooking(true)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors"
          >
            <CalendarDays className="h-4 w-4" />
            Book Now
          </button>
        </div>
      )}
    </div>
  );
}

export default function TrekPlanner() {
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [text, setText] = useState("");
  const [guides, setGuides] = useState<Guide[]>([]);
  const [recommended, setRecommended] = useState<Guide[]>([]);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const responseRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (text && responseRef.current) {
      responseRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [text]);

  async function handleSubmit(
    e: React.FormEvent | null,
    overrideInput?: string
  ) {
    if (e) e.preventDefault();
    const query = overrideInput ?? input;
    if (!query.trim() || streaming) return;

    setStreaming(true);
    setText("");
    setGuides([]);
    setRecommended([]);
    setDone(false);
    setError(null);

    try {
      const res = await fetch("/api/ai/trek-planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: query }),
      });

      if (!res.ok) {
        const json = await res.json();
        setError(json.error ?? "Request failed");
        return;
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let accumulatedText = "";
      let localGuides: Guide[] = [];

      while (true) {
        const { done: streamDone, value } = await reader.read();
        if (streamDone) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";

        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith("data: ")) continue;
          try {
            const payload = JSON.parse(line.slice(6));
            if (payload.type === "guides") {
              localGuides = payload.guides;
              setGuides(payload.guides);
            } else if (payload.type === "text") {
              accumulatedText += payload.text;
              setText(accumulatedText);
            } else if (payload.type === "done") {
              const jsonMatch = accumulatedText.match(
                /```json\n([\s\S]*?)\n```/
              );
              if (jsonMatch) {
                try {
                  const { guides: recs } = JSON.parse(jsonMatch[1]);
                  setRecommended(
                    localGuides
                      .filter((g) =>
                        recs.some((r: { id: string }) => r.id === g.id)
                      )
                      .map((g) => ({
                        ...g,
                        reason: recs.find(
                          (r: { id: string; reason: string }) => r.id === g.id
                        )?.reason,
                      }))
                  );
                } catch {
                  // JSON parse failed — show all guides as fallback
                }
              }
              setDone(true);
            } else if (payload.type === "error") {
              setError(payload.message);
            }
          } catch {
            // malformed SSE line
          }
        }
      }
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setStreaming(false);
    }
  }

  const visibleText = text.replace(/```json[\s\S]*?```/g, "").trim();

  // Extract a short trek overview to pre-fill booking requirements
  const trekOverviewMatch = visibleText.match(
    /## Trek Overview\s*([\s\S]*?)(?=##|$)/
  );
  const trekSummary = trekOverviewMatch
    ? trekOverviewMatch[1].replace(/<[^>]+>/g, "").trim().slice(0, 300)
    : input;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Input form */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Describe your dream trek
          </label>
          <div className="relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(null);
                }
              }}
              placeholder="e.g. I want to trek Everest Base Camp for 14 days starting June 1, beginner level, budget $80/day, English-speaking guide…"
              rows={3}
              disabled={streaming}
              className="w-full resize-none rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:opacity-60 transition-colors"
            />
          </div>

          {/* Example prompts */}
          {!streaming && !done && (
            <div className="flex flex-wrap gap-2">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => {
                    setInput(ex);
                    handleSubmit(null, ex);
                  }}
                  className="text-xs px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-emerald-300 hover:text-emerald-700 dark:hover:border-emerald-700 dark:hover:text-emerald-400 transition-colors truncate max-w-xs"
                >
                  {ex.length > 60 ? ex.slice(0, 60) + "…" : ex}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between">
            {done && (
              <button
                type="button"
                onClick={() => {
                  setInput("");
                  setText("");
                  setGuides([]);
                  setRecommended([]);
                  setDone(false);
                  setError(null);
                }}
                className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
              >
                ← Plan another trek
              </button>
            )}
            <button
              type="submit"
              disabled={streaming || !input.trim()}
              className="ml-auto flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white text-sm font-medium transition-colors disabled:cursor-not-allowed"
            >
              {streaming ? (
                <>
                  <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Planning…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Plan My Trek
                  <Send className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 px-4 py-3 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Streaming response */}
      {(streaming || visibleText) && (
        <div
          ref={responseRef}
          className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-4 w-4 text-emerald-500" />
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
              AI Trek Planner
            </span>
            {streaming && (
              <span className="ml-auto flex items-center gap-1.5 text-xs text-slate-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Generating…
              </span>
            )}
          </div>

          <div
            className="prose-sm text-slate-700 dark:text-slate-300 leading-relaxed [&>h2]:mt-4 [&>h2:first-child]:mt-0"
            dangerouslySetInnerHTML={{
              __html:
                renderMarkdown(visibleText) +
                (streaming
                  ? '<span class="inline-block w-0.5 h-4 bg-emerald-500 animate-pulse ml-0.5 align-middle" />'
                  : ""),
            }}
          />
        </div>
      )}

      {/* Recommended guide cards */}
      {recommended.length > 0 && (
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/50">
              <Sparkles className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            </span>
            Matched Guides — Book Directly
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommended.map((g) => (
              <GuideCard key={g.id} guide={g} trekSummary={trekSummary} />
            ))}
          </div>
        </div>
      )}

      {/* Fallback: show all guides if AI didn't match any */}
      {done && recommended.length === 0 && guides.length > 0 && (
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-3">
            Available Guides
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {guides.slice(0, 6).map((g) => (
              <GuideCard key={g.id} guide={g} trekSummary={trekSummary} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
