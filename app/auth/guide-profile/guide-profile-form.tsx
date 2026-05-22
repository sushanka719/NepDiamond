"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

export default function GuideProfileForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [bio, setBio] = useState("");
  const [experienceYears, setExperienceYears] = useState("");
  const [dailyRate, setDailyRate] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [licenseNumber, setLicenseNumber] = useState("");

  // Tag inputs
  const [langInput, setLangInput] = useState("");
  const [languages, setLanguages] = useState<string[]>([]);
  const [specInput, setSpecInput] = useState("");
  const [specializations, setSpecializations] = useState<string[]>([]);

  function addTag(
    input: string,
    list: string[],
    setList: (v: string[]) => void,
    setInput: (v: string) => void
  ) {
    const val = input.trim();
    if (val && !list.includes(val)) setList([...list, val]);
    setInput("");
  }

  function removeTag(val: string, list: string[], setList: (v: string[]) => void) {
    setList(list.filter((t) => t !== val));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!dailyRate || Number(dailyRate) <= 0) {
      toast.error("Daily rate must be a positive number");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/guide/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bio: bio || undefined,
          experienceYears: experienceYears ? Number(experienceYears) : 0,
          languages,
          dailyRate: Number(dailyRate),
          currency,
          specializations,
          licenseNumber: licenseNumber || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "Failed to submit profile");
        return;
      }

      toast.success("Profile submitted! Awaiting admin verification.");
      router.push("/dashboard/guide");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Bio */}
      <div className="space-y-1.5">
        <Label htmlFor="bio">Bio</Label>
        <textarea
          id="bio"
          rows={3}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Tell travellers about your experience and passion for Nepal…"
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
        />
      </div>

      {/* Experience + Daily Rate */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="experienceYears">Years of experience</Label>
          <Input
            id="experienceYears"
            type="number"
            min={0}
            max={60}
            value={experienceYears}
            onChange={(e) => setExperienceYears(e.target.value)}
            placeholder="0"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="dailyRate">
            Daily rate <span className="text-destructive">*</span>
          </Label>
          <div className="flex gap-2">
            <Input
              id="dailyRate"
              type="number"
              min={1}
              step="0.01"
              required
              value={dailyRate}
              onChange={(e) => setDailyRate(e.target.value)}
              placeholder="50"
              className="flex-1"
            />
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="USD">USD</option>
              <option value="NPR">NPR</option>
              <option value="EUR">EUR</option>
            </select>
          </div>
        </div>
      </div>

      {/* License */}
      <div className="space-y-1.5">
        <Label htmlFor="licenseNumber">Guide license number (optional)</Label>
        <Input
          id="licenseNumber"
          value={licenseNumber}
          onChange={(e) => setLicenseNumber(e.target.value)}
          placeholder="NTB-2024-XXXXX"
        />
      </div>

      {/* Languages */}
      <div className="space-y-1.5">
        <Label>Languages spoken</Label>
        <div className="flex gap-2">
          <Input
            value={langInput}
            onChange={(e) => setLangInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === ",") {
                e.preventDefault();
                addTag(langInput, languages, setLanguages, setLangInput);
              }
            }}
            placeholder="English, Nepali… (press Enter to add)"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => addTag(langInput, languages, setLanguages, setLangInput)}
          >
            Add
          </Button>
        </div>
        {languages.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {languages.map((l) => (
              <Badge key={l} variant="secondary" className="gap-1">
                {l}
                <button
                  type="button"
                  onClick={() => removeTag(l, languages, setLanguages)}
                  className="rounded-full"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Specializations */}
      <div className="space-y-1.5">
        <Label>Specializations</Label>
        <div className="flex gap-2">
          <Input
            value={specInput}
            onChange={(e) => setSpecInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === ",") {
                e.preventDefault();
                addTag(specInput, specializations, setSpecializations, setSpecInput);
              }
            }}
            placeholder="High altitude, Rock climbing… (press Enter)"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => addTag(specInput, specializations, setSpecializations, setSpecInput)}
          >
            Add
          </Button>
        </div>
        {specializations.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {specializations.map((s) => (
              <Badge key={s} variant="secondary" className="gap-1">
                {s}
                <button
                  type="button"
                  onClick={() => removeTag(s, specializations, setSpecializations)}
                  className="rounded-full"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-11"
      >
        {loading ? "Submitting…" : "Submit for verification"}
      </Button>
    </form>
  );
}
