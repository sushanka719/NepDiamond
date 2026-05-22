import { createSupabaseServerClient } from "@/lib/supabase-server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import SchedulePanel from "./schedule-panel";

export default async function GuideSchedulePage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true, guideProfile: { select: { id: true } } },
  });
  if (!dbUser || dbUser.role !== "GUIDE") redirect("/dashboard/traveller");
  if (!dbUser.guideProfile) redirect("/dashboard/guide");

  const guideId = dbUser.guideProfile.id;
  const now = new Date();

  const [upcomingHires, pastHires, availability] = await Promise.all([
    prisma.guideHire.findMany({
      where: { guideId, deletedAt: null, status: "ACCEPTED", startDate: { gte: now } },
      orderBy: { startDate: "asc" },
      select: {
        id: true, status: true, startDate: true, endDate: true,
        daysCount: true, dailyRate: true, totalAmount: true, currency: true,
        requirements: true, acceptedAt: true,
        requester: { select: { id: true, fullName: true, avatarUrl: true, email: true, phone: true } },
      },
    }),
    prisma.guideHire.findMany({
      where: { guideId, deletedAt: null, status: { in: ["ACCEPTED", "COMPLETED"] }, endDate: { lt: now } },
      orderBy: { startDate: "desc" },
      take: 10,
      select: {
        id: true, status: true, startDate: true, endDate: true,
        daysCount: true, dailyRate: true, totalAmount: true, currency: true,
        completedAt: true,
        requester: { select: { id: true, fullName: true, avatarUrl: true } },
      },
    }),
    prisma.guideAvailability.findMany({
      where: { guideId, endDate: { gte: now } },
      orderBy: { startDate: "asc" },
      select: { id: true, startDate: true, endDate: true, isBlocked: true, reason: true },
    }),
  ]);

  const serialize = (h: typeof upcomingHires[number] | typeof pastHires[number]) => ({
    ...h,
    dailyRate: Number(h.dailyRate),
    totalAmount: Number(h.totalAmount),
    startDate: h.startDate.toISOString(),
    endDate: h.endDate.toISOString(),
    acceptedAt: "acceptedAt" in h ? (h.acceptedAt?.toISOString() ?? null) : null,
    completedAt: "completedAt" in h ? (h.completedAt?.toISOString() ?? null) : null,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Schedule</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Your upcoming hires and availability.
        </p>
      </div>
      <SchedulePanel
        upcomingHires={upcomingHires.map(serialize)}
        pastHires={pastHires.map(serialize)}
        availability={availability.map((a) => ({
          ...a,
          startDate: a.startDate.toISOString(),
          endDate: a.endDate.toISOString(),
        }))}
      />
    </div>
  );
}
