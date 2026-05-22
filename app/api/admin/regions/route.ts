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

/**
 * GET /api/admin/regions
 *
 * Lists all regions (active + inactive) with trek counts.
 * Query params: page, limit, search
 */
export async function GET(request: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { searchParams } = request.nextUrl;
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 20)));
  const skip = (page - 1) * limit;
  const search = searchParams.get("search");

  const where = search
    ? { name: { contains: search, mode: "insensitive" as const } }
    : {};

  const [regions, total] = await Promise.all([
    prisma.region.findMany({
      where,
      skip,
      take: limit,
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        imageUrl: true,
        isActive: true,
        createdAt: true,
        _count: { select: { treks: true } },
      },
    }),
    prisma.region.count({ where }),
  ]);

  return Response.json({
    items: regions,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  });
}

/**
 * POST /api/admin/regions
 *
 * Creates a new region.
 * Body: { name, imageUrl? }
 */
export async function POST(request: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  let body: { name?: string; imageUrl?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const name = body.name?.trim();
  if (!name) {
    return Response.json({ error: "name is required" }, { status: 400 });
  }

  const slug = slugify(name);

  const existing = await prisma.region.findFirst({
    where: { OR: [{ name }, { slug }] },
    select: { id: true },
  });
  if (existing) {
    return Response.json(
      { error: "A region with that name already exists" },
      { status: 409 }
    );
  }

  const region = await prisma.region.create({
    data: { name, slug, imageUrl: body.imageUrl ?? null },
    select: {
      id: true,
      name: true,
      slug: true,
      imageUrl: true,
      isActive: true,
      createdAt: true,
    },
  });

  return Response.json({ region }, { status: 201 });
}
