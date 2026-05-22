import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import DepartureDetail from "./departure-detail";

type Params = { params: Promise<{ id: string }> };

export default async function AdminDepartureDetailPage({ params }: Params) {
  const guard = await requireAdmin();
  if (!guard.ok) redirect("/auth/login");

  const { id } = await params;

  const [departure, companyGuides] = await Promise.all([
    prisma.trekDeparture.findUnique({
      where: { id, deletedAt: null },
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
        updatedAt: true,
        trek: {
          select: {
            id: true,
            title: true,
            slug: true,
            difficulty: true,
            durationDays: true,
            coverImageUrl: true,
            region: { select: { id: true, name: true } },
          },
        },
        bookings: {
          where: { deletedAt: null },
          select: {
            id: true,
            status: true,
            amount: true,
            currency: true,
            confirmedAt: true,
            createdAt: true,
            user: { select: { id: true, fullName: true, email: true, avatarUrl: true, phone: true } },
          },
          orderBy: { createdAt: "asc" },
        },
        guides: {
          select: {
            id: true,
            role: true,
            assignedAt: true,
            guide: { select: { id: true, fullName: true, email: true, phone: true, licenseNumber: true } },
          },
        },
      },
    }),
    prisma.companyGuide.findMany({
      where: { isActive: true, deletedAt: null },
      orderBy: { fullName: "asc" },
      select: { id: true, fullName: true, email: true, licenseNumber: true },
    }),
  ]);

  if (!departure) notFound();

  const serialized = {
    ...departure,
    pricePerPerson: Number(departure.pricePerPerson),
    departureDate: departure.departureDate.toISOString(),
    returnDate: departure.returnDate?.toISOString() ?? null,
    createdAt: departure.createdAt.toISOString(),
    updatedAt: departure.updatedAt.toISOString(),
    bookings: departure.bookings.map((b) => ({
      ...b,
      amount: Number(b.amount),
      confirmedAt: b.confirmedAt?.toISOString() ?? null,
      createdAt: b.createdAt.toISOString(),
    })),
    guides: departure.guides.map((g) => ({
      ...g,
      assignedAt: g.assignedAt.toISOString(),
    })),
  };

  return (
    <div className="space-y-6">
      <DepartureDetail departure={serialized} companyGuides={companyGuides} />
    </div>
  );
}
