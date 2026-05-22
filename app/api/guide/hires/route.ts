import { createSupabaseServerClient } from "@/lib/supabase-server";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

/**
 * GET /api/guide/hires
 *
 * Guide-only. Lists all hire requests directed at the authenticated guide.
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

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true, guideProfile: { select: { id: true } } },
  });

  if (!dbUser || dbUser.role !== "GUIDE") {
    return Response.json({ error: "Forbidden: guide role required" }, { status: 403 });
  }

  if (!dbUser.guideProfile) {
    return Response.json({ error: "Guide profile not found" }, { status: 404 });
  }

  const guideId = dbUser.guideProfile.id;

  const { searchParams } = request.nextUrl;
  const status = searchParams.get("status") as string | null;
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? 10)));
  const skip = (page - 1) * limit;

  const validStatuses = ["PENDING", "ACCEPTED", "REJECTED", "COMPLETED", "CANCELLED"];

  const where = {
    guideId,
    deletedAt: null,
    ...(status && validStatuses.includes(status) && {
      status: status as "PENDING" | "ACCEPTED" | "REJECTED" | "COMPLETED" | "CANCELLED",
    }),
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
    }),
    prisma.guideHire.count({ where }),
  ]);

  return Response.json({
    items: hires,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  });
}
