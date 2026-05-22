import { createSupabaseServerClient } from "@/lib/supabase-server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import GuideHiresPanel from "./guide-hires-panel";

export default async function GuideHiresPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true, guideProfile: { select: { id: true } } },
  });
  if (!dbUser || dbUser.role !== "GUIDE") redirect("/dashboard/traveller");
  if (!dbUser.guideProfile) redirect("/dashboard/guide");

  const hires = await prisma.guideHire.findMany({
    where: { guideId: dbUser.guideProfile.id, deletedAt: null },
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
      requester: {
        select: {
          id: true,
          fullName: true,
          avatarUrl: true,
          email: true,
          phone: true,
        },
      },
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
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Hire Requests</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Manage traveller hire requests sent to you.
        </p>
      </div>
      <GuideHiresPanel initialHires={serialized} />
    </div>
  );
}
