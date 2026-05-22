"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  CalendarDays,
  Users,
  DollarSign,
  Mountain,
  MapPin,
  Clock,
  ChevronDown,
  CheckCircle2,
} from "lucide-react";

interface Departure {
  id: string;
  departureDate: string;
  returnDate: string | null;
  pricePerPerson: number;
  maxParticipants: number;
  currency: string;
  status: string;
  _count: { bookings: number };
}

interface Trek {
  id: string;
  title: string;
  slug: string;
  description: string;
  difficulty: string;
  durationDays: number;
  pricePerPerson: number;
  maxParticipants: number;
  coverImageUrl: string | null;
  region: { name: string; slug: string };
  itinerary: { id: string; dayNumber: number; title: string; description: string }[];
  media: { id: string; url: string; mediaType: string; caption: string | null }[];
  departures: Departure[];
}

interface Props {
  trek: Trek;
  isLoggedIn: boolean;
  userBookedDepartureIds: string[];
}

const DIFFICULTY_COLORS: Record<string, string> = {
  EASY: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  MODERATE: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  STRENUOUS: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  EXTREME: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

export default function TrekDetailClient({ trek, isLoggedIn, userBookedDepartureIds: initialBooked }: Props) {
  const router = useRouter();
  const [bookedIds, setBookedIds] = useState<Set<string>>(new Set(initialBooked));
  const [bookingTarget, setBookingTarget] = useState<Departure | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  async function handleBook() {
    if (!bookingTarget) return;
    if (!isLoggedIn) { router.push("/auth/login"); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/treks/${trek.slug}/book`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ departureId: bookingTarget.id }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Failed to book"); return; }
      setBookedIds((prev) => new Set([...prev, bookingTarget.id]));
      toast.success("Booking confirmed! Check My Bookings for details.");
      setBookingTarget(null);
      if (data.departureFull) {
        toast.info("This departure is now fully booked.");
      }
    } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Hero */}
      <div className="relative h-64 sm:h-80 bg-slate-200 dark:bg-slate-800 overflow-hidden">
        {trek.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={trek.coverImageUrl} alt={trek.title} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full flex items-center justify-center">
            <Mountain className="h-16 w-16 text-slate-400" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-2 mb-2">
              <Badge className={DIFFICULTY_COLORS[trek.difficulty]}>{trek.difficulty}</Badge>
              <span className="text-white/80 text-sm flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{trek.region.name}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white">{trek.title}</h1>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { icon: Clock, label: "Duration", value: `${trek.durationDays} days` },
              { icon: DollarSign, label: "From", value: `$${trek.pricePerPerson.toLocaleString()}` },
              { icon: Users, label: "Max group", value: `${trek.maxParticipants} people` },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="text-center p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <Icon className="h-5 w-5 text-emerald-500 mx-auto mb-1" />
                <p className="text-xs text-slate-500">{label}</p>
                <p className="font-bold text-slate-800 dark:text-slate-200">{value}</p>
              </div>
            ))}
          </div>

          {/* Description */}
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-3">About this trek</h2>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-line">{trek.description}</p>
          </div>

          {/* Itinerary */}
          {trek.itinerary.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-3">Day-by-day itinerary</h2>
              <div className="space-y-2">
                {trek.itinerary.map((day) => (
                  <div key={day.id} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
                    <button
                      className="w-full flex items-center gap-3 p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                      onClick={() => setExpandedDay(expandedDay === day.id ? null : day.id)}
                    >
                      <span className="h-7 w-7 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 text-xs font-bold flex items-center justify-center shrink-0">
                        {day.dayNumber}
                      </span>
                      <span className="flex-1 font-medium text-slate-800 dark:text-slate-200 text-sm">{day.title}</span>
                      <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${expandedDay === day.id ? "rotate-180" : ""}`} />
                    </button>
                    {expandedDay === day.id && (
                      <div className="px-4 pb-4 pl-14">
                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{day.description}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Media gallery */}
          {trek.media.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-3">Gallery</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {trek.media.filter((m) => m.mediaType === "image").map((m) => (
                  <div key={m.id} className="aspect-square rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={m.url} alt={m.caption ?? ""} className="h-full w-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar: departures */}
        <div className="space-y-4">
          <div className="sticky top-20">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-3">Available Departures</h2>

            {trek.departures.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-700 p-8 text-center">
                <CalendarDays className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500">No upcoming departures right now.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {trek.departures.map((d) => {
                  const spotsLeft = d.maxParticipants - d._count.bookings;
                  const isFull = d.status === "FULL";
                  const isBooked = bookedIds.has(d.id);

                  return (
                    <div
                      key={d.id}
                      className={`rounded-xl border p-4 ${
                        isFull
                          ? "border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20"
                          : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-slate-200">
                            {new Date(d.departureDate).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" })}
                          </p>
                          {d.returnDate && (
                            <p className="text-xs text-slate-500">
                              Returns {new Date(d.returnDate).toLocaleDateString("en-US", { day: "numeric", month: "short" })}
                            </p>
                          )}
                        </div>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          isFull
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
                            : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
                        }`}>
                          {isFull ? "Full" : `${spotsLeft} left`}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-sm mb-3">
                        <span className="font-bold text-slate-800 dark:text-slate-200 text-lg">${d.pricePerPerson.toLocaleString()}</span>
                        <span className="text-xs text-slate-500">per person</span>
                      </div>

                      {isBooked ? (
                        <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-sm font-medium">
                          <CheckCircle2 className="h-4 w-4" />
                          You&apos;re booked!
                        </div>
                      ) : isFull ? (
                        <Button disabled className="w-full" variant="outline">Fully Booked</Button>
                      ) : (
                        <Button
                          onClick={() => {
                            if (!isLoggedIn) { router.push("/auth/login"); return; }
                            setBookingTarget(d);
                          }}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          Book This Departure
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <p className="text-xs text-slate-400 dark:text-slate-500 mt-3 text-center">
              Need help?{" "}
              <Link href="/guides" className="text-emerald-600 dark:text-emerald-400 hover:underline">
                Find a personal guide
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Booking confirm dialog */}
      <Dialog open={!!bookingTarget} onOpenChange={(o) => !o && setBookingTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirm Booking</DialogTitle>
          </DialogHeader>
          {bookingTarget && (
            <div className="space-y-3 py-2">
              <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Trek</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{trek.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Departure</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {new Date(bookingTarget.departureDate).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" })}
                  </span>
                </div>
                <div className="flex justify-between border-t border-slate-200 dark:border-slate-700 pt-2 mt-2">
                  <span className="text-slate-500 font-medium">Total</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-base">${bookingTarget.pricePerPerson.toLocaleString()}</span>
                </div>
              </div>
              <p className="text-xs text-slate-500">
                Your spot will be reserved immediately. Payment will be processed at departure.
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setBookingTarget(null)} disabled={loading}>Cancel</Button>
            <Button onClick={handleBook} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              {loading ? "Booking…" : "Confirm Booking"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
