import { createSupabaseServerClient } from "@/lib/supabase-server";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

/**
 * PATCH /api/auth/profile
 * Update the authenticated user's basic account info.
 * Body: { fullName?, phone?, avatarUrl? }
 */
export async function PATCH(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  let body: { fullName?: string; phone?: string; avatarUrl?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { fullName, phone, avatarUrl } = body;

  if (fullName !== undefined && fullName.trim().length < 2) {
    return Response.json({ error: "Full name must be at least 2 characters" }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      ...(fullName !== undefined && { fullName: fullName.trim() }),
      ...(phone !== undefined && { phone: phone.trim() || null }),
      ...(avatarUrl !== undefined && { avatarUrl: avatarUrl.trim() || null }),
    },
    select: { id: true, fullName: true, phone: true, avatarUrl: true, role: true, updatedAt: true },
  });

  return Response.json({ user: updated });
}

/** GET /api/auth/profile — return current user's basic info */
export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, fullName: true, email: true, phone: true, avatarUrl: true, role: true },
  });

  if (!dbUser) return Response.json({ error: "User not found" }, { status: 404 });
  return Response.json({ user: dbUser });
}
