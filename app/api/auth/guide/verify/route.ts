import { createSupabaseServerClient } from "@/lib/supabase-server";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

// PATCH — admin approves or rejects a guide profile
// Body: { guideProfileId, status: "APPROVED" | "REJECTED", rejectionReason? }
export async function PATCH(request: NextRequest) {
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

  let body: {
    guideProfileId?: string;
    status?: string;
    rejectionReason?: string;
  };

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { guideProfileId, status, rejectionReason } = body;

  if (!guideProfileId) {
    return Response.json({ error: "guideProfileId is required" }, { status: 400 });
  }

  if (status !== "APPROVED" && status !== "REJECTED") {
    return Response.json(
      { error: "status must be APPROVED or REJECTED" },
      { status: 400 }
    );
  }

  if (status === "REJECTED" && !rejectionReason) {
    return Response.json(
      { error: "rejectionReason is required when rejecting" },
      { status: 400 }
    );
  }

  const profile = await prisma.guideProfile.update({
    where: { id: guideProfileId },
    data: {
      verificationStatus: status,
      verifiedAt: status === "APPROVED" ? new Date() : null,
      verifiedById: status === "APPROVED" ? user.id : null,
      rejectionReason: status === "REJECTED" ? rejectionReason : null,
    },
    select: {
      id: true,
      userId: true,
      verificationStatus: true,
      verifiedAt: true,
      rejectionReason: true,
    },
  });

  return Response.json({ profile });
}
