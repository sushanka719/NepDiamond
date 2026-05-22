import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import DeparturesDashboard from "./departures-dashboard";

export default async function AdminDeparturesPage() {
  const guard = await requireAdmin();
  if (!guard.ok) redirect("/auth/login");

  const departures = await prisma.trekDeparture.findMany({
    where: { deletedAt: null },
    orderBy: { departureDate: "asc" },
    select: {
      id: true,
      departureDate: true,
      returnDate: true,
      pricePerPerson: true,
      maxParticipants: true,
      currency: true,
      status: true,
      notes: true,
      createdAt: true,
      trek: {
        select: { id: true, title: true, slug: true, difficulty: true, coverImageUrl: true },
      },
      _count: { select: { bookings: true, guides: true } },
    },
  });

  const serialized = departures.map((d) => ({
    ...d,
    pricePerPerson: Number(d.pricePerPerson),
    departureDate: d.departureDate.toISOString(),
    returnDate: d.returnDate?.toISOString() ?? null,
    createdAt: d.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Departures</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Monitor all scheduled trek departures. FULL departures are ready for guide assignment.
        </p>
      </div>
      <DeparturesDashboard initialDepartures={serialized} />
    </div>
  );
}
