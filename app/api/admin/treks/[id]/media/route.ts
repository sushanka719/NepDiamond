import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";
import { NextRequest } from "next/server";

type Params = { params: Promise<{ id: string }> };

const VALID_MEDIA_TYPES = ["image", "video"] as const;

/**
 * GET /api/admin/treks/:id/media
 *
 * Lists all media items for a trek, ordered by sortOrder.
 */
export async function GET(_req: NextRequest, { params }: Params) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { id } = await params;

  const trek = await prisma.trek.findUnique({
    where: { id, deletedAt: null },
    select: { id: true },
  });
  if (!trek) {
    return Response.json({ error: "Trek not found" }, { status: 404 });
  }

  const media = await prisma.trekMedia.findMany({
    where: { trekId: id },
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      url: true,
      mediaType: true,
      caption: true,
      sortOrder: true,
      createdAt: true,
    },
  });

  return Response.json({ media });
}

/**
 * POST /api/admin/treks/:id/media
 *
 * Adds one or more media items to a trek.
 * Body: { items: { url, mediaType, caption?, sortOrder? }[] }
 *    OR single: { url, mediaType, caption?, sortOrder? }
 */
export async function POST(request: NextRequest, { params }: Params) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { id } = await params;

  const trek = await prisma.trek.findUnique({
    where: { id, deletedAt: null },
    select: { id: true },
  });
  if (!trek) {
    return Response.json({ error: "Trek not found" }, { status: 404 });
  }

  let body: {
    items?: { url: string; mediaType: string; caption?: string; sortOrder?: number }[];
    url?: string;
    mediaType?: string;
    caption?: string;
    sortOrder?: number;
  };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const incoming =
    body.items ??
    (body.url && body.mediaType
      ? [{ url: body.url, mediaType: body.mediaType, caption: body.caption, sortOrder: body.sortOrder }]
      : []);

  if (incoming.length === 0) {
    return Response.json(
      { error: "Provide at least one item: { url, mediaType }" },
      { status: 400 }
    );
  }

  for (const item of incoming) {
    if (!item.url?.trim()) {
      return Response.json({ error: "url is required for each media item" }, { status: 400 });
    }
    if (!VALID_MEDIA_TYPES.includes(item.mediaType as (typeof VALID_MEDIA_TYPES)[number])) {
      return Response.json(
        { error: `mediaType must be "image" or "video"` },
        { status: 400 }
      );
    }
  }

  const created = await prisma.trekMedia.createMany({
    data: incoming.map((item, i) => ({
      trekId: id,
      url: item.url.trim(),
      mediaType: item.mediaType,
      caption: item.caption?.trim() ?? null,
      sortOrder: item.sortOrder ?? i,
    })),
  });

  return Response.json(
    { message: `${created.count} media item(s) added` },
    { status: 201 }
  );
}
