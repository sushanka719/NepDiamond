import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";
import { NextRequest } from "next/server";

/** GET /api/admin/payout-requests — list all payout requests */
export async function GET(request: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") ?? undefined;

  const requests = await prisma.payoutRequest.findMany({
    where: status ? { status: status as "PENDING" | "PROCESSING" | "PAID" | "REJECTED" } : undefined,
    orderBy: { createdAt: "desc" },
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

  return Response.json({ requests });
}
