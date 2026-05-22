"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Mountain,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  UserCog,
} from "lucide-react";

type Role = "TRAVELLER" | "GUIDE" | "ADMIN";

const DASHBOARD_HREF: Record<Role, string> = {
  TRAVELLER: "/dashboard/traveller",
  GUIDE: "/dashboard/guide",
  ADMIN: "/dashboard/admin",
};

const DASHBOARD_LABEL: Record<Role, string> = {
  TRAVELLER: "Traveller Dashboard",
  GUIDE: "Guide Dashboard",
  ADMIN: "Admin Dashboard",
};

interface NavbarProps {
  user: {
    fullName: string;
    avatarUrl?: string | null;
    role: Role;
  };
}

export default function Navbar({ user }: NavbarProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (res.ok) {
        router.push("/");
        router.refresh();
      } else {
        toast.error("Logout failed. Please try again.");
        setLoggingOut(false);
      }
    } catch {
      toast.error("Something went wrong.");
      setLoggingOut(false);
    }
  }

  const initials = (user.fullName ?? "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const firstName = user.fullName?.split(" ")[0] ?? "User";

  return (
    <header className="sticky top-0 z-50 border-b bg-white/95 dark:bg-slate-900/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 dark:supports-[backdrop-filter]:bg-slate-900/80 shadow-sm">
      <div className="px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between">
          {/* Left: Logo + name */}
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 group-hover:bg-emerald-100 transition-colors">
              <Mountain className="h-5 w-5 text-emerald-600" />
            </div>
            <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-white">
              NepDiamond
            </span>
          </Link>

          {/* Right: Profile dropdown */}
          <div className="relative" ref={ref}>
            <button
              onClick={() => setOpen((v) => !v)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {user.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.avatarUrl}
                  alt={user.fullName}
                  className="h-8 w-8 rounded-full object-cover ring-2 ring-emerald-300 dark:ring-emerald-700 ring-offset-1"
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {initials}
                </div>
              )}
              <span className="hidden sm:block text-sm font-medium text-slate-700 dark:text-slate-300">
                {firstName}
              </span>
              <ChevronDown
                className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
              />
            </button>

            {open && (
              <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl ring-1 ring-black/5 dark:ring-white/5 z-50 overflow-hidden">
                {/* User info header */}
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
                  {user.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.avatarUrl}
                      alt={user.fullName}
                      className="h-9 w-9 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div className="h-9 w-9 rounded-full bg-emerald-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                      {initials}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {user.fullName}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 capitalize">
                      {user.role.charAt(0) + user.role.slice(1).toLowerCase()}
                    </p>
                  </div>
                </div>

                {/* Dashboard link */}
                <Link
                  href={DASHBOARD_HREF[user.role]}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors"
                >
                  <LayoutDashboard className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  {DASHBOARD_LABEL[user.role]}
                </Link>

                {/* Edit Profile */}
                <Link
                  href="/dashboard/profile"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors"
                >
                  <UserCog className="h-4 w-4 text-slate-400 shrink-0" />
                  Edit Profile
                </Link>

                <div className="border-t border-slate-100 dark:border-slate-800" />

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors disabled:opacity-50"
                >
                  <LogOut className="h-4 w-4 shrink-0" />
                  {loggingOut ? "Signing out…" : "Sign out"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
