"use client";

import { useState } from "react";
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
import {
  Plus,
  Pencil,
  Trash2,
  MapPin,
  ToggleLeft,
  ToggleRight,
  Search,
} from "lucide-react";

interface Region {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  isActive: boolean;
  createdAt: string;
  _count: { treks: number };
}

interface Props {
  initialRegions: Region[];
}

type DialogMode = "create" | "edit" | "delete" | null;

export default function RegionsManager({ initialRegions }: Props) {
  const router = useRouter();
  const [regions, setRegions] = useState<Region[]>(initialRegions);
  const [search, setSearch] = useState("");
  const [dialog, setDialog] = useState<DialogMode>(null);
  const [selected, setSelected] = useState<Region | null>(null);
  const [loading, setLoading] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const filtered = regions.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase())
  );

  function openCreate() {
    setName("");
    setImageUrl("");
    setSelected(null);
    setDialog("create");
  }

  function openEdit(r: Region) {
    setName(r.name);
    setImageUrl(r.imageUrl ?? "");
    setSelected(r);
    setDialog("edit");
  }

  function openDelete(r: Region) {
    setSelected(r);
    setDialog("delete");
  }

  function closeDialog() {
    setDialog(null);
    setSelected(null);
  }

  async function handleCreate() {
    if (!name.trim()) { toast.error("Name is required"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/regions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), imageUrl: imageUrl.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Failed to create region"); return; }
      setRegions((prev) => [...prev, { ...data.region, _count: { treks: 0 }, createdAt: data.region.createdAt ?? new Date().toISOString() }].sort((a, b) => a.name.localeCompare(b.name)));
      toast.success(`Region "${data.region.name}" created`);
      closeDialog();
      router.refresh();
    } finally { setLoading(false); }
  }

  async function handleEdit() {
    if (!selected || !name.trim()) { toast.error("Name is required"); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/regions/${selected.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), imageUrl: imageUrl.trim() || null }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Failed to update region"); return; }
      setRegions((prev) => prev.map((r) => r.id === selected.id ? { ...r, ...data.region } : r));
      toast.success("Region updated");
      closeDialog();
    } finally { setLoading(false); }
  }

  async function handleDelete() {
    if (!selected) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/regions/${selected.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Failed to delete region"); return; }
      setRegions((prev) => prev.filter((r) => r.id !== selected.id));
      toast.success("Region deleted");
      closeDialog();
    } finally { setLoading(false); }
  }

  async function toggleActive(r: Region) {
    const res = await fetch(`/api/admin/regions/${r.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !r.isActive }),
    });
    const data = await res.json();
    if (!res.ok) { toast.error(data.error ?? "Failed to update"); return; }
    setRegions((prev) => prev.map((x) => x.id === r.id ? { ...x, isActive: !x.isActive } : x));
    toast.success(`Region ${!r.isActive ? "activated" : "deactivated"}`);
  }

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search regions…"
            className="pl-9"
          />
        </div>
        <Button onClick={openCreate} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shrink-0">
          <Plus className="h-4 w-4" /> Add Region
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
              <th className="text-left px-4 py-3 font-medium text-slate-500 dark:text-slate-400">Region</th>
              <th className="text-left px-4 py-3 font-medium text-slate-500 dark:text-slate-400 hidden sm:table-cell">Slug</th>
              <th className="text-center px-4 py-3 font-medium text-slate-500 dark:text-slate-400">Treks</th>
              <th className="text-center px-4 py-3 font-medium text-slate-500 dark:text-slate-400">Status</th>
              <th className="text-right px-4 py-3 font-medium text-slate-500 dark:text-slate-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-12 text-slate-400">
                  {search ? "No regions match your search." : "No regions yet. Create one to get started."}
                </td>
              </tr>
            ) : (
              filtered.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center shrink-0">
                        <MapPin className="h-4 w-4 text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-800 dark:text-slate-200">{r.name}</p>
                        {r.imageUrl && (
                          <p className="text-xs text-slate-400 truncate max-w-[160px]">{r.imageUrl}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <code className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                      {r.slug}
                    </code>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant="secondary">{r._count.treks}</Badge>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => toggleActive(r)} className="inline-flex items-center gap-1 text-xs font-medium transition-colors">
                      {r.isActive ? (
                        <>
                          <ToggleRight className="h-4 w-4 text-emerald-600" />
                          <span className="text-emerald-700 dark:text-emerald-400">Active</span>
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="h-4 w-4 text-slate-400" />
                          <span className="text-slate-400">Inactive</span>
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(r)}
                        className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => openDelete(r)}
                        disabled={r._count.treks > 0}
                        className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        title={r._count.treks > 0 ? "Cannot delete: region has treks" : "Delete"}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={dialog === "create" || dialog === "edit"} onOpenChange={(o) => !o && closeDialog()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{dialog === "create" ? "Add Region" : "Edit Region"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="region-name">Name <span className="text-destructive">*</span></Label>
              <Input
                id="region-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Everest Region"
                autoFocus
              />
              {name.trim() && (
                <p className="text-xs text-slate-400">
                  Slug: <code className="text-slate-600 dark:text-slate-300">{name.trim().toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-")}</code>
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="region-image">Cover image URL (optional)</Label>
              <Input
                id="region-image"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://…"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} disabled={loading}>Cancel</Button>
            <Button
              onClick={dialog === "create" ? handleCreate : handleEdit}
              disabled={loading || !name.trim()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {loading ? "Saving…" : dialog === "create" ? "Create" : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={dialog === "delete"} onOpenChange={(o) => !o && closeDialog()}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete region?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600 dark:text-slate-400 py-2">
            This will permanently delete <strong>{selected?.name}</strong>. This cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} disabled={loading}>Cancel</Button>
            <Button
              onClick={handleDelete}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {loading ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
