"use client";

import { useState } from "react";
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
import { Plus, Search, Pencil, Trash2, HardHat, Mail, Phone } from "lucide-react";

interface Guide {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  licenseNumber: string | null;
  experienceYears: number;
  languages: string[];
  specializations: string[];
  isActive: boolean;
  createdAt: string;
  _count: { assignments: number };
}

interface Props { initialGuides: Guide[] }

const emptyForm = {
  fullName: "",
  email: "",
  phone: "",
  licenseNumber: "",
  experienceYears: "0",
  languages: "",
  specializations: "",
};

export default function CompanyGuidesManager({ initialGuides }: Props) {
  const [guides, setGuides] = useState<Guide[]>(initialGuides);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<Guide | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Guide | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const filtered = guides.filter(
    (g) =>
      g.fullName.toLowerCase().includes(search.toLowerCase()) ||
      g.email?.toLowerCase().includes(search.toLowerCase()) ||
      g.licenseNumber?.toLowerCase().includes(search.toLowerCase())
  );

  function setField(k: keyof typeof form, v: string) {
    setForm((prev) => ({ ...prev, [k]: v }));
  }

  function openCreate() {
    setForm(emptyForm);
    setEditTarget(null);
    setShowCreate(true);
  }

  function openEdit(g: Guide) {
    setForm({
      fullName: g.fullName,
      email: g.email ?? "",
      phone: g.phone ?? "",
      licenseNumber: g.licenseNumber ?? "",
      experienceYears: String(g.experienceYears),
      languages: g.languages.join(", "),
      specializations: g.specializations.join(", "),
    });
    setEditTarget(g);
    setShowCreate(true);
  }

  function parseList(s: string) {
    return s.split(",").map((x) => x.trim()).filter(Boolean);
  }

  async function handleSave() {
    if (!form.fullName.trim()) { toast.error("Full name is required"); return; }
    setLoading(true);
    try {
      const payload = {
        fullName: form.fullName.trim(),
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
        licenseNumber: form.licenseNumber.trim() || undefined,
        experienceYears: Number(form.experienceYears) || 0,
        languages: parseList(form.languages),
        specializations: parseList(form.specializations),
      };

      const url = editTarget ? `/api/admin/company-guides/${editTarget.id}` : "/api/admin/company-guides";
      const method = editTarget ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Failed"); return; }

      if (editTarget) {
        setGuides((prev) =>
          prev.map((g) =>
            g.id === editTarget.id
              ? { ...g, ...data.guide, languages: data.guide.languages ?? [], specializations: data.guide.specializations ?? [] }
              : g
          )
        );
        toast.success("Guide updated");
      } else {
        setGuides((prev) => [{ ...data.guide, _count: { assignments: 0 }, languages: data.guide.languages ?? [], specializations: data.guide.specializations ?? [] }, ...prev]);
        toast.success("Guide created");
      }
      setShowCreate(false);
    } finally { setLoading(false); }
  }

  async function handleDelete(guide: Guide) {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/company-guides/${guide.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Failed"); return; }
      setGuides((prev) => prev.filter((g) => g.id !== guide.id));
      toast.success(`${guide.fullName} removed`);
      setDeleteTarget(null);
    } finally { setLoading(false); }
  }

  return (
    <>
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search guides…" className="pl-9" />
        </div>
        <Button onClick={openCreate} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shrink-0">
          <Plus className="h-4 w-4" /> Add Guide
        </Button>
      </div>

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-700 py-16 text-center">
            <HardHat className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-500 mb-4">
              {search ? "No guides match your search." : "No company guides yet."}
            </p>
            {!search && (
              <Button onClick={openCreate} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5">
                <Plus className="h-4 w-4" /> Add First Guide
              </Button>
            )}
          </div>
        ) : (
          filtered.map((g) => (
            <div
              key={g.id}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 flex items-center gap-4 hover:border-emerald-200 dark:hover:border-emerald-800 transition-colors"
            >
              <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-semibold shrink-0">
                {g.fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
              </div>

              <div className="flex-1 min-w-0 space-y-0.5">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{g.fullName}</h3>
                  {!g.isActive && <Badge className="bg-slate-100 text-slate-500 text-[10px]">Inactive</Badge>}
                  {g.licenseNumber && (
                    <span className="text-xs text-slate-400">#{g.licenseNumber}</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-400">
                  {g.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{g.email}</span>}
                  {g.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{g.phone}</span>}
                  <span>{g.experienceYears}y experience</span>
                  <span>{g._count.assignments} assignment{g._count.assignments !== 1 ? "s" : ""}</span>
                </div>
                {(g.languages.length > 0 || g.specializations.length > 0) && (
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    {g.languages.map((l) => (
                      <span key={l} className="px-1.5 py-0.5 rounded text-[10px] bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">{l}</span>
                    ))}
                    {g.specializations.map((s) => (
                      <span key={s} className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">{s}</span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => openEdit(g)}
                  className="p-1.5 rounded-md text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setDeleteTarget(g)}
                  className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={showCreate} onOpenChange={(o) => !o && setShowCreate(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editTarget ? "Edit Guide" : "Add Company Guide"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Full name <span className="text-destructive">*</span></Label>
              <Input value={form.fullName} onChange={(e) => setField("fullName", e.target.value)} placeholder="Ramesh Tamang" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={(e) => setField("email", e.target.value)} placeholder="guide@example.com" />
              </div>
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input value={form.phone} onChange={(e) => setField("phone", e.target.value)} placeholder="+977 9800000000" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>License number</Label>
                <Input value={form.licenseNumber} onChange={(e) => setField("licenseNumber", e.target.value)} placeholder="NTB-12345" />
              </div>
              <div className="space-y-1.5">
                <Label>Years of experience</Label>
                <Input type="number" min={0} value={form.experienceYears} onChange={(e) => setField("experienceYears", e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Languages <span className="text-xs text-slate-400">(comma-separated)</span></Label>
              <Input value={form.languages} onChange={(e) => setField("languages", e.target.value)} placeholder="Nepali, English, Hindi" />
            </div>
            <div className="space-y-1.5">
              <Label>Specializations <span className="text-xs text-slate-400">(comma-separated)</span></Label>
              <Input value={form.specializations} onChange={(e) => setField("specializations", e.target.value)} placeholder="High Altitude, Rock Climbing" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)} disabled={loading}>Cancel</Button>
            <Button onClick={handleSave} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              {loading ? "Saving…" : editTarget ? "Save Changes" : "Add Guide"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Remove guide?</DialogTitle></DialogHeader>
          <p className="text-sm text-slate-600 dark:text-slate-400 py-2">
            This will remove <strong>{deleteTarget?.fullName}</strong> from the company guide roster.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={loading}>Cancel</Button>
            <Button onClick={() => deleteTarget && handleDelete(deleteTarget)} disabled={loading} className="bg-red-600 hover:bg-red-700 text-white">
              {loading ? "Removing…" : "Remove"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
