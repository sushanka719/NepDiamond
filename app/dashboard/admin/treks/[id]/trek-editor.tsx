"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  Save,
  Plus,
  Trash2,
  Pencil,
  Image,
  Video,
  GripVertical,
  Globe,
  Archive,
  FileText,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ItineraryDay {
  id: string;
  dayNumber: number;
  title: string;
  description: string;
}

interface MediaItem {
  id: string;
  url: string;
  mediaType: string;
  caption: string | null;
  sortOrder: number;
}

interface Trek {
  id: string;
  title: string;
  slug: string;
  description: string;
  difficulty: string;
  status: string;
  durationDays: number;
  pricePerPerson: number;
  maxParticipants: number;
  coverImageUrl: string | null;
  createdAt: string;
  updatedAt: string;
  region: { id: string; name: string };
  itinerary: ItineraryDay[];
  media: MediaItem[];
}

interface Props {
  trek: Trek;
  regions: { id: string; name: string }[];
}

const DIFFICULTY_OPTIONS = ["EASY", "MODERATE", "STRENUOUS", "EXTREME"];
const STATUS_OPTIONS = ["DRAFT", "PUBLISHED", "ARCHIVED"];

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  PUBLISHED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  ARCHIVED: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-500",
};

// ─── Main Component ────────────────────────────────────────────────────────────

export default function TrekEditor({ trek, regions }: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"details" | "itinerary" | "media">("details");

  return (
    <div className="space-y-4">
      {/* Header with status badge */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">{trek.title}</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {trek.region.name} · Updated {new Date(trek.updatedAt).toLocaleDateString()}
          </p>
        </div>
        <Badge className={STATUS_COLORS[trek.status]}>{trek.status}</Badge>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-0">
        {(["details", "itinerary", "media"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium capitalize border-b-2 transition-colors -mb-px ${
              activeTab === tab
                ? "border-emerald-600 text-emerald-700 dark:text-emerald-400"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            {tab}
            {tab === "itinerary" && (
              <span className="ml-1.5 text-xs text-slate-400">({trek.itinerary.length})</span>
            )}
            {tab === "media" && (
              <span className="ml-1.5 text-xs text-slate-400">({trek.media.length})</span>
            )}
          </button>
        ))}
      </div>

      {activeTab === "details" && (
        <DetailsTab trek={trek} regions={regions} onSaved={() => router.refresh()} />
      )}
      {activeTab === "itinerary" && (
        <ItineraryTab trekId={trek.id} initialDays={trek.itinerary} onSaved={() => router.refresh()} />
      )}
      {activeTab === "media" && (
        <MediaTab trekId={trek.id} initialMedia={trek.media} onSaved={() => router.refresh()} />
      )}
    </div>
  );
}

// ─── Details Tab ──────────────────────────────────────────────────────────────

function DetailsTab({ trek, regions, onSaved }: { trek: Trek; regions: Props["regions"]; onSaved: () => void }) {
  const [form, setForm] = useState({
    regionId: trek.region.id,
    title: trek.title,
    description: trek.description,
    difficulty: trek.difficulty,
    durationDays: String(trek.durationDays),
    pricePerPerson: String(trek.pricePerPerson),
    maxParticipants: String(trek.maxParticipants),
    coverImageUrl: trek.coverImageUrl ?? "",
    status: trek.status,
  });
  const [saving, setSaving] = useState(false);

  function setField(k: keyof typeof form, v: string) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/treks/${trek.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          regionId: form.regionId,
          title: form.title.trim(),
          description: form.description.trim(),
          difficulty: form.difficulty,
          durationDays: Number(form.durationDays),
          pricePerPerson: Number(form.pricePerPerson),
          maxParticipants: Number(form.maxParticipants),
          coverImageUrl: form.coverImageUrl.trim() || null,
          status: form.status,
        }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Failed to save"); return; }
      toast.success("Trek saved");
      onSaved();
    } finally { setSaving(false); }
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-5">
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Region</Label>
          <select value={form.regionId} onChange={(e) => setField("regionId", e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
            {regions.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label>Status</Label>
          <select value={form.status} onChange={(e) => setField("status", e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>)}
          </select>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Title</Label>
        <Input value={form.title} onChange={(e) => setField("title", e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label>Description</Label>
        <Textarea value={form.description} onChange={(e) => setField("description", e.target.value)} rows={4} />
      </div>
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label>Difficulty</Label>
          <select value={form.difficulty} onChange={(e) => setField("difficulty", e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
            {DIFFICULTY_OPTIONS.map((d) => <option key={d} value={d}>{d.charAt(0) + d.slice(1).toLowerCase()}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label>Duration (days)</Label>
          <Input type="number" min={1} value={form.durationDays} onChange={(e) => setField("durationDays", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Max participants</Label>
          <Input type="number" min={1} value={form.maxParticipants} onChange={(e) => setField("maxParticipants", e.target.value)} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Price per person (USD)</Label>
        <Input type="number" min={0} step="0.01" value={form.pricePerPerson} onChange={(e) => setField("pricePerPerson", e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label>Cover image URL</Label>
        <Input value={form.coverImageUrl} onChange={(e) => setField("coverImageUrl", e.target.value)} placeholder="https://…" />
      </div>

      {/* Status quick actions */}
      <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
        <span className="text-xs text-slate-400 mr-1">Quick set:</span>
        {["DRAFT", "PUBLISHED", "ARCHIVED"].map((s) => (
          <button key={s} onClick={() => setField("status", s)}
            className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-md border transition-colors ${
              form.status === s
                ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                : "border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300"
            }`}>
            {s === "PUBLISHED" ? <Globe className="h-3 w-3" /> : s === "ARCHIVED" ? <Archive className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
            {s.charAt(0) + s.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
        <Save className="h-4 w-4" />
        {saving ? "Saving…" : "Save changes"}
      </Button>
    </div>
  );
}

// ─── Itinerary Tab ────────────────────────────────────────────────────────────

function ItineraryTab({ trekId, initialDays, onSaved }: { trekId: string; initialDays: ItineraryDay[]; onSaved: () => void }) {
  const [days, setDays] = useState<ItineraryDay[]>(initialDays);
  const [editDay, setEditDay] = useState<ItineraryDay | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(false);

  const [newDay, setNewDay] = useState({ dayNumber: "", title: "", description: "" });
  const [editForm, setEditForm] = useState({ dayNumber: "", title: "", description: "" });

  function openEdit(day: ItineraryDay) {
    setEditDay(day);
    setEditForm({ dayNumber: String(day.dayNumber), title: day.title, description: day.description });
  }

  async function handleAdd() {
    if (!newDay.dayNumber || !newDay.title.trim() || !newDay.description.trim()) {
      toast.error("All fields are required"); return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/treks/${trekId}/itinerary`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dayNumber: Number(newDay.dayNumber), title: newDay.title.trim(), description: newDay.description.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Failed to add day"); return; }
      toast.success("Day added");
      setShowAdd(false);
      setNewDay({ dayNumber: "", title: "", description: "" });
      onSaved();
      // Optimistically add a placeholder; real data comes on refresh
      const nextDayNumber = Number(newDay.dayNumber);
      setDays((prev) => [...prev, { id: `tmp-${nextDayNumber}`, dayNumber: nextDayNumber, title: newDay.title.trim(), description: newDay.description.trim() }].sort((a, b) => a.dayNumber - b.dayNumber));
    } finally { setLoading(false); }
  }

  async function handleEditSave() {
    if (!editDay || !editForm.title.trim() || !editForm.description.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/treks/${trekId}/itinerary/${editDay.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dayNumber: Number(editForm.dayNumber), title: editForm.title.trim(), description: editForm.description.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Failed to save"); return; }
      setDays((prev) => prev.map((d) => d.id === editDay.id ? { ...d, ...data.day } : d).sort((a, b) => a.dayNumber - b.dayNumber));
      toast.success("Day updated");
      setEditDay(null);
    } finally { setLoading(false); }
  }

  async function handleDelete(day: ItineraryDay) {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/treks/${trekId}/itinerary/${day.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Failed to delete"); return; }
      setDays((prev) => prev.filter((d) => d.id !== day.id));
      toast.success("Day removed");
    } finally { setLoading(false); }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500 dark:text-slate-400">{days.length} day{days.length !== 1 ? "s" : ""} planned</p>
        <Button onClick={() => setShowAdd(true)} size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5">
          <Plus className="h-3.5 w-3.5" /> Add Day
        </Button>
      </div>

      {days.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-700 py-12 text-center">
          <p className="text-sm text-slate-400">No itinerary yet. Add the first day.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {days.map((day) => (
            <div key={day.id} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 flex gap-4">
              <div className="flex items-start gap-2 text-slate-400 mt-0.5">
                <GripVertical className="h-4 w-4 shrink-0" />
                <div className="h-7 w-7 rounded-full bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-xs font-bold text-emerald-700 dark:text-emerald-400 shrink-0">
                  {day.dayNumber}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-slate-800 dark:text-slate-200">{day.title}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">{day.description}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => openEdit(day)} className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => handleDelete(day)} disabled={loading} className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add day dialog */}
      <Dialog open={showAdd} onOpenChange={(o) => !o && setShowAdd(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Add Itinerary Day</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Day number <span className="text-destructive">*</span></Label>
              <Input type="number" min={1} value={newDay.dayNumber} onChange={(e) => setNewDay((p) => ({ ...p, dayNumber: e.target.value }))} placeholder="1" autoFocus />
            </div>
            <div className="space-y-1.5">
              <Label>Title <span className="text-destructive">*</span></Label>
              <Input value={newDay.title} onChange={(e) => setNewDay((p) => ({ ...p, title: e.target.value }))} placeholder="e.g. Fly to Lukla, trek to Phakding" />
            </div>
            <div className="space-y-1.5">
              <Label>Description <span className="text-destructive">*</span></Label>
              <Textarea value={newDay.description} onChange={(e) => setNewDay((p) => ({ ...p, description: e.target.value }))} rows={3} placeholder="Describe the day's activities and highlights…" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)} disabled={loading}>Cancel</Button>
            <Button onClick={handleAdd} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white">{loading ? "Adding…" : "Add Day"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit day dialog */}
      <Dialog open={!!editDay} onOpenChange={(o) => !o && setEditDay(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Edit Day {editDay?.dayNumber}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Day number</Label>
              <Input type="number" min={1} value={editForm.dayNumber} onChange={(e) => setEditForm((p) => ({ ...p, dayNumber: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input value={editForm.title} onChange={(e) => setEditForm((p) => ({ ...p, title: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea value={editForm.description} onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDay(null)} disabled={loading}>Cancel</Button>
            <Button onClick={handleEditSave} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white">{loading ? "Saving…" : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Media Tab ────────────────────────────────────────────────────────────────

function MediaTab({ trekId, initialMedia, onSaved }: { trekId: string; initialMedia: MediaItem[]; onSaved: () => void }) {
  const [media, setMedia] = useState<MediaItem[]>(initialMedia);
  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState<MediaItem | null>(null);
  const [loading, setLoading] = useState(false);

  const [newItem, setNewItem] = useState({ url: "", mediaType: "image", caption: "" });
  const [editForm, setEditForm] = useState({ caption: "", sortOrder: "" });

  async function handleAdd() {
    if (!newItem.url.trim()) { toast.error("URL is required"); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/treks/${trekId}/media`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: newItem.url.trim(), mediaType: newItem.mediaType, caption: newItem.caption.trim() || undefined, sortOrder: media.length }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Failed to add media"); return; }
      toast.success("Media added");
      setShowAdd(false);
      setNewItem({ url: "", mediaType: "image", caption: "" });
      onSaved();
      // Add placeholder until refresh
      setMedia((prev) => [...prev, { id: `tmp-${Date.now()}`, url: newItem.url.trim(), mediaType: newItem.mediaType, caption: newItem.caption.trim() || null, sortOrder: prev.length }]);
    } finally { setLoading(false); }
  }

  async function handleEditSave() {
    if (!editItem) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/treks/${trekId}/media/${editItem.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caption: editForm.caption.trim() || null,
          sortOrder: editForm.sortOrder ? Number(editForm.sortOrder) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Failed to save"); return; }
      setMedia((prev) => prev.map((m) => m.id === editItem.id ? { ...m, ...data.media } : m));
      toast.success("Media updated");
      setEditItem(null);
    } finally { setLoading(false); }
  }

  async function handleDelete(item: MediaItem) {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/treks/${trekId}/media/${item.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Failed to delete"); return; }
      setMedia((prev) => prev.filter((m) => m.id !== item.id));
      toast.success("Media removed");
    } finally { setLoading(false); }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500 dark:text-slate-400">{media.length} item{media.length !== 1 ? "s" : ""}</p>
        <Button onClick={() => setShowAdd(true)} size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5">
          <Plus className="h-3.5 w-3.5" /> Add Media
        </Button>
      </div>

      {media.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-700 py-12 text-center">
          <p className="text-sm text-slate-400">No media yet. Add images or videos.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {media.map((item) => (
            <div key={item.id} className="group relative rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900">
              <div className="aspect-video bg-slate-100 dark:bg-slate-800 flex items-center justify-center relative">
                {item.mediaType === "image" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.url} alt={item.caption ?? ""} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                ) : (
                  <Video className="h-8 w-8 text-slate-400" />
                )}
                <div className="absolute top-1.5 left-1.5">
                  <span className="text-[10px] font-medium bg-black/60 text-white px-1.5 py-0.5 rounded flex items-center gap-1">
                    {item.mediaType === "image" ? <Image className="h-2.5 w-2.5" /> : <Video className="h-2.5 w-2.5" />}
                    {item.mediaType}
                  </span>
                </div>
                <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <button onClick={() => { setEditItem(item); setEditForm({ caption: item.caption ?? "", sortOrder: String(item.sortOrder) }); }}
                    className="p-1 rounded bg-white/90 text-slate-700 hover:bg-white shadow-sm transition-colors">
                    <Pencil className="h-3 w-3" />
                  </button>
                  <button onClick={() => handleDelete(item)} disabled={loading}
                    className="p-1 rounded bg-white/90 text-red-600 hover:bg-white shadow-sm transition-colors">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
              {item.caption && (
                <p className="px-2.5 py-1.5 text-xs text-slate-500 dark:text-slate-400 truncate">{item.caption}</p>
              )}
              <p className="px-2.5 pb-1.5 text-[10px] text-slate-400 truncate">{item.url}</p>
            </div>
          ))}
        </div>
      )}

      {/* Add media dialog */}
      <Dialog open={showAdd} onOpenChange={(o) => !o && setShowAdd(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Add Media</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <div className="flex gap-2">
                {["image", "video"].map((t) => (
                  <button key={t} onClick={() => setNewItem((p) => ({ ...p, mediaType: t }))}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      newItem.mediaType === t
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                        : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                    }`}>
                    {t === "image" ? <Image className="h-4 w-4" /> : <Video className="h-4 w-4" />}
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>URL <span className="text-destructive">*</span></Label>
              <Input value={newItem.url} onChange={(e) => setNewItem((p) => ({ ...p, url: e.target.value }))} placeholder="https://…" autoFocus />
            </div>
            <div className="space-y-1.5">
              <Label>Caption (optional)</Label>
              <Input value={newItem.caption} onChange={(e) => setNewItem((p) => ({ ...p, caption: e.target.value }))} placeholder="e.g. View from Kala Patthar at sunrise" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)} disabled={loading}>Cancel</Button>
            <Button onClick={handleAdd} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white">{loading ? "Adding…" : "Add"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit media dialog */}
      <Dialog open={!!editItem} onOpenChange={(o) => !o && setEditItem(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Edit Media</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Caption</Label>
              <Input value={editForm.caption} onChange={(e) => setEditForm((p) => ({ ...p, caption: e.target.value }))} placeholder="Caption…" />
            </div>
            <div className="space-y-1.5">
              <Label>Sort order</Label>
              <Input type="number" min={0} value={editForm.sortOrder} onChange={(e) => setEditForm((p) => ({ ...p, sortOrder: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditItem(null)} disabled={loading}>Cancel</Button>
            <Button onClick={handleEditSave} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white">{loading ? "Saving…" : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
