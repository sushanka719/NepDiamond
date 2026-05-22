import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import TreksManager from "./treks-manager";

export default async function AdminTreksPage() {
  const guard = await requireAdmin();
  if (!guard.ok) redirect("/auth/login");

  const [treks, regions] = await Promise.all([
    prisma.trek.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        slug: true,
        difficulty: true,
        status: true,
        durationDays: true,
        pricePerPerson: true,
        maxParticipants: true,
        coverImageUrl: true,
        createdAt: true,
        region: { select: { id: true, name: true } },
        _count: { select: { itinerary: true, media: true } },
      },
    }),
    prisma.region.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const serialized = treks.map((t) => ({
    ...t,
    pricePerPerson: Number(t.pricePerPerson),
    createdAt: t.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Treks</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Create and manage trekking routes. Set status to Published to make them visible.
        </p>
      </div>
      <TreksManager initialTreks={serialized} regions={regions} />
    </div>
  );
}
