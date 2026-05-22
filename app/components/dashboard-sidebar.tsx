"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShieldCheck,
  Users,
  ChevronDown,
  ClipboardList,
  CalendarDays,
  TrendingUp,
  Compass,
  MapPin,
  Sparkles,
  HardHat,
  Backpack,
  UserCog,
} from "lucide-react";

type Role = "TRAVELLER" | "GUIDE" | "ADMIN";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavGroup {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  children: NavItem[];
}

type SidebarEntry = NavItem | NavGroup;

function isGroup(entry: SidebarEntry): entry is NavGroup {
  return "children" in entry;
}

const ADMIN_MENU: SidebarEntry[] = [
  { label: "Overview", href: "/dashboard/admin", icon: LayoutDashboard },
  { label: "Edit Profile", href: "/dashboard/profile", icon: UserCog },
  {
    label: "Guides",
    icon: Users,
    children: [
      { label: "Verifications", href: "/dashboard/admin", icon: ShieldCheck },
      { label: "All Guides", href: "/dashboard/admin/guides", icon: Users },
    ],
  },
  {
    label: "Content",
    icon: Compass,
    children: [
      { label: "Regions", href: "/dashboard/admin/regions", icon: MapPin },
      { label: "Treks", href: "/dashboard/admin/treks", icon: Compass },
      { label: "Departures", href: "/dashboard/admin/departures", icon: CalendarDays },
      { label: "Company Guides", href: "/dashboard/admin/company-guides", icon: HardHat },
      { label: "Payout Requests", href: "/dashboard/admin/payout-requests", icon: UserCog },
    ],
  },
];

const GUIDE_MENU: SidebarEntry[] = [
  { label: "Overview", href: "/dashboard/guide", icon: LayoutDashboard },
  { label: "Edit Profile", href: "/dashboard/profile", icon: UserCog },
  { label: "Hire Requests", href: "/dashboard/guide/hires", icon: ClipboardList },
  { label: "Schedule", href: "/dashboard/guide/schedule", icon: CalendarDays },
  { label: "Earnings", href: "/dashboard/guide/earnings", icon: TrendingUp },
];

const TRAVELLER_MENU: SidebarEntry[] = [
  { label: "Overview", href: "/dashboard/traveller", icon: LayoutDashboard },
  { label: "Edit Profile", href: "/dashboard/profile", icon: UserCog },
  { label: "AI Trek Planner", href: "/dashboard/traveller/planner", icon: Sparkles },
  { label: "Find Guides", href: "/guides", icon: Users },
  { label: "My Hires", href: "/dashboard/traveller/hires", icon: ClipboardList },
  { label: "My Bookings", href: "/dashboard/traveller/bookings", icon: Backpack },
];

const MENUS: Record<Role, SidebarEntry[]> = {
  ADMIN: ADMIN_MENU,
  GUIDE: GUIDE_MENU,
  TRAVELLER: TRAVELLER_MENU,
};

function NavLink({ item, onClick }: { item: NavItem; onClick?: () => void }) {
  const pathname = usePathname();
  const isActive = pathname === item.href;
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
        isActive
          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
          : "text-slate-600 hover:text-emerald-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-emerald-400 dark:hover:bg-slate-800/60"
      }`}
    >
      <Icon
        className={`h-4 w-4 shrink-0 ${isActive ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400 dark:text-slate-500"}`}
      />
      {item.label}
    </Link>
  );
}

function NavGroupItem({ group }: { group: NavGroup }) {
  const pathname = usePathname();
  const hasActive = group.children.some((c) => pathname === c.href);
  const [expanded, setExpanded] = useState(hasActive);
  const Icon = group.icon;

  return (
    <div>
      <button
        onClick={() => setExpanded((v) => !v)}
        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
          hasActive
            ? "text-emerald-700 dark:text-emerald-400"
            : "text-slate-600 hover:text-emerald-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-emerald-400 dark:hover:bg-slate-800/60"
        }`}
      >
        <Icon
          className={`h-4 w-4 shrink-0 ${hasActive ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400 dark:text-slate-500"}`}
        />
        <span className="flex-1 text-left">{group.label}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
        />
      </button>

      {expanded && (
        <div className="mt-0.5 ml-3 pl-3 border-l border-slate-200 dark:border-slate-700 space-y-0.5">
          {group.children.map((child) => (
            <NavLink key={child.href + child.label} item={child} />
          ))}
        </div>
      )}
    </div>
  );
}

interface DashboardSidebarProps {
  role: Role;
}

export default function DashboardSidebar({ role }: DashboardSidebarProps) {
  const menu = MENUS[role];

  return (
    <aside className="sticky top-16 h-[calc(100vh-4rem)] w-60 shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-y-auto">
      <nav className="p-3 space-y-0.5">
        <p className="px-3 pb-1.5 pt-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
          {role === "ADMIN" ? "Admin" : role === "GUIDE" ? "Guide" : "Traveller"} Menu
        </p>
        {menu.map((entry) =>
          isGroup(entry) ? (
            <NavGroupItem key={entry.label} group={entry} />
          ) : (
            <NavLink key={entry.href + entry.label} item={entry} />
          )
        )}
      </nav>
    </aside>
  );
}
