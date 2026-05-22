import { createSupabaseServerClient } from "@/lib/supabase-server";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

// POST — guide submits their profile details for admin verification
// Body: { bio, experienceYears, languages, dailyRate, currency, specializations, licenseNumber }
export async function POST(request: NextRequest) {
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
    select: { role: true },
  });

  if (!dbUser || dbUser.role !== "GUIDE") {
    return Response.json(
      { error: "Only users with GUIDE role can submit a guide profile" },
      { status: 403 }
    );
  }

  let body: {
    bio?: string;
    experienceYears?: number;
    languages?: string[];
    dailyRate?: number;
    currency?: string;
    specializations?: string[];
    licenseNumber?: string;
    coverPhotoUrl?: string;
  };

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const {
    bio,
    experienceYears = 0,
    languages = [],
    dailyRate,
    currency = "USD",
    specializations = [],
    licenseNumber,
    coverPhotoUrl,
  } = body;

  if (!dailyRate || dailyRate <= 0) {
    return Response.json({ error: "dailyRate is required" }, { status: 400 });
  }

  // Upsert so guides can re-submit if rejected
  const profile = await prisma.guideProfile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      bio,
      experienceYears,
      languages,
      dailyRate,
      currency,
      specializations,
      licenseNumber,
      coverPhotoUrl,
      verificationStatus: "PENDING",
    },
    update: {
      bio,
      experienceYears,
      languages,
      dailyRate,
      currency,
      specializations,
      licenseNumber,
      coverPhotoUrl,
      verificationStatus: "PENDING",
      rejectionReason: null,
    },
  });

  return Response.json(
    {
      message: "Profile submitted for verification",
      profile: {
        id: profile.id,
        verificationStatus: profile.verificationStatus,
      },
    },
    { status: 201 }
  );
}

/**
 * PUT /api/auth/guide/profile
 *
 * Guide updates their own profile fields without resetting verification status
 * to PENDING — only non-critical fields (bio, languages, specializations,
 * coverPhotoUrl) are editable in-place. Changing dailyRate or licenseNumber
 * resets to PENDING so admins can re-review.
 */
export async function PUT(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await prisma.guideProfile.findUnique({
    where: { userId: user.id },
    select: {
      id: true,
      dailyRate: true,
      licenseNumber: true,
      verificationStatus: true,
    },
  });

  if (!existing) {
    return Response.json({ error: "Profile not found" }, { status: 404 });
  }

  let body: {
    bio?: string;
    experienceYears?: number;
    languages?: string[];
    dailyRate?: number;
    currency?: string;
    specializations?: string[];
    licenseNumber?: string;
    coverPhotoUrl?: string;
  };

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Re-trigger verification review if rate or license changes
  const rateChanged =
    body.dailyRate !== undefined &&
    Number(body.dailyRate) !== Number(existing.dailyRate);
  const licenseChanged =
    body.licenseNumber !== undefined &&
    body.licenseNumber !== existing.licenseNumber;

  const needsReReview = rateChanged || licenseChanged;

  const profile = await prisma.guideProfile.update({
    where: { userId: user.id },
    data: {
      ...(body.bio !== undefined && { bio: body.bio }),
      ...(body.experienceYears !== undefined && {
        experienceYears: body.experienceYears,
      }),
      ...(body.languages !== undefined && { languages: body.languages }),
      ...(body.dailyRate !== undefined && { dailyRate: body.dailyRate }),
      ...(body.currency !== undefined && { currency: body.currency }),
      ...(body.specializations !== undefined && {
        specializations: body.specializations,
      }),
      ...(body.licenseNumber !== undefined && {
        licenseNumber: body.licenseNumber,
      }),
      ...(body.coverPhotoUrl !== undefined && {
        coverPhotoUrl: body.coverPhotoUrl,
      }),
      ...(needsReReview && {
        verificationStatus: "PENDING",
        verifiedAt: null,
        verifiedById: null,
        rejectionReason: null,
      }),
    },
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
      updatedAt: true,
    },
  });

  return Response.json({
    profile,
    message: needsReReview
      ? "Profile updated and resubmitted for verification"
      : "Profile updated",
  });
}

/**
 * DELETE /api/auth/guide/profile
 *
 * Guide soft-deletes their own profile (sets deletedAt).
 * The profile is hidden from the public listing immediately.
 */
export async function DELETE(_request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await prisma.guideProfile.findUnique({
    where: { userId: user.id },
    select: { id: true, deletedAt: true },
  });

  if (!existing) {
    return Response.json({ error: "Profile not found" }, { status: 404 });
  }

  if (existing.deletedAt) {
    return Response.json({ error: "Profile already deleted" }, { status: 409 });
  }

  await prisma.guideProfile.update({
    where: { userId: user.id },
    data: { deletedAt: new Date() },
  });

  return Response.json({ message: "Profile deleted" });
}

// GET — guide fetches their own profile + verification status
export async function GET(_request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await prisma.guideProfile.findUnique({
    where: { userId: user.id },
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
    },
  });

  if (!profile) {
    return Response.json({ error: "Profile not found" }, { status: 404 });
  }

  return Response.json({ profile });
}
