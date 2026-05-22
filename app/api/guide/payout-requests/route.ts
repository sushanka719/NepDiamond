import { createSupabaseServerClient } from "@/lib/supabase-server";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

/**
 * POST /api/guide/payout-requests
 * Guide requests a payout for a completed, paid hire.
 * Body: { paymentId, guideNote? }
 */
export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const guide = await prisma.guideProfile.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });
  if (!guide) return Response.json({ error: "Guide profile not found" }, { status: 404 });

  let body: { paymentId?: string; guideNote?: string };
  try { body = await request.json(); } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!body.paymentId) return Response.json({ error: "paymentId is required" }, { status: 400 });

  // Verify the payment belongs to a hire this guide was on
  const payment = await prisma.payment.findUnique({
    where: { id: body.paymentId },
    select: {
      id: true,
      status: true,
      guideHire: { select: { guideId: true, status: true } },
      payoutRequest: { select: { id: true } },
    },
  });

  if (!payment) return Response.json({ error: "Payment not found" }, { status: 404 });
  if (payment.guideHire.guideId !== guide.id) return Response.json({ error: "Forbidden" }, { status: 403 });
  if (payment.status !== "PAID") return Response.json({ error: "Payment has not been received yet" }, { status: 409 });
  if (payment.guideHire.status !== "COMPLETED") return Response.json({ error: "Hire is not completed yet" }, { status: 409 });
  if (payment.payoutRequest) return Response.json({ error: "Payout already requested" }, { status: 409 });

  const req = await prisma.payoutRequest.create({
    data: {
      guideId: guide.id,
      paymentId: body.paymentId,
      guideNote: body.guideNote?.trim() || null,
    },
    select: { id: true, status: true, createdAt: true },
  });

  return Response.json({ payoutRequest: req }, { status: 201 });
}

/** GET /api/guide/payout-requests — guide's own payout requests */
export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const guide = await prisma.guideProfile.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });
  if (!guide) return Response.json({ error: "Guide profile not found" }, { status: 404 });

  const requests = await prisma.payoutRequest.findMany({
    where: { guideId: guide.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      status: true,
      guideNote: true,
      adminNote: true,
      processedAt: true,
      createdAt: true,
      payment: {
        select: {
          id: true,
          amount: true,
          currency: true,
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
