import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import RegionsManager from "./regions-manager";

export default async function AdminRegionsPage() {
  const guard = await requireAdmin();
  if (!guard.ok) redirect("/auth/login");

  const regions = await prisma.region.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      imageUrl: true,
      isActive: true,
      createdAt: true,
      _count: { select: { treks: true } },
    },
  });

  const serialized = regions.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Regions</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Manage trekking regions. Regions group treks by geographic area.
        </p>
      </div>
      <RegionsManager initialRegions={serialized} />
    </div>
  );
}
