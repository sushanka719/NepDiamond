import { createSupabaseServerClient } from "@/lib/supabase-server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import TravellerHiresPanel from "./traveller-hires-panel";

export default async function TravellerHiresPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  });
  if (!dbUser || dbUser.role !== "TRAVELLER") redirect("/dashboard/guide");

  const hires = await prisma.guideHire.findMany({
    where: { requesterId: user.id, deletedAt: null },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      status: true,
      startDate: true,
      endDate: true,
      daysCount: true,
      dailyRate: true,
      totalAmount: true,
      currency: true,
      requirements: true,
      rejectionReason: true,
      acceptedAt: true,
      cancelledAt: true,
      createdAt: true,
      guide: {
        select: {
          id: true,
          user: { select: { fullName: true, avatarUrl: true } },
        },
      },
      review: { select: { id: true, rating: true, comment: true } },
      payment: { select: { id: true, status: true } },
    },
  });

  const serialized = hires.map((h) => ({
    ...h,
    dailyRate: Number(h.dailyRate),
    totalAmount: Number(h.totalAmount),
    startDate: h.startDate.toISOString(),
    endDate: h.endDate.toISOString(),
    acceptedAt: h.acceptedAt?.toISOString() ?? null,
    cancelledAt: h.cancelledAt?.toISOString() ?? null,
    createdAt: h.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Hires</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Track all your guide hire requests.
        </p>
      </div>
      <TravellerHiresPanel initialHires={serialized} />
    </div>
  );
}
