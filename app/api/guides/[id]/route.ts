import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

/**
 * GET /api/guides/:id
 *
 * Public endpoint. Returns the full public profile of an APPROVED guide.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const guide = await prisma.guideProfile.findUnique({
    where: { id },
    select: {
      id: true,
      bio: true,
      experienceYears: true,
      languages: true,
      dailyRate: true,
      currency: true,
      specializations: true,
      coverPhotoUrl: true,
      verificationStatus: true,
      verifiedAt: true,
      user: {
        select: {
          id: true,
          fullName: true,
          avatarUrl: true,
          createdAt: true,
        },
      },
      reviews: {
        where: { deletedAt: null },
        select: {
          id: true,
          rating: true,
          comment: true,
          createdAt: true,
          reviewer: {
            select: { fullName: true, avatarUrl: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });

  if (!guide || guide.verificationStatus !== "APPROVED") {
    return Response.json({ error: "Guide not found" }, { status: 404 });
  }

  const avgRating =
    guide.reviews.length > 0
      ? guide.reviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) /
        guide.reviews.length
      : null;

  return Response.json({
    guide: {
      ...guide,
      reviewCount: guide.reviews.length,
      avgRating: avgRating ? Math.round(avgRating * 10) / 10 : null,
    },
  });
}
