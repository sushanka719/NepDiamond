import { createSupabaseServerClient } from "@/lib/supabase-server";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

// POST { role: "TRAVELLER" | "GUIDE" }
// Assigns role to the authenticated user. GUIDE role redirects to profile setup.
export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { role?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { role } = body;

  if (role !== "TRAVELLER" && role !== "GUIDE") {
    return Response.json(
      { error: "role must be TRAVELLER or GUIDE" },
      { status: 400 }
    );
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { role },
    select: { id: true, role: true, email: true, fullName: true },
  });

  return Response.json({ user: updated });
}
