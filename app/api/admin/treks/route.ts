import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";
import { NextRequest } from "next/server";

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

const VALID_DIFFICULTIES = ["EASY", "MODERATE", "STRENUOUS", "EXTREME"] as const;
const VALID_STATUSES = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;

/**
 * GET /api/admin/treks
 *
 * Admin list of all treks (all statuses, no soft-delete filter by default).
 *
 * Query params:
 *   page        number  (default 1)
 *   limit       number  (default 20, max 100)
 *   status      DRAFT | PUBLISHED | ARCHIVED
 *   difficulty  EASY | MODERATE | STRENUOUS | EXTREME
 *   regionId    UUID
 *   search      string — title keyword
 */
export async function GET(request: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { searchParams } = request.nextUrl;
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 20)));
  const skip = (page - 1) * limit;

  const status = searchParams.get("status");
  const difficulty = searchParams.get("difficulty");
  const regionId = searchParams.get("regionId");
  const search = searchParams.get("search");

  if (status && !VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])) {
    return Response.json({ error: "Invalid status value" }, { status: 400 });
  }
  if (difficulty && !VALID_DIFFICULTIES.includes(difficulty as (typeof VALID_DIFFICULTIES)[number])) {
    return Response.json({ error: "Invalid difficulty value" }, { status: 400 });
  }

  const where = {
    deletedAt: null,
    ...(status && { status: status as (typeof VALID_STATUSES)[number] }),
    ...(difficulty && { difficulty: difficulty as (typeof VALID_DIFFICULTIES)[number] }),
    ...(regionId && { regionId }),
    ...(search && { title: { contains: search, mode: "insensitive" as const } }),
  };

  const [treks, total] = await Promise.all([
    prisma.trek.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        slug: true,
        difficulty: true,
        status: true,
        durationDays: true,
        pricePerPerson: true,
        maxParticipants: true,
        coverImageUrl: true,
        createdAt: true,
        updatedAt: true,
        region: { select: { id: true, name: true } },
        _count: { select: { itinerary: true, media: true } },
      },
    }),
    prisma.trek.count({ where }),
  ]);

  return Response.json({
    items: treks,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  });
}

/**
 * POST /api/admin/treks
 *
 * Creates a trek and its first departure in one transaction.
 * The departure is immediately SCHEDULED (publicly listed).
 *
 * Body: {
 *   regionId, title, description, difficulty,
 *   durationDays, pricePerPerson, maxParticipants,
 *   departureDate,               ← required
 *   returnDate?,
 *   coverImageUrl?,
 *   itinerary?: { dayNumber, title, description }[]
 * }
 */
export async function POST(request: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  let body: {
    regionId?: string;
    title?: string;
    description?: string;
    difficulty?: string;
    durationDays?: number;
    pricePerPerson?: number;
    maxParticipants?: number;
    departureDate?: string;
    returnDate?: string;
    coverImageUrl?: string;
    itinerary?: { dayNumber: number; title: string; description: string }[];
  };

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const {
    regionId,
    title,
    description,
    difficulty,
    durationDays,
    pricePerPerson,
    maxParticipants,
    departureDate,
    returnDate,
    coverImageUrl,
    itinerary = [],
  } = body;

  if (!regionId) return Response.json({ error: "regionId is required" }, { status: 400 });
  if (!title?.trim()) return Response.json({ error: "title is required" }, { status: 400 });
  if (!description?.trim()) return Response.json({ error: "description is required" }, { status: 400 });
  if (!difficulty || !VALID_DIFFICULTIES.includes(difficulty as (typeof VALID_DIFFICULTIES)[number])) {
    return Response.json({ error: `difficulty must be one of: ${VALID_DIFFICULTIES.join(", ")}` }, { status: 400 });
  }
  if (!durationDays || durationDays < 1) {
    return Response.json({ error: "durationDays must be at least 1" }, { status: 400 });
  }
  if (!pricePerPerson || pricePerPerson < 0) {
    return Response.json({ error: "pricePerPerson is required" }, { status: 400 });
  }
  if (!maxParticipants || maxParticipants < 1) {
    return Response.json({ error: "maxParticipants must be at least 1" }, { status: 400 });
  }
  if (!departureDate) return Response.json({ error: "departureDate is required" }, { status: 400 });
  const parsedDeparture = new Date(departureDate);
  if (isNaN(parsedDeparture.getTime())) {
    return Response.json({ error: "departureDate is not a valid date" }, { status: 400 });
  }
  const parsedReturn = returnDate ? new Date(returnDate) : null;
  if (parsedReturn && isNaN(parsedReturn.getTime())) {
    return Response.json({ error: "returnDate is not a valid date" }, { status: 400 });
  }

  const regionExists = await prisma.region.findUnique({ where: { id: regionId }, select: { id: true } });
  if (!regionExists) return Response.json({ error: "Region not found" }, { status: 404 });

  const slug = slugify(title.trim());
  const slugConflict = await prisma.trek.findUnique({ where: { slug }, select: { id: true } });
  if (slugConflict) {
    return Response.json({ error: "A trek with that title already exists" }, { status: 409 });
  }

  const { trek, departure } = await prisma.$transaction(async (tx) => {
    const trek = await tx.trek.create({
      data: {
        regionId,
        title: title.trim(),
        slug,
        description: description.trim(),
        difficulty: difficulty as (typeof VALID_DIFFICULTIES)[number],
        durationDays,
        pricePerPerson,
        maxParticipants,
        coverImageUrl: coverImageUrl ?? null,
        status: "PUBLISHED",
        itinerary: itinerary.length > 0
          ? { create: itinerary.map((d) => ({ dayNumber: d.dayNumber, title: d.title.trim(), description: d.description.trim() })) }
          : undefined,
      },
      select: { id: true, title: true, slug: true, status: true, difficulty: true, durationDays: true, pricePerPerson: true, maxParticipants: true, coverImageUrl: true, createdAt: true, region: { select: { id: true, name: true } }, itinerary: { select: { id: true, dayNumber: true, title: true }, orderBy: { dayNumber: "asc" } } },
    });

    const departure = await tx.trekDeparture.create({
      data: {
        trekId: trek.id,
        departureDate: parsedDeparture,
        returnDate: parsedReturn,
        pricePerPerson,
        maxParticipants,
        currency: "USD",
        status: "SCHEDULED",
      },
      select: { id: true, departureDate: true, returnDate: true, pricePerPerson: true, maxParticipants: true, status: true },
    });

    return { trek, departure };
  });

  return Response.json({ trek, departure }, { status: 201 });
}
