import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, CalendarDays } from "lucide-react";
import TrekEditor from "./trek-editor";

export default async function AdminTrekDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const guard = await requireAdmin();
  if (!guard.ok) redirect("/auth/login");

  const { id } = await params;

  const [trek, regions] = await Promise.all([
    prisma.trek.findUnique({
      where: { id, deletedAt: null },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        difficulty: true,
        status: true,
        durationDays: true,
        pricePerPerson: true,
        maxParticipants: true,
        coverImageUrl: true,
        createdAt: true,
        updatedAt: true,
        region: { select: { id: true, name: true } },
        itinerary: {
          select: { id: true, dayNumber: true, title: true, description: true },
          orderBy: { dayNumber: "asc" },
        },
        media: {
          select: { id: true, url: true, mediaType: true, caption: true, sortOrder: true },
          orderBy: { sortOrder: "asc" },
        },
      },
    }),
    prisma.region.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  if (!trek) notFound();

  const serialized = {
    ...trek,
    pricePerPerson: Number(trek.pricePerPerson),
    createdAt: trek.createdAt.toISOString(),
    updatedAt: trek.updatedAt.toISOString(),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/dashboard/admin/treks"
            className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors shrink-0"
          >
            <ChevronLeft className="h-4 w-4" /> Treks
          </Link>
          <span className="text-slate-300 dark:text-slate-600">/</span>
          <h1 className="text-sm font-semibold text-slate-700 dark:text-slate-300 truncate">{trek.title}</h1>
        </div>
        <Link
          href={`/dashboard/admin/treks/${trek.id}/departures`}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shrink-0"
        >
          <CalendarDays className="h-3.5 w-3.5" /> Manage Departures
        </Link>
      </div>

      <TrekEditor trek={serialized} regions={regions} />
    </div>
  );
}
