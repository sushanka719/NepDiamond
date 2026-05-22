import { createSupabaseServerClient } from "@/lib/supabase-server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import GuideVerificationsPanel from "@/components/guide-verifications-panel";

export default async function AdminDashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { fullName: true, email: true, role: true },
  });

  if (!dbUser || dbUser.role !== "ADMIN") redirect("/auth/login");

  const [pendingGuides, totalPending, totalApproved, totalRejected] =
    await Promise.all([
      prisma.guideProfile.findMany({
        where: { verificationStatus: "PENDING", deletedAt: null },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          bio: true,
          experienceYears: true,
          dailyRate: true,
          currency: true,
          languages: true,
          specializations: true,
          licenseNumber: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              avatarUrl: true,
            },
          },
        },
      }),
      prisma.guideProfile.count({
        where: { verificationStatus: "PENDING", deletedAt: null },
      }),
      prisma.guideProfile.count({
        where: { verificationStatus: "APPROVED", deletedAt: null },
      }),
      prisma.guideProfile.count({
        where: { verificationStatus: "REJECTED", deletedAt: null },
      }),
    ]);

  const serializedGuides = pendingGuides.map((g) => ({
    ...g,
    dailyRate: Number(g.dailyRate),
    createdAt: g.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Admin Dashboard
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {dbUser.email}
        </p>
      </div>

      <GuideVerificationsPanel
        initialGuides={serializedGuides}
        totalPending={totalPending}
        totalApproved={totalApproved}
        totalRejected={totalRejected}
      />
    </div>
  );
}
