import { createSupabaseServerClient } from "@/lib/supabase-server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, CheckCircle, XCircle, TrendingUp, CalendarDays, Star, ClipboardList } from "lucide-react";

const STATUS_CONFIG = {
  PENDING: {
    label: "Pending review",
    icon: Clock,
    className:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  },
  APPROVED: {
    label: "Verified",
    icon: CheckCircle,
    className:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
  REJECTED: {
    label: "Rejected",
    icon: XCircle,
    className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  },
};

export default async function GuideDashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      fullName: true,
      email: true,
      avatarUrl: true,
      role: true,
      guideProfile: {
        select: {
          id: true,
          verificationStatus: true,
          bio: true,
          experienceYears: true,
          dailyRate: true,
          currency: true,
          languages: true,
          specializations: true,
          rejectionReason: true,
        },
      },
    },
  });

  if (!dbUser || dbUser.role !== "GUIDE") redirect("/auth/select-role");

  const profile = dbUser.guideProfile;
  const guideId = profile?.id;

  const [pendingCount, acceptedCount, completedAgg, upcomingHire, ratings] = guideId
    ? await Promise.all([
        prisma.guideHire.count({ where: { guideId, status: "PENDING", deletedAt: null } }),
        prisma.guideHire.count({ where: { guideId, status: "ACCEPTED", deletedAt: null } }),
        prisma.guideHire.aggregate({
          where: { guideId, status: "COMPLETED", deletedAt: null },
          _sum: { totalAmount: true },
          _count: { id: true },
        }),
        prisma.guideHire.findFirst({
          where: { guideId, status: "ACCEPTED", startDate: { gte: new Date() }, deletedAt: null },
          orderBy: { startDate: "asc" },
          select: { startDate: true, daysCount: true, requester: { select: { fullName: true } } },
        }),
        prisma.review.findMany({ where: { guideId, deletedAt: null }, select: { rating: true } }),
      ])
    : [0, 0, { _sum: { totalAmount: null }, _count: { id: 0 } }, null, []];
  const status = (profile?.verificationStatus ?? "PENDING") as keyof typeof STATUS_CONFIG;
  const statusConf = STATUS_CONFIG[status];
  const StatusIcon = statusConf.icon;

  const lifetimeEarnings = Number((completedAgg as { _sum: { totalAmount: unknown } })._sum.totalAmount ?? 0);
  const completedCount = (completedAgg as { _count: { id: number } })._count.id;
  const avgRating = (ratings as { rating: number }[]).length > 0
    ? Math.round(((ratings as { rating: number }[]).reduce((s, r) => s + r.rating, 0) / (ratings as { rating: number }[]).length) * 10) / 10
    : null;
  const currency = profile?.currency ?? "USD";

  return (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Guide Dashboard</h1>
            <p className="text-muted-foreground text-sm mt-1">{dbUser.email}</p>
          </div>
          <Badge className={statusConf.className}>
            <StatusIcon className="h-3.5 w-3.5 mr-1" />
            {statusConf.label}
          </Badge>
        </div>

        {status === "PENDING" && (
          <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-900">
            <CardContent className="py-4">
              <p className="text-sm text-yellow-800 dark:text-yellow-400">
                Your profile is under review. An admin will verify your details
                shortly. You&apos;ll be visible to travellers once approved.
              </p>
            </CardContent>
          </Card>
        )}

        {status === "REJECTED" && profile?.rejectionReason && (
          <Card className="border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900">
            <CardContent className="py-4">
              <p className="text-sm font-medium text-red-800 dark:text-red-400 mb-1">
                Your profile was rejected
              </p>
              <p className="text-sm text-red-700 dark:text-red-300">
                {profile.rejectionReason}
              </p>
              <a
                href="/auth/guide-profile"
                className="text-sm underline mt-2 inline-block text-red-800 dark:text-red-400"
              >
                Resubmit profile →
              </a>
            </CardContent>
          </Card>
        )}

        {profile && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Daily Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {Number(profile.dailyRate).toFixed(0)}{" "}
                  <span className="text-base font-normal text-muted-foreground">
                    {profile.currency}
                  </span>
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Experience
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {profile.experienceYears}{" "}
                  <span className="text-base font-normal text-muted-foreground">
                    years
                  </span>
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Languages
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1">
                  {profile.languages.length > 0 ? (
                    profile.languages.map((l: string) => (
                      <Badge key={l} variant="secondary" className="text-xs">
                        {l}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-muted-foreground text-sm">
                      None listed
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {!profile && (
          <Card>
            <CardContent className="py-8 text-center space-y-3">
              <p className="text-muted-foreground">
                You haven&apos;t set up your guide profile yet.
              </p>
              <a
                href="/auth/guide-profile"
                className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
              >
                Set up profile
              </a>
            </CardContent>
          </Card>
        )}

        {profile && (
          <>
            {/* Activity stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                {
                  href: "/dashboard/guide/hires",
                  icon: ClipboardList,
                  label: "Pending Requests",
                  value: pendingCount as number,
                  sub: "awaiting response",
                  accent: (pendingCount as number) > 0 ? "text-amber-600" : "text-slate-700 dark:text-slate-300",
                  bg: "bg-amber-50 dark:bg-amber-950/30",
                  iconColor: "text-amber-600",
                },
                {
                  href: "/dashboard/guide/schedule",
                  icon: CalendarDays,
                  label: "Active Hires",
                  value: acceptedCount as number,
                  sub: "accepted & ongoing",
                  accent: "text-slate-700 dark:text-slate-300",
                  bg: "bg-blue-50 dark:bg-blue-950/30",
                  iconColor: "text-blue-600",
                },
                {
                  href: "/dashboard/guide/earnings",
                  icon: TrendingUp,
                  label: "Lifetime Earned",
                  value: `${lifetimeEarnings.toLocaleString()} ${currency}`,
                  sub: `${completedCount} completed`,
                  accent: "text-emerald-600 dark:text-emerald-400",
                  bg: "bg-emerald-50 dark:bg-emerald-950/30",
                  iconColor: "text-emerald-600",
                },
                {
                  href: "/dashboard/guide/earnings",
                  icon: Star,
                  label: "Rating",
                  value: avgRating !== null ? `${avgRating} / 5` : "—",
                  sub: avgRating !== null ? `${(ratings as unknown[]).length} review${(ratings as unknown[]).length !== 1 ? "s" : ""}` : "No reviews yet",
                  accent: "text-slate-700 dark:text-slate-300",
                  bg: "bg-amber-50 dark:bg-amber-950/30",
                  iconColor: "text-amber-500",
                },
              ].map(({ href, icon: Icon, label, value, sub, accent, bg, iconColor }) => (
                <Link
                  key={label}
                  href={href}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 hover:border-emerald-200 dark:hover:border-emerald-800 transition-colors"
                >
                  <div className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${bg} mb-2`}>
                    <Icon className={`h-4 w-4 ${iconColor}`} />
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
                  <p className={`text-xl font-bold mt-0.5 ${accent}`}>{value}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
                </Link>
              ))}
            </div>

            {/* Upcoming hire preview */}
            {upcomingHire && (
              <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/20 p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <CalendarDays className="h-5 w-5 text-emerald-600 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                      Next hire: {(upcomingHire as { requester: { fullName: string } }).requester.fullName}
                    </p>
                    <p className="text-xs text-emerald-700 dark:text-emerald-400">
                      {new Date((upcomingHire as { startDate: Date }).startDate).toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "long" })}
                      {" · "}
                      {(upcomingHire as { daysCount: number }).daysCount} day{(upcomingHire as { daysCount: number }).daysCount !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <Link
                  href="/dashboard/guide/schedule"
                  className="text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:underline shrink-0"
                >
                  View schedule →
                </Link>
              </div>
            )}
          </>
        )}
    </div>
  );
}
