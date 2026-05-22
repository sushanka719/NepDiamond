import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

/**
 * GET /api/guides
 *
 * Public endpoint. Lists all APPROVED, active guides.
 *
 * Query params:
 *   page        number  (default 1)
 *   limit       number  (default 12, max 50)
 *   language    string  filter by spoken language
 *   minRate     number  minimum daily rate
 *   maxRate     number  maximum daily rate
 *   currency    string  (default USD)
 *   search      string  full-name keyword search
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? 12)));
  const skip = (page - 1) * limit;

  const language = searchParams.get("language");
  const minRate = searchParams.get("minRate");
  const maxRate = searchParams.get("maxRate");
  const search = searchParams.get("search");

  const where = {
    verificationStatus: "APPROVED" as const,
    deletedAt: null,
    ...(language && { languages: { has: language } }),
    ...(minRate && { dailyRate: { gte: Number(minRate) } }),
    ...(maxRate && {
      dailyRate: {
        ...(minRate ? { gte: Number(minRate) } : {}),
        lte: Number(maxRate),
      },
    }),
    user: {
      isActive: true,
      deletedAt: null,
      ...(search && {
        fullName: { contains: search, mode: "insensitive" as const },
      }),
    },
  };

  const [guides, total] = await Promise.all([
    prisma.guideProfile.findMany({
      where,
      skip,
      take: limit,
      orderBy: { verifiedAt: "desc" },
      select: {
        id: true,
        bio: true,
        experienceYears: true,
        languages: true,
        dailyRate: true,
        currency: true,
        specializations: true,
        coverPhotoUrl: true,
        verifiedAt: true,
        user: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },
        reviews: {
          select: { rating: true },
        },
      },
    }),
    prisma.guideProfile.count({ where }),
  ]);

  const items = guides.map((g) => {
    const avgRating =
      g.reviews.length > 0
        ? g.reviews.reduce((sum, r) => sum + r.rating, 0) / g.reviews.length
        : null;

    return {
      id: g.id,
      user: g.user,
      bio: g.bio,
      experienceYears: g.experienceYears,
      languages: g.languages,
      dailyRate: g.dailyRate,
      currency: g.currency,
      specializations: g.specializations,
      coverPhotoUrl: g.coverPhotoUrl,
      verifiedAt: g.verifiedAt,
      reviewCount: g.reviews.length,
      avgRating: avgRating ? Math.round(avgRating * 10) / 10 : null,
    };
  });

  return Response.json({
    items,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
}
