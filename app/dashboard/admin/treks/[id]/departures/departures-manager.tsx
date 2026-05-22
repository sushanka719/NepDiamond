"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { CalendarDays, Users, DollarSign, ArrowLeft, ArrowRight, Plus, RefreshCw } from "lucide-react";

interface Departure {
  id: string;
  departureDate: string;
  returnDate: string | null;
  pricePerPerson: number;
  maxParticipants: number;
  currency: string;
  status: string;
  notes: string | null;
  rescheduledFromId: string | null;
  createdAt: string;
  _count: { bookings: number; guides: number };
}

interface Trek {
  id: string;
  title: string;
  pricePerPerson: number;
  maxParticipants: number;
  departures: Departure[];
}

interface Props { trek: Trek }

const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  FULL: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  DEPARTED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  COMPLETED: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

export default function DeparturesManager({ trek }: Props) {
  const router = useRouter();
  const [departures, setDepartures] = useState<Departure[]>(trek.departures);
  const [showCreate, setShowCreate] = useState(false);
  const [rescheduleFrom, setRescheduleFrom] = useState<Departure | null>(null);
  const [loading, setLoading] = useState(false);

  const emptyForm = {
    departureDate: "",
    returnDate: "",
    pricePerPerson: String(trek.pricePerPerson),
    maxParticipants: String(trek.maxParticipants),
    notes: "",
  };
  const [form, setForm] = useState(emptyForm);

  function setField(k: keyof typeof form, v: string) {
    setForm((prev) => ({ ...prev, [k]: v }));
  }

  function openCreate() {
    setForm(emptyForm);
    setRescheduleFrom(null);
    setShowCreate(true);
  }

  function openReschedule(d: Departure) {
    setForm({
      departureDate: "",
      returnDate: "",
      pricePerPerson: String(d.pricePerPerson),
      maxParticipants: String(d.maxParticipants),
      notes: d.notes ?? "",
    });
    setRescheduleFrom(d);
    setShowCreate(true);
  }

  async function handleCreate() {
    if (!form.departureDate) { toast.error("Departure date is required"); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/treks/${trek.id}/departures`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          departureDate: form.departureDate,
          returnDate: form.returnDate || undefined,
          pricePerPerson: Number(form.pricePerPerson),
          maxParticipants: Number(form.maxParticipants),
          notes: form.notes || undefined,
          rescheduledFromId: rescheduleFrom?.id,
        }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Failed"); return; }
      setDepartures((prev) => [data.departure, ...prev]);
      toast.success("New departure listed");
      setShowCreate(false);
      router.refresh();
    } finally { setLoading(false); }
  }

  return (
    <>
      <div className="flex items-center gap-3">
        <Link
          href={`/dashboard/admin/treks/${trek.id}`}
          className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{trek.title}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Manage departures · {departures.length} total</p>
        </div>
        <Button onClick={openCreate} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shrink-0">
          <Plus className="h-4 w-4" /> New Departure
        </Button>
      </div>

      <div className="space-y-2">
        {departures.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-700 py-16 text-center">
            <CalendarDays className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-500 mb-4">No departures yet for this trek.</p>
            <Button onClick={openCreate} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5">
              <Plus className="h-4 w-4" /> Create First Departure
            </Button>
          </div>
        ) : (
          departures.map((d) => (
            <div
              key={d.id}
              className={`rounded-xl border bg-white dark:bg-slate-900 p-4 flex items-center gap-4 transition-colors ${
                d.status === "FULL" ? "border-amber-300 dark:border-amber-700" : "border-slate-200 dark:border-slate-800 hover:border-emerald-200 dark:hover:border-emerald-800"
              }`}
            >
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={STATUS_COLORS[d.status]}>{d.status}</Badge>
                  {d.rescheduledFromId && (
                    <span className="text-xs text-slate-400 flex items-center gap-0.5">
                      <RefreshCw className="h-3 w-3" /> Rescheduled
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-3 text-sm text-slate-700 dark:text-slate-300">
                  <span className="flex items-center gap-1 font-medium">
                    <CalendarDays className="h-4 w-4 text-slate-400" />
                    {new Date(d.departureDate).toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
                    {d.returnDate && (
                      <> → {new Date(d.returnDate).toLocaleDateString("en-US", { day: "numeric", month: "short" })}</>
                    )}
                  </span>
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" />${d.pricePerPerson}/person</span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />{d._count.bookings}/{d.maxParticipants} booked
                    {d.status === "SCHEDULED" && <span className="text-emerald-600 dark:text-emerald-400">· {d.maxParticipants - d._count.bookings} spots left</span>}
                  </span>
                  {d._count.guides > 0 && <span>{d._count.guides} guide{d._count.guides > 1 ? "s" : ""}</span>}
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {(d.status === "COMPLETED" || d.status === "DEPARTED") && (
                  <button
                    onClick={() => openReschedule(d)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 transition-colors"
                    title="List this trek again with a new date"
                  >
                    <RefreshCw className="h-3 w-3" /> List Again
                  </button>
                )}
                <Link
                  href={`/dashboard/admin/departures/${d.id}`}
                  className="p-1.5 rounded-md text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors"
                  title="Manage"
                >
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create / List Again dialog */}
      <Dialog open={showCreate} onOpenChange={(o) => !o && setShowCreate(false)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{rescheduleFrom ? "List Trek Again" : "New Departure"}</DialogTitle>
          </DialogHeader>
          {rescheduleFrom && (
            <p className="text-xs text-slate-500 -mt-2 pb-1">
              Creating a new departure based on the{" "}
              {new Date(rescheduleFrom.departureDate).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })} departure.
            </p>
          )}
          <div className="space-y-4 py-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Departure date <span className="text-destructive">*</span></Label>
                <Input type="date" value={form.departureDate} onChange={(e) => setField("departureDate", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Return date</Label>
                <Input type="date" value={form.returnDate} onChange={(e) => setField("returnDate", e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Price / person (USD)</Label>
                <Input type="number" min={0} value={form.pricePerPerson} onChange={(e) => setField("pricePerPerson", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Max participants</Label>
                <Input type="number" min={1} value={form.maxParticipants} onChange={(e) => setField("maxParticipants", e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Notes (optional)</Label>
              <Input value={form.notes} onChange={(e) => setField("notes", e.target.value)} placeholder="Any special notes…" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)} disabled={loading}>Cancel</Button>
            <Button onClick={handleCreate} disabled={loading || !form.departureDate} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              {loading ? "Creating…" : rescheduleFrom ? "List Again" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
