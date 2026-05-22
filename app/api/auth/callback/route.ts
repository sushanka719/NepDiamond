import { createSupabaseServerClient } from "@/lib/supabase-server";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

// Handles Supabase OAuth callback, syncs user to DB, redirects to role selection
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");

  if (!code) {
    return Response.redirect(`${origin}/auth/error?message=missing_code`);
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.session) {
    return Response.redirect(
      `${origin}/auth/error?message=${encodeURIComponent(error?.message ?? "auth_failed")}`
    );
  }

  const { user } = data.session;

  // Check existence before upsert to detect first-ever sign-in
  const existing = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  });

  // Upsert user in our DB — id mirrors Supabase auth UID
  await prisma.user.upsert({
    where: { id: user.id },
    create: {
      id: user.id,
      email: user.email!,
      fullName:
        user.user_metadata?.full_name ??
        user.user_metadata?.name ??
        user.email!,
      avatarUrl: user.user_metadata?.avatar_url ?? null,
      role: "TRAVELLER",
    },
    update: {
      email: user.email!,
      fullName:
        user.user_metadata?.full_name ??
        user.user_metadata?.name ??
        user.email!,
      avatarUrl: user.user_metadata?.avatar_url ?? null,
    },
  });

  // First-ever sign-in — send to role selection
  if (!existing) {
    return Response.redirect(`${origin}/auth/select-role`);
  }

  // Returning user — route to their dashboard
  if (existing.role === "GUIDE") {
    return Response.redirect(`${origin}/dashboard/guide`);
  }

  if (existing.role === "ADMIN") {
    return Response.redirect(`${origin}/dashboard/admin`);
  }

  return Response.redirect(`${origin}/dashboard/traveller`);
}
