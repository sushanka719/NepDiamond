import { createSupabaseServerClient } from "@/lib/supabase-server";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

type Params = { params: Promise<{ id: string }> };

/**
 * POST /api/guide-hires/:id/review
 * Traveller leaves a review for a COMPLETED hire.
 * Body: { rating: 1-5, comment?: string }
 */
export async function POST(request: NextRequest, { params }: Params) {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  let body: { rating?: number; comment?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { rating, comment } = body;
  if (!rating || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    return Response.json({ error: "rating must be an integer between 1 and 5" }, { status: 400 });
  }

  const hire = await prisma.guideHire.findUnique({
    where: { id, deletedAt: null },
    select: {
      id: true,
      requesterId: true,
      guideId: true,
      status: true,
      review: { select: { id: true } },
    },
  });

  if (!hire) return Response.json({ error: "Hire not found" }, { status: 404 });
  if (hire.requesterId !== user.id) return Response.json({ error: "Forbidden" }, { status: 403 });
  if (hire.status !== "COMPLETED") {
    return Response.json({ error: "You can only review a completed hire" }, { status: 409 });
  }
  if (hire.review) {
    return Response.json({ error: "You have already reviewed this hire" }, { status: 409 });
  }

  const review = await prisma.review.create({
    data: {
      reviewerId: user.id,
      guideHireId: id,
      guideId: hire.guideId,
      rating,
      comment: comment?.trim() || null,
    },
    select: { id: true, rating: true, comment: true, createdAt: true },
  });

  return Response.json({ review }, { status: 201 });
}

/** GET /api/guide-hires/:id/review — fetch the review for this hire (if any) */
export async function GET(_request: NextRequest, { params }: Params) {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const hire = await prisma.guideHire.findUnique({
    where: { id, deletedAt: null },
    select: {
      requesterId: true,
      review: { select: { id: true, rating: true, comment: true, createdAt: true } },
    },
  });

  if (!hire) return Response.json({ error: "Hire not found" }, { status: 404 });
  if (hire.requesterId !== user.id) return Response.json({ error: "Forbidden" }, { status: 403 });

  return Response.json({ review: hire.review ?? null });
}
