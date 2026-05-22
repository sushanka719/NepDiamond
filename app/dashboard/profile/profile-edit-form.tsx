"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lock } from "lucide-react";

interface GuideProfile {
  bio: string;
  experienceYears: number;
  dailyRate: number;
  currency: string;
  languages: string[];
  specializations: string[];
  licenseNumber: string;
  coverPhotoUrl: string;
  verificationStatus: string;
}

interface Props {
  user: {
    fullName: string;
    email: string;
    phone: string;
    avatarUrl: string;
    role: "ADMIN" | "GUIDE" | "TRAVELLER";
  };
  guideProfile: GuideProfile | null;
}

const STATUS_BADGE: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  APPROVED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  REJECTED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

function Field({
  label,
  children,
  locked,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  locked?: boolean;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>
        {locked && <Lock className="h-3 w-3 text-slate-400" />}
      </div>
      {children}
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

function Input({ ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:bg-slate-50 dark:disabled:bg-slate-800 ${props.className ?? ""}`}
    />
  );
}

function Textarea({ ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none disabled:opacity-50"
    />
  );
}

export default function ProfileEditForm({ user, guideProfile }: Props) {
  const router = useRouter();

  const [fullName, setFullName] = useState(user.fullName);
  const [phone, setPhone] = useState(user.phone);
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl);
  const [savingAccount, setSavingAccount] = useState(false);

  const [bio, setBio] = useState(guideProfile?.bio ?? "");
  const [experienceYears, setExperienceYears] = useState(String(guideProfile?.experienceYears ?? 0));
  const [dailyRate, setDailyRate] = useState(String(guideProfile?.dailyRate ?? ""));
  const [currency, setCurrency] = useState(guideProfile?.currency ?? "USD");
  const [languages, setLanguages] = useState((guideProfile?.languages ?? []).join(", "));
  const [specializations, setSpecializations] = useState((guideProfile?.specializations ?? []).join(", "));
  const [coverPhotoUrl, setCoverPhotoUrl] = useState(guideProfile?.coverPhotoUrl ?? "");
  const [savingGuide, setSavingGuide] = useState(false);

  async function saveAccount() {
    setSavingAccount(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, phone, avatarUrl }),
      });
      if (!res.ok) {
        const d = await res.json();
        toast.error(d.error ?? "Failed to save");
        return;
      }
      toast.success("Account info updated");
      router.refresh();
    } finally {
      setSavingAccount(false);
    }
  }

  async function saveGuide() {
    setSavingGuide(true);
    try {
      const res = await fetch("/api/auth/guide/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bio,
          experienceYears: Number(experienceYears),
          dailyRate: Number(dailyRate),
          currency,
          languages: languages.split(",").map((l) => l.trim()).filter(Boolean),
          specializations: specializations.split(",").map((s) => s.trim()).filter(Boolean),
          coverPhotoUrl,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        toast.error(d.error ?? "Failed to save");
        return;
      }
      const d = await res.json();
      toast.success(d.message ?? "Guide profile updated");
      router.refresh();
    } finally {
      setSavingGuide(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Account Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="Email" locked hint="Email cannot be changed here — contact support.">
            <Input value={user.email} disabled />
          </Field>
          <Field label="Full Name">
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your full name"
            />
          </Field>
          <Field label="Phone" hint="Used for contact by travellers or admins.">
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+977 98XXXXXXXX"
            />
          </Field>
          <Field label="Avatar URL" hint="Direct link to a profile photo.">
            <Input
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://..."
            />
          </Field>
          <div className="flex justify-end pt-1">
            <button
              onClick={saveAccount}
              disabled={savingAccount}
              className="rounded-lg bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50"
            >
              {savingAccount ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Guide Profile (only for GUIDE role) */}
      {user.role === "GUIDE" && guideProfile && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Guide Profile</CardTitle>
              <Badge className={STATUS_BADGE[guideProfile.verificationStatus] ?? ""}>
                {guideProfile.verificationStatus}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="License Number" locked hint="Contact support to update your license number.">
              <Input value={guideProfile.licenseNumber} disabled />
            </Field>
            <Field label="Bio">
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                placeholder="Describe your experience and style as a guide…"
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Experience (years)">
                <Input
                  type="number"
                  min={0}
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(e.target.value)}
                />
              </Field>
              <Field
                label="Daily Rate"
                hint="Changing this will re-trigger admin review."
              >
                <div className="flex gap-2">
                  <Input
                    type="number"
                    min={0}
                    value={dailyRate}
                    onChange={(e) => setDailyRate(e.target.value)}
                    className="flex-1"
                  />
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {["USD", "NPR", "EUR", "GBP"].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </Field>
            </div>
            <Field label="Languages" hint="Comma-separated, e.g. English, Nepali, Hindi">
              <Input
                value={languages}
                onChange={(e) => setLanguages(e.target.value)}
                placeholder="English, Nepali"
              />
            </Field>
            <Field label="Specializations" hint="Comma-separated, e.g. High Altitude, Rock Climbing">
              <Input
                value={specializations}
                onChange={(e) => setSpecializations(e.target.value)}
                placeholder="High Altitude, Rock Climbing"
              />
            </Field>
            <Field label="Cover Photo URL">
              <Input
                value={coverPhotoUrl}
                onChange={(e) => setCoverPhotoUrl(e.target.value)}
                placeholder="https://..."
              />
            </Field>
            <div className="flex justify-end pt-1">
              <button
                onClick={saveGuide}
                disabled={savingGuide}
                className="rounded-lg bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50"
              >
                {savingGuide ? "Saving…" : "Save Guide Profile"}
              </button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
