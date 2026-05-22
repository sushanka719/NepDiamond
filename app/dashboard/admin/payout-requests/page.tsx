import { createSupabaseServerClient } from "@/lib/supabase-server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import PayoutRequestsManager from "./payout-requests-manager";

export default async function AdminPayoutRequestsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  });
  if (!dbUser || dbUser.role !== "ADMIN") redirect("/dashboard/traveller");

  const requests = await prisma.payoutRequest.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      status: true,
      guideNote: true,
      adminNote: true,
      processedAt: true,
      createdAt: true,
      guide: {
        select: {
          id: true,
          currency: true,
          user: { select: { fullName: true, email: true, avatarUrl: true } },
        },
      },
      payment: {
        select: {
          id: true,
          amount: true,
          currency: true,
          paidAt: true,
          guideHire: {
            select: {
              daysCount: true,
              startDate: true,
              endDate: true,
              requester: { select: { fullName: true } },
            },
          },
        },
      },
    },
  });

  const serialized = requests.map((r) => ({
    ...r,
    processedAt: r.processedAt?.toISOString() ?? null,
    createdAt: r.createdAt.toISOString(),
    payment: {
      ...r.payment,
      amount: Number(r.payment.amount),
      paidAt: r.payment.paidAt?.toISOString() ?? null,
      guideHire: {
        ...r.payment.guideHire,
        startDate: r.payment.guideHire.startDate.toISOString(),
        endDate: r.payment.guideHire.endDate.toISOString(),
      },
    },
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Payout Requests</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Guide payout requests awaiting processing.
        </p>
      </div>
      <PayoutRequestsManager initialRequests={serialized} />
    </div>
  );
}
