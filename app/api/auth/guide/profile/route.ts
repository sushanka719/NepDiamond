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
