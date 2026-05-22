"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Compass, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

type Role = "TRAVELLER" | "GUIDE";

const roles: { value: Role; label: string; description: string; icon: React.ReactNode }[] = [
  {
    value: "TRAVELLER",
    label: "Traveller",
    description: "Explore treks and hire verified local guides for your adventure.",
    icon: <Compass className="h-6 w-6" />,
  },
  {
    value: "GUIDE",
    label: "Guide",
    description: "List your services, get verified, and earn by guiding travellers.",
    icon: <MapPin className="h-6 w-6" />,
  },
];

export default function SelectRoleForm() {
  const router = useRouter();
  const [selected, setSelected] = useState<Role | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleContinue() {
    if (!selected) return;
    setLoading(true);

    try {
      const res = await fetch("/api/auth/select-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: selected }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "Failed to save role");
        return;
      }

      if (selected === "GUIDE") {
        router.push("/auth/guide-profile");
      } else {
        router.push("/dashboard/traveller");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {roles.map((role) => (
          <button
            key={role.value}
            type="button"
            onClick={() => setSelected(role.value)}
            className={cn(
              "flex flex-col gap-3 rounded-lg border-2 p-5 text-left transition-all hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/20",
              selected === role.value
                ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20"
                : "border-border bg-card"
            )}
          >
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full",
                selected === role.value
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {role.icon}
            </div>
            <div>
              <p className="font-semibold">{role.label}</p>
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                {role.description}
              </p>
            </div>
          </button>
        ))}
      </div>

      <Button
        onClick={handleContinue}
        disabled={!selected || loading}
        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-11"
      >
        {loading ? "Saving…" : "Continue"}
      </Button>
    </div>
  );
}
