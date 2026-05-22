import { createSupabaseServerClient } from "@/lib/supabase-server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import EarningsPanel from "./earnings-panel";

export default async function GuideEarningsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true, guideProfile: { select: { id: true, currency: true } } },
  });
  if (!dbUser || dbUser.role !== "GUIDE") redirect("/dashboard/traveller");
  if (!dbUser.guideProfile) redirect("/dashboard/guide");

  const guideId = dbUser.guideProfile.id;
  const currency = dbUser.guideProfile.currency;
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

  const [totals, thisMonth, thisYear, pending, recentCompleted, monthlyHires, ratings] =
    await Promise.all([
      prisma.guideHire.aggregate({
        where: { guideId, status: "COMPLETED", deletedAt: null },
        _sum: { totalAmount: true },
        _count: { id: true },
        _avg: { totalAmount: true },
      }),
      prisma.guideHire.aggregate({
        where: { guideId, status: "COMPLETED", deletedAt: null, completedAt: { gte: startOfMonth } },
        _sum: { totalAmount: true },
      }),
      prisma.guideHire.aggregate({
        where: { guideId, status: "COMPLETED", deletedAt: null, completedAt: { gte: startOfYear } },
        _sum: { totalAmount: true },
      }),
      prisma.guideHire.aggregate({
        where: { guideId, status: "ACCEPTED", deletedAt: null },
        _sum: { totalAmount: true },
        _count: { id: true },
      }),
      prisma.guideHire.findMany({
        where: { guideId, status: "COMPLETED", deletedAt: null },
        orderBy: { completedAt: "desc" },
        take: 5,
        select: {
          id: true,
          totalAmount: true,
          currency: true,
          daysCount: true,
          dailyRate: true,
          startDate: true,
          endDate: true,
          completedAt: true,
          requester: { select: { fullName: true, avatarUrl: true } },
        },
      }),
      prisma.guideHire.findMany({
        where: { guideId, status: "COMPLETED", deletedAt: null, completedAt: { gte: twelveMonthsAgo } },
        select: { totalAmount: true, completedAt: true },
      }),
      prisma.review.findMany({
        where: { guideId, deletedAt: null },
        select: { rating: true },
      }),
    ]);

  // Monthly breakdown
  const monthMap: Record<string, { month: string; earnings: number; hires: number }> = {};
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthMap[key] = {
      month: d.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
      earnings: 0,
      hires: 0,
    };
  }
  for (const h of monthlyHires) {
    if (!h.completedAt) continue;
    const key = `${h.completedAt.getFullYear()}-${String(h.completedAt.getMonth() + 1).padStart(2, "0")}`;
    if (monthMap[key]) {
      monthMap[key].earnings += Number(h.totalAmount);
      monthMap[key].hires += 1;
    }
  }

  const avgRating =
    ratings.length > 0
      ? Math.round((ratings.reduce((s, r) => s + r.rating, 0) / ratings.length) * 10) / 10
      : null;

  const data = {
    currency,
    stats: {
      lifetimeEarnings: Number(totals._sum.totalAmount ?? 0),
      completedHires: totals._count.id,
      avgPerHire: Number(totals._avg.totalAmount ?? 0),
      thisMonthEarnings: Number(thisMonth._sum.totalAmount ?? 0),
      thisYearEarnings: Number(thisYear._sum.totalAmount ?? 0),
      pendingEarnings: Number(pending._sum.totalAmount ?? 0),
      pendingHires: pending._count.id,
      avgRating,
      reviewCount: ratings.length,
    },
    monthlyBreakdown: Object.values(monthMap),
    recentCompleted: recentCompleted.map((h) => ({
      ...h,
      totalAmount: Number(h.totalAmount),
      dailyRate: Number(h.dailyRate),
      startDate: h.startDate.toISOString(),
      endDate: h.endDate.toISOString(),
      completedAt: h.completedAt?.toISOString() ?? null,
    })),
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Earnings</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Your income from completed hire requests.
        </p>
      </div>
      <EarningsPanel data={data} />
    </div>
  );
}
