"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Mountain,
  Menu,
  X,
  Compass,
  Users,
  ClipboardList,
  Heart,
  LayoutDashboard,
  CalendarDays,
  TrendingUp,
  ShieldCheck,
  BarChart3,
  User,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import LogoutButton from "@/components/logout-button";

type Role = "TRAVELLER" | "GUIDE" | "ADMIN";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: Record<Role, NavItem[]> = {
  TRAVELLER: [
    { label: "Explore Treks", href: "/explore", icon: Compass },
    { label: "Find Guides", href: "/guides", icon: Users },
    { label: "My Bookings", href: "/bookings", icon: ClipboardList },
    { label: "Favorites", href: "/favorites", icon: Heart },
  ],
  GUIDE: [
    { label: "Dashboard", href: "/dashboard/guide", icon: LayoutDashboard },
    { label: "Bookings", href: "/bookings", icon: ClipboardList },
    { label: "Schedule", href: "/schedule", icon: CalendarDays },
    { label: "Earnings", href: "/earnings", icon: TrendingUp },
  ],
  ADMIN: [
    { label: "Dashboard", href: "/dashboard/admin", icon: LayoutDashboard },
    { label: "Verifications", href: "/admin/verifications", icon: ShieldCheck },
    { label: "Manage Users", href: "/admin/users", icon: Users },
    { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  ],
};

const ROLE_BADGE: Record<Role, { label: string; className: string }> = {
  TRAVELLER: {
    label: "Traveller",
    className:
      "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400 border-sky-200",
  },
  GUIDE: {
    label: "Guide",
    className:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200",
  },
  ADMIN: {
    label: "Admin",
    className:
      "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200",
  },
};

interface NavbarProps {
  user: {
    fullName: string;
    avatarUrl?: string | null;
    role: Role;
  };
}

export default function Navbar({ user }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = NAV_ITEMS[user.role];
  const badge = ROLE_BADGE[user.role];
  const firstName = user.fullName?.split(" ")[0] ?? "User";

  return (
    <header className="sticky top-0 z-50 border-b bg-white/95 dark:bg-slate-900/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 dark:supports-[backdrop-filter]:bg-slate-900/80 shadow-sm">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0 group">
            <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 group-hover:bg-emerald-100 transition-colors">
              <Mountain className="h-5 w-5 text-emerald-600" />
            </div>
            <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-white">
              NepDiamond
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 dark:text-slate-400 dark:hover:text-emerald-400 dark:hover:bg-emerald-950/30 transition-colors"
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right: user info + actions */}
          <div className="hidden md:flex items-center gap-3 shrink-0">
            <Badge className={badge.className}>{badge.label}</Badge>
            <div className="flex items-center gap-2">
              {user.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.avatarUrl}
                  alt={user.fullName}
                  className="h-8 w-8 rounded-full object-cover ring-2 ring-offset-1 ring-emerald-300 dark:ring-emerald-700"
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                  <User className="h-4 w-4 text-slate-500" />
                </div>
              )}
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {firstName}
              </span>
            </div>
            <LogoutButton />
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
            className="md:hidden p-2 rounded-md text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="md:hidden border-t bg-white dark:bg-slate-900 px-4 pb-4 shadow-lg">
          <nav className="pt-3 space-y-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 dark:text-slate-300 dark:hover:text-emerald-400 dark:hover:bg-emerald-950/30 transition-colors"
                >
                  <Icon className="h-4 w-4 text-emerald-600" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-4 pt-4 border-t flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {user.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.avatarUrl}
                  alt={user.fullName}
                  className="h-9 w-9 rounded-full object-cover shrink-0"
                />
              ) : (
                <div className="h-9 w-9 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0">
                  <User className="h-4 w-4 text-slate-500" />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                  {user.fullName}
                </p>
                <Badge className={`${badge.className} text-xs mt-0.5`}>
                  {badge.label}
                </Badge>
              </div>
            </div>
            <div className="shrink-0">
              <LogoutButton />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
