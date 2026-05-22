import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { NextRequest } from "next/server";

/**
 * GET /api/bookings
 * Authenticated user's own trek bookings.
 *
 * Query: page, limit, status
 */
export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 20)));
  const skip = (page - 1) * limit;
  const status = searchParams.get("status");

  const where = {
    userId: user.id,
    deletedAt: null,
    ...(status && { status: status as "PENDING" | "CONFIRMED" | "CANCELLED" | "REFUNDED" }),
  };

  const [bookings, total] = await Promise.all([
    prisma.trekBooking.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        status: true,
        amount: true,
        currency: true,
        confirmedAt: true,
        cancelledAt: true,
        createdAt: true,
        departure: {
          select: {
            id: true,
            departureDate: true,
            returnDate: true,
            status: true,
            trek: {
              select: { id: true, title: true, slug: true, coverImageUrl: true, difficulty: true },
            },
          },
        },
      },
    }),
    prisma.trekBooking.count({ where }),
  ]);

  return Response.json({ items: bookings, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } });
}
