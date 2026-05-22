import { createSupabaseServerClient } from "@/lib/supabase-server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Users, FileText, Star, ArrowRight } from "lucide-react";

export default async function TravellerDashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { fullName: true, role: true },
  });

  if (!dbUser) redirect("/auth/login");
  if (dbUser.role !== "TRAVELLER") redirect("/dashboard/guide");

  const firstName = dbUser.fullName.split(" ")[0];

  const quickLinks = [
    {
      href: "/guides",
      icon: Users,
      label: "Browse Guides",
      description: "Find and hire verified local guides for your next trek",
      color: "text-emerald-600",
      bg: "bg-emerald-50 dark:bg-emerald-950/30",
    },
    {
      href: "/dashboard/traveller/hires",
      icon: FileText,
      label: "My Hire Requests",
      description: "View and manage your guide hire requests",
      color: "text-sky-600",
      bg: "bg-sky-50 dark:bg-sky-950/30",
    },
    {
      href: "/dashboard/traveller/reviews",
      icon: Star,
      label: "My Reviews",
      description: "Reviews you've left for guides after your treks",
      color: "text-amber-600",
      bg: "bg-amber-50 dark:bg-amber-950/30",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Welcome back, {firstName}!
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          What would you like to do today?
        </p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        {quickLinks.map(({ href, icon: Icon, label, description, color, bg }) => (
          <Link
            key={href}
            href={href}
            className="group bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col gap-4 hover:shadow-md hover:border-emerald-200 dark:hover:border-emerald-800 transition-all"
          >
            <div className={`inline-flex h-11 w-11 items-center justify-center rounded-lg ${bg}`}>
              <Icon className={`h-5 w-5 ${color}`} />
            </div>
            <div className="space-y-1 flex-1">
              <h3 className="font-semibold text-slate-900 dark:text-white">{label}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{description}</p>
            </div>
            <div className="flex items-center gap-1 text-sm font-medium text-emerald-600 dark:text-emerald-400 group-hover:gap-2 transition-all">
              Go <ArrowRight className="h-4 w-4" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
