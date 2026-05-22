import { createSupabaseServerClient } from "@/lib/supabase-server";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

/**
 * GET /api/guide/schedule
 *
 * Guide-only. Returns upcoming accepted hires and availability blocks.
 *
 * Query: view = "upcoming" | "past" | "all" (default: upcoming)
 */
export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return Response.json({ error: "Unauthorized" }, { status: 401 });

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
  const view = request.nextUrl.searchParams.get("view") ?? "upcoming";
  const now = new Date();

  const dateFilter =
    view === "upcoming"
      ? { startDate: { gte: now } }
      : view === "past"
      ? { endDate: { lt: now } }
      : {};

  const [hires, availability] = await Promise.all([
    prisma.guideHire.findMany({
      where: {
        guideId,
        deletedAt: null,
        status: { in: ["ACCEPTED", "COMPLETED"] },
        ...dateFilter,
      },
      orderBy: { startDate: "asc" },
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
        acceptedAt: true,
        completedAt: true,
        requester: { select: { id: true, fullName: true, avatarUrl: true, email: true, phone: true } },
      },
    }),
    prisma.guideAvailability.findMany({
      where: {
        guideId,
        ...(view === "upcoming" ? { endDate: { gte: now } } : {}),
      },
      orderBy: { startDate: "asc" },
      select: { id: true, startDate: true, endDate: true, isBlocked: true, reason: true },
    }),
  ]);

  return Response.json({
    hires: hires.map((h) => ({
      ...h,
      dailyRate: Number(h.dailyRate),
      totalAmount: Number(h.totalAmount),
      startDate: h.startDate.toISOString(),
      endDate: h.endDate.toISOString(),
      acceptedAt: h.acceptedAt?.toISOString() ?? null,
      completedAt: h.completedAt?.toISOString() ?? null,
    })),
    availability: availability.map((a) => ({
      ...a,
      startDate: a.startDate.toISOString(),
      endDate: a.endDate.toISOString(),
    })),
  });
}
