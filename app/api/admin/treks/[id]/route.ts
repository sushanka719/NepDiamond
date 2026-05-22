import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";
import { NextRequest } from "next/server";

type Params = { params: Promise<{ id: string }> };

const VALID_DIFFICULTIES = ["EASY", "MODERATE", "STRENUOUS", "EXTREME"] as const;
const VALID_STATUSES = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;

/**
 * GET /api/admin/treks/:id
 *
 * Full trek detail including itinerary and media.
 */
export async function GET(_req: NextRequest, { params }: Params) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { id } = await params;

  const trek = await prisma.trek.findUnique({
    where: { id, deletedAt: null },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      difficulty: true,
      status: true,
      durationDays: true,
      pricePerPerson: true,
      maxParticipants: true,
      coverImageUrl: true,
      createdAt: true,
      updatedAt: true,
      region: { select: { id: true, name: true, slug: true } },
      itinerary: {
        select: {
          id: true,
          dayNumber: true,
          title: true,
          description: true,
        },
        orderBy: { dayNumber: "asc" },
      },
      media: {
        select: {
          id: true,
          url: true,
          mediaType: true,
          caption: true,
          sortOrder: true,
        },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  if (!trek) {
    return Response.json({ error: "Trek not found" }, { status: 404 });
  }

  return Response.json({ trek });
}

/**
 * PUT /api/admin/treks/:id
 *
 * Updates trek fields. All fields are optional — only provided ones are updated.
 * Body: { regionId?, title?, description?, difficulty?, durationDays?,
 *          pricePerPerson?, maxParticipants?, coverImageUrl?, status? }
 */
export async function PUT(request: NextRequest, { params }: Params) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { id } = await params;

  const existing = await prisma.trek.findUnique({
    where: { id, deletedAt: null },
    select: { id: true, slug: true, title: true },
  });
  if (!existing) {
    return Response.json({ error: "Trek not found" }, { status: 404 });
  }

  let body: {
    regionId?: string;
    title?: string;
    description?: string;
    difficulty?: string;
    durationDays?: number;
    pricePerPerson?: number;
    maxParticipants?: number;
    coverImageUrl?: string;
    status?: string;
  };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (
    body.difficulty &&
    !VALID_DIFFICULTIES.includes(body.difficulty as (typeof VALID_DIFFICULTIES)[number])
  ) {
    return Response.json(
      { error: `difficulty must be one of: ${VALID_DIFFICULTIES.join(", ")}` },
      { status: 400 }
    );
  }

  if (
    body.status &&
    !VALID_STATUSES.includes(body.status as (typeof VALID_STATUSES)[number])
  ) {
    return Response.json(
      { error: `status must be one of: ${VALID_STATUSES.join(", ")}` },
      { status: 400 }
    );
  }

  if (body.regionId) {
    const regionExists = await prisma.region.findUnique({
      where: { id: body.regionId },
      select: { id: true },
    });
    if (!regionExists) {
      return Response.json({ error: "Region not found" }, { status: 404 });
    }
  }

  // Recompute slug only if title changes
  let newSlug: string | undefined;
  if (body.title && body.title.trim() !== existing.title) {
    newSlug = body.title
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");

    const conflict = await prisma.trek.findUnique({
      where: { slug: newSlug },
      select: { id: true },
    });
    if (conflict && conflict.id !== id) {
      return Response.json(
        { error: "A trek with that title already exists" },
        { status: 409 }
      );
    }
  }

  const trek = await prisma.trek.update({
    where: { id },
    data: {
      ...(body.regionId !== undefined && { regionId: body.regionId }),
      ...(body.title !== undefined && { title: body.title.trim() }),
      ...(newSlug && { slug: newSlug }),
      ...(body.description !== undefined && { description: body.description.trim() }),
      ...(body.difficulty !== undefined && {
        difficulty: body.difficulty as (typeof VALID_DIFFICULTIES)[number],
      }),
      ...(body.durationDays !== undefined && { durationDays: body.durationDays }),
      ...(body.pricePerPerson !== undefined && { pricePerPerson: body.pricePerPerson }),
      ...(body.maxParticipants !== undefined && { maxParticipants: body.maxParticipants }),
      ...(body.coverImageUrl !== undefined && { coverImageUrl: body.coverImageUrl }),
      ...(body.status !== undefined && {
        status: body.status as (typeof VALID_STATUSES)[number],
      }),
    },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      difficulty: true,
      status: true,
      durationDays: true,
      pricePerPerson: true,
      maxParticipants: true,
      coverImageUrl: true,
      updatedAt: true,
      region: { select: { id: true, name: true } },
    },
  });

  return Response.json({ trek });
}

/**
 * DELETE /api/admin/treks/:id
 *
 * Soft-deletes the trek (sets deletedAt). Removes it from public listings.
 */
export async function DELETE(_req: NextRequest, { params }: Params) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { id } = await params;

  const trek = await prisma.trek.findUnique({
    where: { id },
    select: { id: true, deletedAt: true },
  });

  if (!trek) {
    return Response.json({ error: "Trek not found" }, { status: 404 });
  }

  if (trek.deletedAt) {
    return Response.json({ error: "Trek already deleted" }, { status: 409 });
  }

  await prisma.trek.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  return Response.json({ message: "Trek deleted" });
}
