import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import DeparturesManager from "./departures-manager";

type Params = { params: Promise<{ id: string }> };

export default async function TrekDeparturesPage({ params }: Params) {
  const guard = await requireAdmin();
  if (!guard.ok) redirect("/auth/login");

  const { id } = await params;

  const trek = await prisma.trek.findUnique({
    where: { id, deletedAt: null },
    select: {
      id: true,
      title: true,
      pricePerPerson: true,
      maxParticipants: true,
      departures: {
        where: { deletedAt: null },
        orderBy: { departureDate: "desc" },
        select: {
          id: true,
          departureDate: true,
          returnDate: true,
          pricePerPerson: true,
          maxParticipants: true,
          currency: true,
          status: true,
          notes: true,
          rescheduledFromId: true,
          createdAt: true,
          _count: { select: { bookings: true, guides: true } },
        },
      },
    },
  });

  if (!trek) notFound();

  const serialized = {
    ...trek,
    pricePerPerson: Number(trek.pricePerPerson),
    departures: trek.departures.map((d) => ({
      ...d,
      pricePerPerson: Number(d.pricePerPerson),
      departureDate: d.departureDate.toISOString(),
      returnDate: d.returnDate?.toISOString() ?? null,
      createdAt: d.createdAt.toISOString(),
    })),
  };

  return (
    <div className="space-y-6">
      <DeparturesManager trek={serialized} />
    </div>
  );
}
