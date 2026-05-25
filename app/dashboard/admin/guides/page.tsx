import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import AdminGuidesManager from "./admin-guides-manager";

export default async function AdminGuidesPage() {
  const guard = await requireAdmin();
  if (!guard.ok) redirect("/auth/login");

  const guides = await prisma.guideProfile.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      verificationStatus: true,
      experienceYears: true,
      languages: true,
      specializations: true,
      dailyRate: true,
      currency: true,
      licenseNumber: true,
      rejectionReason: true,
      verifiedAt: true,
      createdAt: true,
      user: {
        select: { id: true, fullName: true, email: true, avatarUrl: true, isActive: true },
      },
      _count: { select: { hires: true, reviews: true } },
    },
  });

  const serialized = guides.map((g) => ({
    ...g,
    dailyRate: Number(g.dailyRate),
    verifiedAt: g.verifiedAt?.toISOString() ?? null,
    createdAt: g.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">All Guides</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Review and manage guide profiles, approve or reject verification requests.
        </p>
      </div>
      <AdminGuidesManager initialGuides={serialized} />
    </div>
  );
}
