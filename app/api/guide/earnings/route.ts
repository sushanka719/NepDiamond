import { createSupabaseServerClient } from "@/lib/supabase-server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/guide/earnings
 *
 * Guide-only. Returns aggregated earnings stats, monthly breakdown for
 * the last 12 months, and the 5 most recent completed hires.
 */
export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true, guideProfile: { select: { id: true } } },
  });

  if (!dbUser || dbUser.role !== "GUIDE") {
    return Response.json({ error: "Forbidden: guide role required" }, { status: 403 });
  }
  if (!dbUser.guideProfile) {
    return Response.json({ error: "Guide profile not found" }, { status: 404 });
  }

  const guideId = dbUser.guideProfile.id;
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

  const [totals, thisMonth, thisYear, pending, recentCompleted, monthlyHires, ratings] =
    await Promise.all([
      // Lifetime completed earnings
      prisma.guideHire.aggregate({
        where: { guideId, status: "COMPLETED", deletedAt: null },
        _sum: { totalAmount: true },
        _count: { id: true },
        _avg: { totalAmount: true },
      }),
      // This month earnings
      prisma.guideHire.aggregate({
        where: { guideId, status: "COMPLETED", deletedAt: null, completedAt: { gte: startOfMonth } },
        _sum: { totalAmount: true },
      }),
      // This year earnings
      prisma.guideHire.aggregate({
        where: { guideId, status: "COMPLETED", deletedAt: null, completedAt: { gte: startOfYear } },
        _sum: { totalAmount: true },
      }),
      // Pending (accepted, not yet completed)
      prisma.guideHire.aggregate({
        where: { guideId, status: "ACCEPTED", deletedAt: null },
        _sum: { totalAmount: true },
        _count: { id: true },
      }),
      // 5 most recent completed hires
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
      // All completed hires in last 12 months for monthly breakdown
      prisma.guideHire.findMany({
        where: {
          guideId,
          status: "COMPLETED",
          deletedAt: null,
          completedAt: { gte: twelveMonthsAgo },
        },
        select: { totalAmount: true, completedAt: true },
      }),
      // Ratings
      prisma.review.findMany({
        where: { guideId, deletedAt: null },
        select: { rating: true },
      }),
    ]);

  // Build monthly breakdown (last 12 months)
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

  return Response.json({
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
  });
}
