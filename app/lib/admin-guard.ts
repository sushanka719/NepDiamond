import { createSupabaseServerClient } from "@/lib/supabase-server";
import { prisma } from "@/lib/prisma";

type AdminGuardOk = { ok: true; adminId: string };
type AdminGuardFail = { ok: false; response: Response };
type AdminGuardResult = AdminGuardOk | AdminGuardFail;

/**
 * Verifies the request is from an authenticated ADMIN.
 * Returns the admin's user ID on success, or a ready-to-return Response on failure.
 */
export async function requireAdmin(): Promise<AdminGuardResult> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      ok: false,
      response: Response.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  });

  if (!dbUser || dbUser.role !== "ADMIN") {
    return {
      ok: false,
      response: Response.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { ok: true, adminId: user.id };
}
