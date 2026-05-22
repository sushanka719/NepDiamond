"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  CheckCircle,
  XCircle,
  Clock,
  User,
  MapPin,
  DollarSign,
  Languages,
  Briefcase,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface PendingGuide {
  id: string;
  bio: string | null;
  experienceYears: number;
  dailyRate: number | string;
  currency: string;
  languages: string[];
  specializations: string[];
  licenseNumber: string | null;
  createdAt: string | Date;
  user: {
    id: string;
    fullName: string;
    email: string;
    avatarUrl: string | null;
  };
}

interface Props {
  initialGuides: PendingGuide[];
  totalPending: number;
  totalApproved: number;
  totalRejected: number;
}

function GuideCard({
  guide,
  onApprove,
  onReject,
}: {
  guide: PendingGuide;
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string, reason: string) => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);

  async function handleApprove() {
    setLoading("approve");
    await onApprove(guide.id);
    setLoading(null);
  }

  async function handleReject() {
    if (!reason.trim()) {
      toast.error("Rejection reason is required.");
      return;
    }
    setLoading("reject");
    await onReject(guide.id, reason.trim());
    setLoading(null);
  }

  const initials = guide.user.fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden">
      {/* Card header */}
      <div className="p-4 flex items-start gap-4">
        {/* Avatar */}
        {guide.user.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={guide.user.avatarUrl}
            alt={guide.user.fullName}
            className="h-11 w-11 rounded-full object-cover shrink-0 ring-2 ring-slate-100"
          />
        ) : (
          <div className="h-11 w-11 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0 text-emerald-700 dark:text-emerald-400 font-semibold text-sm">
            {initials}
          </div>
        )}

        {/* Info */}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
              {guide.user.fullName}
            </h3>
            <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 text-xs">
              <Clock className="h-3 w-3 mr-1" />
              Pending
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <User className="h-3 w-3 shrink-0" />
            {guide.user.email}
          </p>

          {/* Quick stats */}
          <div className="flex flex-wrap gap-3 pt-1">
            <span className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400">
              <Briefcase className="h-3 w-3 text-emerald-500" />
              {guide.experienceYears} yrs exp
            </span>
            <span className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400">
              <DollarSign className="h-3 w-3 text-emerald-500" />
              {Number(guide.dailyRate).toFixed(0)} {guide.currency}/day
            </span>
            {guide.languages.length > 0 && (
              <span className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400">
                <Languages className="h-3 w-3 text-emerald-500" />
                {guide.languages.slice(0, 2).join(", ")}
                {guide.languages.length > 2 && ` +${guide.languages.length - 2}`}
              </span>
            )}
            <span className="text-xs text-slate-400">
              Applied {new Date(guide.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Expand toggle */}
        <button
          onClick={() => setExpanded((v) => !v)}
          className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 shrink-0 transition-colors"
        >
          {expanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-slate-100 dark:border-slate-800 pt-3">
          {guide.bio && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Bio
              </p>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                {guide.bio}
              </p>
            </div>
          )}
          {guide.specializations.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Specializations
              </p>
              <div className="flex flex-wrap gap-1.5">
                {guide.specializations.map((s) => (
                  <span
                    key={s}
                    className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-md"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
          {guide.languages.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Languages
              </p>
              <div className="flex flex-wrap gap-1.5">
                {guide.languages.map((l) => (
                  <span
                    key={l}
                    className="text-xs bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-md"
                  >
                    {l}
                  </span>
                ))}
              </div>
            </div>
          )}
          {guide.licenseNumber && (
            <p className="text-xs text-slate-500">
              License #:{" "}
              <span className="font-mono text-slate-700 dark:text-slate-300">
                {guide.licenseNumber}
              </span>
            </p>
          )}
        </div>
      )}

      {/* Rejection reason input */}
      {rejecting && (
        <div className="px-4 pb-3 pt-2 border-t border-red-100 dark:border-red-900/30 bg-red-50/50 dark:bg-red-950/10 space-y-2">
          <p className="text-xs font-medium text-red-700 dark:text-red-400 flex items-center gap-1">
            <AlertCircle className="h-3.5 w-3.5" />
            Provide a reason for rejection (shown to the guide)
          </p>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="e.g. License number could not be verified. Please resubmit with a valid document..."
            className="w-full rounded-lg border border-red-200 dark:border-red-800 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleReject}
              disabled={loading !== null || !reason.trim()}
              className="bg-red-600 hover:bg-red-700 text-white text-xs"
            >
              {loading === "reject" ? "Rejecting…" : "Confirm Reject"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setRejecting(false);
                setReason("");
              }}
              disabled={loading !== null}
              className="text-xs"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Action buttons */}
      {!rejecting && (
        <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 flex gap-2">
          <Button
            size="sm"
            onClick={handleApprove}
            disabled={loading !== null}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5 flex-1 sm:flex-none"
          >
            <CheckCircle className="h-3.5 w-3.5" />
            {loading === "approve" ? "Approving…" : "Approve"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setRejecting(true)}
            disabled={loading !== null}
            className="text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-950/30 text-xs gap-1.5 flex-1 sm:flex-none"
          >
            <XCircle className="h-3.5 w-3.5" />
            Reject
          </Button>
        </div>
      )}
    </div>
  );
}

export default function GuideVerificationsPanel({
  initialGuides,
  totalPending,
  totalApproved,
  totalRejected,
}: Props) {
  const router = useRouter();
  const [guides, setGuides] = useState<PendingGuide[]>(initialGuides);

  async function handleApprove(id: string) {
    const res = await fetch(`/api/admin/verifications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "approve" }),
    });
    const data = await res.json();

    if (!res.ok) {
      toast.error(data.error ?? "Failed to approve guide.");
      return;
    }

    toast.success(data.message ?? "Guide approved.");
    setGuides((prev) => prev.filter((g) => g.id !== id));
    router.refresh();
  }

  async function handleReject(id: string, reason: string) {
    const res = await fetch(`/api/admin/verifications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reject", rejectionReason: reason }),
    });
    const data = await res.json();

    if (!res.ok) {
      toast.error(data.error ?? "Failed to reject guide.");
      return;
    }

    toast.success(data.message ?? "Guide rejected.");
    setGuides((prev) => prev.filter((g) => g.id !== id));
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {/* Stat strip */}
      <div className="grid grid-cols-3 gap-4">
        {[
          {
            label: "Pending",
            value: totalPending,
            color: "text-yellow-600",
            bg: "bg-yellow-50 dark:bg-yellow-950/20",
          },
          {
            label: "Approved",
            value: totalApproved,
            color: "text-emerald-600",
            bg: "bg-emerald-50 dark:bg-emerald-950/20",
          },
          {
            label: "Rejected",
            value: totalRejected,
            color: "text-red-500",
            bg: "bg-red-50 dark:bg-red-950/20",
          },
        ].map(({ label, value, color, bg }) => (
          <div
            key={label}
            className={`rounded-xl border p-4 text-center ${bg}`}
          >
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {label}
            </p>
          </div>
        ))}
      </div>

      {/* Pending list */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            Pending Reviews
            {guides.length > 0 && (
              <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                {guides.length}
              </Badge>
            )}
          </h2>
        </div>

        {guides.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-700 py-14 text-center">
            <CheckCircle className="h-10 w-10 text-emerald-400 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              All caught up!
            </p>
            <p className="text-xs text-slate-400 mt-1">
              No pending guide verifications.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {guides.map((guide) => (
              <GuideCard
                key={guide.id}
                guide={guide}
                onApprove={handleApprove}
                onReject={handleReject}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
