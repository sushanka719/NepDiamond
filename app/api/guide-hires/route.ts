import { createSupabaseServerClient } from "@/lib/supabase-server";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

/**
 * POST /api/guide-hires
 *
 * Authenticated traveller hires a guide for a date range.
 *
 * Body: { guideId, startDate, endDate, requirements? }
 */
export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const requester = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, role: true, isActive: true, deletedAt: true },
  });

  if (!requester || !requester.isActive || requester.deletedAt) {
    return Response.json({ error: "Account not found or inactive" }, { status: 403 });
  }

  if (requester.role !== "TRAVELLER") {
    return Response.json({ error: "Only travellers can hire guides" }, { status: 403 });
  }

  let body: { guideId?: string; startDate?: string; endDate?: string; requirements?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { guideId, startDate, endDate, requirements } = body;

  if (!guideId || !startDate || !endDate) {
    return Response.json({ error: "guideId, startDate, and endDate are required" }, { status: 400 });
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return Response.json({ error: "Invalid date format" }, { status: 400 });
  }

  if (start >= end) {
    return Response.json({ error: "startDate must be before endDate" }, { status: 400 });
  }

  if (start < new Date()) {
    return Response.json({ error: "startDate must be in the future" }, { status: 400 });
  }

  const guide = await prisma.guideProfile.findUnique({
    where: { id: guideId },
    select: { id: true, userId: true, dailyRate: true, currency: true, verificationStatus: true, deletedAt: true },
  });

  if (!guide || guide.verificationStatus !== "APPROVED" || guide.deletedAt) {
    return Response.json({ error: "Guide not found or not available" }, { status: 404 });
  }

  if (guide.userId === user.id) {
    return Response.json({ error: "You cannot hire yourself" }, { status: 403 });
  }

  // Check for overlapping accepted/pending hires for this guide
  const overlap = await prisma.guideHire.findFirst({
    where: {
      guideId,
      status: { in: ["PENDING", "ACCEPTED"] },
      AND: [
        { startDate: { lte: end } },
        { endDate: { gte: start } },
      ],
    },
  });

  if (overlap) {
    return Response.json(
      { error: "Guide is not available for the requested dates" },
      { status: 409 }
    );
  }

  const msPerDay = 1000 * 60 * 60 * 24;
  const daysCount = Math.round((end.getTime() - start.getTime()) / msPerDay);
  const totalAmount = Number(guide.dailyRate) * daysCount;

  const hire = await prisma.guideHire.create({
    data: {
      requesterId: user.id,
      guideId,
      startDate: start,
      endDate: end,
      daysCount,
      dailyRate: guide.dailyRate,
      totalAmount,
      currency: guide.currency,
      requirements: requirements?.trim() || null,
    },
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
      createdAt: true,
      guide: {
        select: {
          id: true,
          user: { select: { fullName: true, avatarUrl: true } },
        },
      },
    },
  });

  return Response.json({ hire }, { status: 201 });
}

/**
 * GET /api/guide-hires
 *
 * Authenticated traveller lists their own hire requests.
 *
 * Query params:
 *   status   GuideHireStatus filter
 *   page     number (default 1)
 *   limit    number (default 10, max 50)
 */
export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const status = searchParams.get("status") as string | null;
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? 10)));
  const skip = (page - 1) * limit;

  const validStatuses = ["PENDING", "ACCEPTED", "REJECTED", "COMPLETED", "CANCELLED"];

  const where = {
    requesterId: user.id,
    deletedAt: null,
    ...(status && validStatuses.includes(status) && { status: status as "PENDING" | "ACCEPTED" | "REJECTED" | "COMPLETED" | "CANCELLED" }),
  };

  const [hires, total] = await Promise.all([
    prisma.guideHire.findMany({
      where,
      skip,
      take: limit,
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
        createdAt: true,
        guide: {
          select: {
            id: true,
            user: { select: { fullName: true, avatarUrl: true } },
          },
        },
      },
    }),
    prisma.guideHire.count({ where }),
  ]);

  return Response.json({
    items: hires,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  });
}
