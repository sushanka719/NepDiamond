"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Search,
  Users,
  Star,
  BadgeCheck,
  Clock,
  Languages,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";

interface Guide {
  id: string;
  verificationStatus: "PENDING" | "APPROVED" | "REJECTED";
  experienceYears: number;
  languages: string[];
  specializations: string[];
  dailyRate: number;
  currency: string;
  licenseNumber: string | null;
  rejectionReason: string | null;
  verifiedAt: string | null;
  createdAt: string;
  user: {
    id: string;
    fullName: string;
    email: string;
    avatarUrl: string | null;
    isActive: boolean;
  };
  _count: { hires: number; reviews: number };
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  APPROVED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  REJECTED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

const STATUS_ICON: Record<string, React.ReactNode> = {
  PENDING: <AlertCircle className="h-3 w-3" />,
  APPROVED: <CheckCircle2 className="h-3 w-3" />,
  REJECTED: <XCircle className="h-3 w-3" />,
};

export default function AdminGuidesManager({ initialGuides }: { initialGuides: Guide[] }) {
  const [guides, setGuides] = useState<Guide[]>(initialGuides);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [actionTarget, setActionTarget] = useState<{ guide: Guide; action: "approve" | "reject" } | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [loading, setLoading] = useState(false);

  const filtered = guides.filter((g) => {
    const matchSearch =
      g.user.fullName.toLowerCase().includes(search.toLowerCase()) ||
      g.user.email.toLowerCase().includes(search.toLowerCase()) ||
      g.specializations.some((s) => s.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = statusFilter === "ALL" || g.verificationStatus === statusFilter;
    return matchSearch && matchStatus;
  });

  const counts = {
    ALL: guides.length,
    PENDING: guides.filter((g) => g.verificationStatus === "PENDING").length,
    APPROVED: guides.filter((g) => g.verificationStatus === "APPROVED").length,
    REJECTED: guides.filter((g) => g.verificationStatus === "REJECTED").length,
  };

  async function handleVerification() {
    if (!actionTarget) return;
    const { guide, action } = actionTarget;

    if (action === "reject" && !rejectionReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/verifications/${guide.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          ...(action === "reject" ? { rejectionReason: rejectionReason.trim() } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Action failed"); return; }

      const newStatus = action === "approve" ? "APPROVED" : "REJECTED";
      setGuides((prev) =>
        prev.map((g) =>
          g.id === guide.id
            ? { ...g, verificationStatus: newStatus, rejectionReason: action === "reject" ? rejectionReason.trim() : null }
            : g
        )
      );
      toast.success(data.message);
      setActionTarget(null);
      setRejectionReason("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Filter tabs */}
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {(["ALL", "PENDING", "APPROVED", "REJECTED"] as const).map((s) => (
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

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, specialization…"
            className="pl-9"
          />
        </div>
      </div>

      {/* Guide list */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-700 py-16 text-center">
            <Users className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-500">
              {search || statusFilter !== "ALL" ? "No guides match your filters." : "No guide profiles yet."}
            </p>
          </div>
        ) : (
          filtered.map((guide) => {
            const initials = guide.user.fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
            return (
              <div
                key={guide.id}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 flex items-center gap-4"
              >
                {/* Avatar */}
                {guide.user.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={guide.user.avatarUrl} alt={guide.user.fullName} className="h-12 w-12 rounded-xl object-cover shrink-0" />
                ) : (
                  <div className="h-12 w-12 rounded-xl bg-emerald-500 flex items-center justify-center text-white font-bold shrink-0">
                    {initials}
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-slate-900 dark:text-white truncate">{guide.user.fullName}</span>
                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[guide.verificationStatus]}`}>
                      {STATUS_ICON[guide.verificationStatus]}
                      {guide.verificationStatus.charAt(0) + guide.verificationStatus.slice(1).toLowerCase()}
                    </span>
                    {!guide.user.isActive && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800">Inactive</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 truncate">{guide.user.email}</p>
                  <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{guide.experienceYears} yrs</span>
                    <span className="flex items-center gap-1"><Star className="h-3 w-3" />{guide._count.reviews} reviews</span>
                    <span className="flex items-center gap-1"><BadgeCheck className="h-3 w-3" />{guide._count.hires} hires</span>
                    {guide.languages.length > 0 && (
                      <span className="flex items-center gap-1"><Languages className="h-3 w-3" />{guide.languages.slice(0, 2).join(", ")}{guide.languages.length > 2 ? ` +${guide.languages.length - 2}` : ""}</span>
                    )}
                    <span className="font-medium text-slate-600 dark:text-slate-400">{guide.dailyRate} {guide.currency}/day</span>
                  </div>
                  {guide.specializations.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-0.5">
                      {guide.specializations.slice(0, 4).map((s) => (
                        <span key={s} className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded">{s}</span>
                      ))}
                      {guide.specializations.length > 4 && (
                        <span className="text-xs text-slate-400">+{guide.specializations.length - 4}</span>
                      )}
                    </div>
                  )}
                  {guide.verificationStatus === "REJECTED" && guide.rejectionReason && (
                    <p className="text-xs text-red-500 dark:text-red-400 mt-1">Reason: {guide.rejectionReason}</p>
                  )}
                </div>

                {/* Actions */}
                {guide.verificationStatus === "PENDING" && (
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      onClick={() => { setActionTarget({ guide, action: "approve" }); setRejectionReason(""); }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs"
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => { setActionTarget({ guide, action: "reject" }); setRejectionReason(""); }}
                      className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400 h-8 text-xs"
                    >
                      Reject
                    </Button>
                  </div>
                )}
                {guide.verificationStatus === "APPROVED" && (
                  <span className="text-xs text-slate-400 shrink-0">
                    {guide.verifiedAt ? `Approved ${new Date(guide.verifiedAt).toLocaleDateString()}` : "Approved"}
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Approve / Reject confirmation dialog */}
      <Dialog
        open={!!actionTarget}
        onOpenChange={(open) => { if (!open) { setActionTarget(null); setRejectionReason(""); } }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {actionTarget?.action === "approve" ? "Approve Guide" : "Reject Guide"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-1">
            {actionTarget && (
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {actionTarget.action === "approve"
                  ? `This will approve ${actionTarget.guide.user.fullName}'s profile and make them visible on the platform.`
                  : `This will reject ${actionTarget.guide.user.fullName}'s verification request.`}
              </p>
            )}
            {actionTarget?.action === "reject" && (
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Rejection reason <span className="text-destructive">*</span></Label>
                <Textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Explain why the profile is being rejected…"
                  rows={3}
                  className="resize-none text-sm"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setActionTarget(null); setRejectionReason(""); }} disabled={loading}>
              Cancel
            </Button>
            <Button
              onClick={handleVerification}
              disabled={loading}
              className={actionTarget?.action === "approve"
                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                : "bg-red-600 hover:bg-red-700 text-white"}
            >
              {loading ? "Saving…" : actionTarget?.action === "approve" ? "Approve" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
