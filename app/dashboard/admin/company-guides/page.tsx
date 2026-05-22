import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import CompanyGuidesManager from "./company-guides-manager";

export default async function CompanyGuidesPage() {
  const guard = await requireAdmin();
  if (!guard.ok) redirect("/auth/login");

  const guides = await prisma.companyGuide.findMany({
    where: { deletedAt: null },
    orderBy: { fullName: "asc" },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      licenseNumber: true,
      experienceYears: true,
      languages: true,
      specializations: true,
      isActive: true,
      createdAt: true,
      _count: { select: { assignments: true } },
    },
  });

  const serialized = guides.map((g) => ({
    ...g,
    createdAt: g.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Company Guides</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Manage guides employed by the company and assign them to trek departures.
        </p>
      </div>
      <CompanyGuidesManager initialGuides={serialized} />
    </div>
  );
}
