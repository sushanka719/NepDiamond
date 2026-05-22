import { createSupabaseServerClient } from "@/lib/supabase-server";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

type Params = { params: Promise<{ id: string }> };

/**
 * GET /api/guide-hires/:id
 *
 * Accessible by the requester or the guide involved.
 */
export async function GET(_request: NextRequest, { params }: Params) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const hire = await prisma.guideHire.findUnique({
    where: { id },
    select: {
      id: true,
      requesterId: true,
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
      completedAt: true,
      cancelledAt: true,
      createdAt: true,
      updatedAt: true,
      requester: {
        select: { id: true, fullName: true, avatarUrl: true, email: true },
      },
      guide: {
        select: {
          id: true,
          userId: true,
          user: { select: { fullName: true, avatarUrl: true } },
        },
      },
    },
  });

  if (!hire || hire.status === "CANCELLED" && hire.requesterId !== user.id) {
    return Response.json({ error: "Hire request not found" }, { status: 404 });
  }

  const isRequester = hire.requesterId === user.id;
  const isGuide = hire.guide.userId === user.id;

  if (!isRequester && !isGuide) {
    const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { role: true } });
    if (!dbUser || dbUser.role !== "ADMIN") {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  return Response.json({ hire });
}

/**
 * PATCH /api/guide-hires/:id
 *
 * - Traveller (requester): can cancel a PENDING or ACCEPTED hire
 *   Body: { action: "cancel" }
 *
 * - Guide: can accept or reject a PENDING hire
 *   Body: { action: "accept" | "reject", rejectionReason?: string }
 */
export async function PATCH(request: NextRequest, { params }: Params) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const hire = await prisma.guideHire.findUnique({
    where: { id },
    select: {
      id: true,
      requesterId: true,
      status: true,
      guide: { select: { id: true, userId: true } },
    },
  });

  if (!hire) {
    return Response.json({ error: "Hire request not found" }, { status: 404 });
  }

  const isRequester = hire.requesterId === user.id;
  const isGuide = hire.guide.userId === user.id;

  if (isRequester && isGuide) {
    return Response.json({ error: "Requester and guide cannot be the same person" }, { status: 403 });
  }

  if (!isRequester && !isGuide) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { action?: string; rejectionReason?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { action, rejectionReason } = body;

  if (isRequester) {
    if (action !== "cancel") {
      return Response.json({ error: "Travellers can only cancel a hire request" }, { status: 400 });
    }

    if (hire.status !== "PENDING" && hire.status !== "ACCEPTED") {
      return Response.json(
        { error: `Cannot cancel a hire that is ${hire.status.toLowerCase()}` },
        { status: 409 }
      );
    }

    const updated = await prisma.guideHire.update({
      where: { id },
      data: { status: "CANCELLED", cancelledAt: new Date() },
      select: { id: true, status: true, cancelledAt: true },
    });

    return Response.json({ message: "Hire request cancelled", hire: updated });
  }

  // Guide actions
  if (action !== "accept" && action !== "reject") {
    return Response.json({ error: "action must be 'accept' or 'reject'" }, { status: 400 });
  }

  if (hire.status !== "PENDING") {
    return Response.json(
      { error: `Cannot ${action} a hire that is ${hire.status.toLowerCase()}` },
      { status: 409 }
    );
  }

  if (action === "reject" && !rejectionReason?.trim()) {
    return Response.json({ error: "rejectionReason is required when rejecting" }, { status: 400 });
  }

  const updated = await prisma.guideHire.update({
    where: { id },
    data:
      action === "accept"
        ? { status: "ACCEPTED", acceptedAt: new Date() }
        : { status: "REJECTED", rejectionReason: rejectionReason!.trim() },
    select: {
      id: true,
      status: true,
      acceptedAt: true,
      rejectionReason: true,
      requester: { select: { fullName: true, email: true } },
    },
  });

  return Response.json({
    message:
      action === "accept"
        ? `Hire request from "${updated.requester.fullName}" accepted`
        : `Hire request from "${updated.requester.fullName}" rejected`,
    hire: updated,
  });
}
