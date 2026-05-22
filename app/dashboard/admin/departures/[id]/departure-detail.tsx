"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
  ArrowLeft,
  Mountain,
  UserCheck,
  Trash2,
  ChevronRight,
  HardHat,
  MapPin,
  Phone,
  Mail,
} from "lucide-react";

interface Booking {
  id: string;
  status: string;
  amount: number;
  currency: string;
  confirmedAt: string | null;
  createdAt: string;
  user: { id: string; fullName: string; email: string; avatarUrl: string | null; phone: string | null };
}

interface AssignedGuide {
  id: string;
  role: string | null;
  assignedAt: string;
  guide: { id: string; fullName: string; email: string | null; phone: string | null; licenseNumber: string | null };
}

interface Departure {
  id: string;
  departureDate: string;
  returnDate: string | null;
  pricePerPerson: number;
  maxParticipants: number;
  currency: string;
  status: string;
  notes: string | null;
  trek: { id: string; title: string; slug: string; difficulty: string; durationDays: number; coverImageUrl: string | null; region: { name: string } };
  bookings: Booking[];
  guides: AssignedGuide[];
}

interface CompanyGuide { id: string; fullName: string; email: string | null; licenseNumber: string | null }

interface Props { departure: Departure; companyGuides: CompanyGuide[] }

const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  FULL: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  DEPARTED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  COMPLETED: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

const DIFFICULTY_COLORS: Record<string, string> = {
  EASY: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  MODERATE: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  STRENUOUS: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  EXTREME: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

const NEXT_STATUS: Record<string, { label: string; status: string; color: string } | null> = {
  SCHEDULED: { label: "Mark as Full", status: "FULL", color: "bg-amber-600 hover:bg-amber-700" },
  FULL: { label: "Mark as Departed", status: "DEPARTED", color: "bg-emerald-600 hover:bg-emerald-700" },
  DEPARTED: { label: "Mark as Completed", status: "COMPLETED", color: "bg-slate-600 hover:bg-slate-700" },
  COMPLETED: null,
  CANCELLED: null,
};

export default function DepartureDetail({ departure: initial, companyGuides }: Props) {
  const router = useRouter();
  const [departure, setDeparture] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showAssignGuide, setShowAssignGuide] = useState(false);
  const [selectedGuideId, setSelectedGuideId] = useState("");
  const [guideRole, setGuideRole] = useState("");

  const assignedGuideIds = new Set(departure.guides.map((g) => g.guide.id));
  const availableGuides = companyGuides.filter((g) => !assignedGuideIds.has(g.id));
  const confirmedBookings = departure.bookings.filter((b) => b.status === "CONFIRMED");
  const nextAction = NEXT_STATUS[departure.status];

  async function handleStatusChange(newStatus: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/departures/${departure.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Failed to update status"); return; }
      setDeparture((prev) => ({ ...prev, status: newStatus }));
      toast.success(`Status updated to ${newStatus}`);
    } finally { setLoading(false); }
  }

  async function handleCancelDeparture() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/departures/${departure.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Failed to cancel"); return; }
      setDeparture((prev) => ({ ...prev, status: "CANCELLED" }));
      toast.success("Departure cancelled");
    } finally { setLoading(false); }
  }

  async function handleAssignGuide() {
    if (!selectedGuideId) { toast.error("Select a guide"); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/departures/${departure.id}/guides`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guideId: selectedGuideId, role: guideRole || undefined }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Failed to assign guide"); return; }
      const guide = companyGuides.find((g) => g.id === selectedGuideId)!;
      setDeparture((prev) => ({
        ...prev,
        guides: [...prev.guides, {
          id: data.assignment.id,
          role: data.assignment.role,
          assignedAt: data.assignment.assignedAt,
          guide: { id: guide.id, fullName: guide.fullName, email: guide.email, phone: null, licenseNumber: guide.licenseNumber },
        }],
      }));
      toast.success(`${guide.fullName} assigned`);
      setShowAssignGuide(false);
      setSelectedGuideId("");
      setGuideRole("");
    } finally { setLoading(false); }
  }

  async function handleRemoveGuide(guideId: string, guideName: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/departures/${departure.id}/guides`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guideId }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Failed to remove guide"); return; }
      setDeparture((prev) => ({ ...prev, guides: prev.guides.filter((g) => g.guide.id !== guideId) }));
      toast.success(`${guideName} removed`);
    } finally { setLoading(false); }
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/admin/departures"
          className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white truncate">{departure.trek.title}</h1>
            <Badge className={STATUS_COLORS[departure.status]}>{departure.status}</Badge>
            <Badge className={DIFFICULTY_COLORS[departure.trek.difficulty]}>{departure.trek.difficulty}</Badge>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" />{departure.trek.region.name}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {nextAction && (
            <Button
              onClick={() => handleStatusChange(nextAction.status)}
              disabled={loading}
              className={`${nextAction.color} text-white gap-1.5`}
            >
              <ChevronRight className="h-4 w-4" />
              {nextAction.label}
            </Button>
          )}
          {departure.status !== "CANCELLED" && departure.status !== "COMPLETED" && (
            <Button variant="outline" onClick={() => setShowCancelConfirm(true)} disabled={loading}
              className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400">
              Cancel
            </Button>
          )}
        </div>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: CalendarDays, label: "Departure", value: new Date(departure.departureDate).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }) },
          { icon: CalendarDays, label: "Return", value: departure.returnDate ? new Date(departure.returnDate).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }) : "—" },
          { icon: DollarSign, label: "Price / person", value: `$${departure.pricePerPerson}` },
          { icon: Users, label: "Bookings", value: `${confirmedBookings.length} / ${departure.maxParticipants}` },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
            <div className="flex items-center gap-2 mb-1">
              <Icon className="h-4 w-4 text-slate-400" />
              <span className="text-xs text-slate-500">{label}</span>
            </div>
            <p className="font-semibold text-slate-800 dark:text-slate-200">{value}</p>
          </div>
        ))}
      </div>

      {/* Guides section */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HardHat className="h-4 w-4 text-slate-500" />
            <h2 className="font-semibold text-slate-800 dark:text-slate-200">Assigned Guides</h2>
            <span className="text-xs text-slate-400">({departure.guides.length})</span>
          </div>
          {departure.status !== "COMPLETED" && departure.status !== "CANCELLED" && (
            <Button size="sm" onClick={() => setShowAssignGuide(true)} disabled={availableGuides.length === 0}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1">
              + Assign Guide
            </Button>
          )}
        </div>
        {departure.guides.length === 0 ? (
          <div className="py-10 text-center">
            <HardHat className="h-8 w-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-sm text-slate-500">No guides assigned yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {departure.guides.map((g) => (
              <div key={g.id} className="p-4 flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-semibold text-sm shrink-0">
                  {g.guide.fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-800 dark:text-slate-200 text-sm">{g.guide.fullName}</p>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    {g.role && <span className="capitalize">{g.role}</span>}
                    {g.guide.email && <span className="flex items-center gap-0.5"><Mail className="h-3 w-3" />{g.guide.email}</span>}
                    {g.guide.licenseNumber && <span>#{g.guide.licenseNumber}</span>}
                  </div>
                </div>
                {departure.status !== "COMPLETED" && departure.status !== "DEPARTED" && (
                  <button
                    onClick={() => handleRemoveGuide(g.guide.id, g.guide.fullName)}
                    disabled={loading}
                    className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Participants section */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
          <Users className="h-4 w-4 text-slate-500" />
          <h2 className="font-semibold text-slate-800 dark:text-slate-200">Participants</h2>
          <span className="text-xs text-slate-400">({confirmedBookings.length} confirmed)</span>
        </div>
        {departure.bookings.length === 0 ? (
          <div className="py-10 text-center">
            <Users className="h-8 w-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-sm text-slate-500">No bookings yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {departure.bookings.map((b) => (
              <div key={b.id} className="p-4 flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 overflow-hidden">
                  {b.user.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={b.user.avatarUrl} alt={b.user.fullName} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-xs font-semibold text-slate-500">
                      {b.user.fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-800 dark:text-slate-200 text-sm">{b.user.fullName}</p>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="flex items-center gap-0.5"><Mail className="h-3 w-3" />{b.user.email}</span>
                    {b.user.phone && <span className="flex items-center gap-0.5"><Phone className="h-3 w-3" />{b.user.phone}</span>}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">${b.amount}</p>
                  <Badge className={b.status === "CONFIRMED"
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
                    : "bg-slate-100 text-slate-600"}>
                    {b.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Assign guide dialog */}
      <Dialog open={showAssignGuide} onOpenChange={(o) => !o && setShowAssignGuide(false)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Assign Company Guide</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Guide</label>
              <select
                value={selectedGuideId}
                onChange={(e) => setSelectedGuideId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Select a guide…</option>
                {availableGuides.map((g) => (
                  <option key={g.id} value={g.id}>{g.fullName}{g.licenseNumber ? ` (#${g.licenseNumber})` : ""}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Role (optional)</label>
              <select
                value={guideRole}
                onChange={(e) => setGuideRole(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">No specific role</option>
                <option value="lead">Lead Guide</option>
                <option value="assistant">Assistant Guide</option>
                <option value="porter">Porter Guide</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssignGuide(false)} disabled={loading}>Cancel</Button>
            <Button onClick={handleAssignGuide} disabled={loading || !selectedGuideId} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              {loading ? "Assigning…" : "Assign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel confirmation dialog */}
      <Dialog open={showCancelConfirm} onOpenChange={(o) => !o && setShowCancelConfirm(false)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Cancel this departure?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-500 dark:text-slate-400 py-2">
            This will cancel the departure and notify all booked travellers. This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelConfirm(false)} disabled={loading}>
              Keep it
            </Button>
            <Button
              onClick={async () => { setShowCancelConfirm(false); await handleCancelDeparture(); }}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {loading ? "Cancelling…" : "Yes, cancel"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Trek quick-link */}
      <div className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
        <div className="flex items-center gap-3">
          <Mountain className="h-4 w-4 text-slate-400" />
          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Trek template</p>
            <p className="text-xs text-slate-500">{departure.trek.title} · {departure.trek.durationDays} days</p>
          </div>
        </div>
        <Link
          href={`/dashboard/admin/treks/${departure.trek.id}/departures`}
          className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
        >
          List again <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </>
  );
}
