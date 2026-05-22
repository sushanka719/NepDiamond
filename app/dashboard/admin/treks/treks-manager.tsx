"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  ArrowRight,
  Mountain,
  Clock,
  Users,
  DollarSign,
} from "lucide-react";

interface Trek {
  id: string;
  title: string;
  slug: string;
  difficulty: string;
  status: string;
  durationDays: number;
  pricePerPerson: number;
  maxParticipants: number;
  coverImageUrl: string | null;
  createdAt: string;
  region: { id: string; name: string };
  _count: { itinerary: number; media: number };
}

interface Region { id: string; name: string }

interface Props {
  initialTreks: Trek[];
  regions: Region[];
}

const DIFFICULTY_COLORS: Record<string, string> = {
  EASY: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  MODERATE: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  STRENUOUS: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  EXTREME: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  PUBLISHED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  ARCHIVED: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-500",
};

export default function TreksManager({ initialTreks, regions }: Props) {
  const router = useRouter();
  const [treks, setTreks] = useState<Trek[]>(initialTreks);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showCreate, setShowCreate] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Trek | null>(null);
  const [loading, setLoading] = useState(false);

  // Create form
  const [form, setForm] = useState({
    regionId: "",
    title: "",
    description: "",
    difficulty: "MODERATE",
    durationDays: "",
    pricePerPerson: "",
    maxParticipants: "",
    departureDate: "",
    returnDate: "",
    coverImageUrl: "",
  });

  const filtered = treks.filter((t) => {
    const matchSearch = t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.region.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "ALL" || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  function setField(k: keyof typeof form, v: string) {
    setForm((prev) => ({ ...prev, [k]: v }));
  }

  async function handleCreate() {
    if (!form.regionId || !form.title.trim() || !form.description.trim() ||
      !form.durationDays || !form.pricePerPerson || !form.maxParticipants || !form.departureDate) {
      toast.error("Please fill all required fields including departure date");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/treks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          regionId: form.regionId,
          title: form.title.trim(),
          description: form.description.trim(),
          difficulty: form.difficulty,
          durationDays: Number(form.durationDays),
          pricePerPerson: Number(form.pricePerPerson),
          maxParticipants: Number(form.maxParticipants),
          departureDate: form.departureDate,
          returnDate: form.returnDate || undefined,
          coverImageUrl: form.coverImageUrl.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Failed to create trek"); return; }
      toast.success(`Trek "${data.trek.title}" created and listed for departure`);
      setShowCreate(false);
      setForm({ regionId: "", title: "", description: "", difficulty: "MODERATE", durationDays: "", pricePerPerson: "", maxParticipants: "", departureDate: "", returnDate: "", coverImageUrl: "" });
      router.push(`/dashboard/admin/treks/${data.trek.id}`);
    } finally { setLoading(false); }
  }

  async function handleDelete(trek: Trek) {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/treks/${trek.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Failed to delete trek"); return; }
      setTreks((prev) => prev.filter((t) => t.id !== trek.id));
      toast.success(`"${trek.title}" deleted`);
      setDeleteTarget(null);
    } finally { setLoading(false); }
  }

  const counts = {
    ALL: treks.length,
    DRAFT: treks.filter((t) => t.status === "DRAFT").length,
    PUBLISHED: treks.filter((t) => t.status === "PUBLISHED").length,
    ARCHIVED: treks.filter((t) => t.status === "ARCHIVED").length,
  };

  return (
    <>
      {/* Stat tabs + toolbar */}
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {(["ALL", "PUBLISHED", "DRAFT", "ARCHIVED"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                statusFilter === s
                  ? "bg-emerald-600 text-white border-emerald-600"
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-emerald-300"
              }`}
            >
              {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()} ({counts[s]})
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search treks…" className="pl-9" />
          </div>
          <Button onClick={() => setShowCreate(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shrink-0">
            <Plus className="h-4 w-4" /> New Trek
          </Button>
        </div>
      </div>

      {/* Trek list */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-700 py-16 text-center">
            <Mountain className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-500">
              {search || statusFilter !== "ALL" ? "No treks match your filters." : "No treks yet. Create one to get started."}
            </p>
          </div>
        ) : (
          filtered.map((trek) => (
            <div
              key={trek.id}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 flex items-center gap-4 hover:border-emerald-200 dark:hover:border-emerald-800 transition-colors"
            >
              {/* Cover image or placeholder */}
              <div className="h-14 w-14 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 overflow-hidden">
                {trek.coverImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={trek.coverImageUrl} alt={trek.title} className="h-full w-full object-cover" />
                ) : (
                  <Mountain className="h-6 w-6 text-slate-400" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm truncate">{trek.title}</h3>
                  <Badge className={STATUS_COLORS[trek.status]}>{trek.status}</Badge>
                  <Badge className={DIFFICULTY_COLORS[trek.difficulty]}>{trek.difficulty}</Badge>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">{trek.region.name}</p>
                <div className="flex flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{trek.durationDays}d</span>
                  <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" />${trek.pricePerPerson}/person</span>
                  <span className="flex items-center gap-1"><Users className="h-3 w-3" />Max {trek.maxParticipants}</span>
                  <span>{trek._count.itinerary} days itinerary · {trek._count.media} media</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0">
                <Link
                  href={`/dashboard/admin/treks/${trek.id}`}
                  className="p-1.5 rounded-md text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors"
                  title="Edit"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Link>
                <Link
                  href={`/dashboard/admin/treks/${trek.id}`}
                  className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Open"
                >
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                <button
                  onClick={() => setDeleteTarget(trek)}
                  className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={(o) => !o && setShowCreate(false)}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Trek</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Region <span className="text-destructive">*</span></Label>
              <select
                value={form.regionId}
                onChange={(e) => setField("regionId", e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Select a region…</option>
                {regions.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Title <span className="text-destructive">*</span></Label>
              <Input value={form.title} onChange={(e) => setField("title", e.target.value)} placeholder="e.g. Everest Base Camp Trek" />
            </div>
            <div className="space-y-1.5">
              <Label>Description <span className="text-destructive">*</span></Label>
              <Textarea value={form.description} onChange={(e) => setField("description", e.target.value)} placeholder="Describe the trek route, highlights, and experience…" rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Difficulty <span className="text-destructive">*</span></Label>
                <select
                  value={form.difficulty}
                  onChange={(e) => setField("difficulty", e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {["EASY", "MODERATE", "STRENUOUS", "EXTREME"].map((d) => (
                    <option key={d} value={d}>{d.charAt(0) + d.slice(1).toLowerCase()}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Duration (days) <span className="text-destructive">*</span></Label>
                <Input type="number" min={1} value={form.durationDays} onChange={(e) => setField("durationDays", e.target.value)} placeholder="14" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Price per person (USD) <span className="text-destructive">*</span></Label>
                <Input type="number" min={0} step="0.01" value={form.pricePerPerson} onChange={(e) => setField("pricePerPerson", e.target.value)} placeholder="1200" />
              </div>
              <div className="space-y-1.5">
                <Label>Max participants <span className="text-destructive">*</span></Label>
                <Input type="number" min={1} value={form.maxParticipants} onChange={(e) => setField("maxParticipants", e.target.value)} placeholder="12" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Departure date <span className="text-destructive">*</span></Label>
                <Input type="date" value={form.departureDate} onChange={(e) => setField("departureDate", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Return date (optional)</Label>
                <Input type="date" value={form.returnDate} onChange={(e) => setField("returnDate", e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Cover image URL (optional)</Label>
              <Input value={form.coverImageUrl} onChange={(e) => setField("coverImageUrl", e.target.value)} placeholder="https://…" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)} disabled={loading}>Cancel</Button>
            <Button onClick={handleCreate} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              {loading ? "Creating…" : "Create Trek"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Delete trek?</DialogTitle></DialogHeader>
          <p className="text-sm text-slate-600 dark:text-slate-400 py-2">
            This will soft-delete <strong>{deleteTarget?.title}</strong> and hide it from all listings.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={loading}>Cancel</Button>
            <Button onClick={() => deleteTarget && handleDelete(deleteTarget)} disabled={loading} className="bg-red-600 hover:bg-red-700 text-white">
              {loading ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
