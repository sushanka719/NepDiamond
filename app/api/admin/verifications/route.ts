import { createSupabaseServerClient } from "@/lib/supabase-server";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

/**
 * GET /api/admin/verifications
 *
 * Admin-only. Lists guide verification requests.
 *
 * Query params:
 *   status   "PENDING" | "APPROVED" | "REJECTED"  (default: PENDING)
 *   page     number (default 1)
 *   limit    number (default 20, max 100)
 *   search   string — filter by guide's full name or email
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

  const admin = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  });

  if (!admin || admin.role !== "ADMIN") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = request.nextUrl;

  const rawStatus = searchParams.get("status") ?? "PENDING";
  const validStatuses = ["PENDING", "APPROVED", "REJECTED"] as const;
  type Status = (typeof validStatuses)[number];
  if (!validStatuses.includes(rawStatus as Status)) {
    return Response.json(
      { error: "status must be PENDING, APPROVED, or REJECTED" },
      { status: 400 }
    );
  }
  const status = rawStatus as Status;

  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 20)));
  const skip = (page - 1) * limit;
  const search = searchParams.get("search");

  const where = {
    verificationStatus: status,
    deletedAt: null,
    ...(search && {
      user: {
        OR: [
          { fullName: { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
        ],
      },
    }),
  };

  const [profiles, total] = await Promise.all([
    prisma.guideProfile.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        bio: true,
        experienceYears: true,
        languages: true,
        dailyRate: true,
        currency: true,
        specializations: true,
        licenseNumber: true,
        coverPhotoUrl: true,
        verificationStatus: true,
        rejectionReason: true,
        createdAt: true,
        updatedAt: true,
        verifiedAt: true,
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatarUrl: true,
            createdAt: true,
          },
        },
      },
    }),
    prisma.guideProfile.count({ where }),
  ]);

  return Response.json({
    items: profiles,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      status,
    },
  });
}
