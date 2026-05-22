import { createSupabaseServerClient } from "@/lib/supabase-server";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

type Params = { params: Promise<{ id: string }> };

/**
 * GET /api/admin/verifications/:id
 *
 * Admin-only. Returns the full guide profile for review, including
 * the guide's hire history count and any previous rejection reason.
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

  const admin = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  });

  if (!admin || admin.role !== "ADMIN") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const profile = await prisma.guideProfile.findUnique({
    where: { id },
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
      verifiedAt: true,
      verifiedById: true,
      createdAt: true,
      updatedAt: true,
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          avatarUrl: true,
          phone: true,
          createdAt: true,
        },
      },
      hires: {
        select: { id: true },
      },
      reviews: {
        where: { deletedAt: null },
        select: { rating: true },
      },
    },
  });

  if (!profile) {
    return Response.json({ error: "Guide profile not found" }, { status: 404 });
  }

  const avgRating =
    profile.reviews.length > 0
      ? profile.reviews.reduce((sum, r) => sum + r.rating, 0) /
        profile.reviews.length
      : null;

  return Response.json({
    profile: {
      ...profile,
      hireCount: profile.hires.length,
      reviewCount: profile.reviews.length,
      avgRating: avgRating ? Math.round(avgRating * 10) / 10 : null,
      hires: undefined,
      reviews: undefined,
    },
  });
}

/**
 * PATCH /api/admin/verifications/:id
 *
 * Admin-only. Approve or reject a guide profile.
 *
 * Body: { action: "approve" | "reject", rejectionReason?: string }
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

  const admin = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  });

  if (!admin || admin.role !== "ADMIN") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  let body: { action?: string; rejectionReason?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { action, rejectionReason } = body;

  if (action !== "approve" && action !== "reject") {
    return Response.json(
      { error: "action must be 'approve' or 'reject'" },
      { status: 400 }
    );
  }

  if (action === "reject" && !rejectionReason?.trim()) {
    return Response.json(
      { error: "rejectionReason is required when rejecting" },
      { status: 400 }
    );
  }

  const existing = await prisma.guideProfile.findUnique({
    where: { id },
    select: { id: true, verificationStatus: true },
  });

  if (!existing) {
    return Response.json({ error: "Guide profile not found" }, { status: 404 });
  }

  if (existing.verificationStatus !== "PENDING") {
    return Response.json(
      {
        error: `Profile is already ${existing.verificationStatus.toLowerCase()}. Only PENDING profiles can be reviewed.`,
      },
      { status: 409 }
    );
  }

  const profile = await prisma.guideProfile.update({
    where: { id },
    data:
      action === "approve"
        ? {
            verificationStatus: "APPROVED",
            verifiedAt: new Date(),
            verifiedById: user.id,
            rejectionReason: null,
          }
        : {
            verificationStatus: "REJECTED",
            verifiedAt: null,
            verifiedById: null,
            rejectionReason: rejectionReason!.trim(),
          },
    select: {
      id: true,
      verificationStatus: true,
      verifiedAt: true,
      rejectionReason: true,
      user: {
        select: { fullName: true, email: true },
      },
    },
  });

  return Response.json({
    message:
      action === "approve"
        ? `Guide "${profile.user.fullName}" approved and is now live on the platform`
        : `Guide "${profile.user.fullName}" rejected`,
    profile,
  });
}
