import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";
import { NextRequest } from "next/server";

type Params = { params: Promise<{ id: string; mediaId: string }> };

/**
 * PUT /api/admin/treks/:id/media/:mediaId
 *
 * Updates a media item's caption or sort order.
 * Body: { caption?, sortOrder? }
 */
export async function PUT(request: NextRequest, { params }: Params) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { id, mediaId } = await params;

  const media = await prisma.trekMedia.findUnique({
    where: { id: mediaId },
    select: { id: true, trekId: true },
  });

  if (!media || media.trekId !== id) {
    return Response.json({ error: "Media item not found" }, { status: 404 });
  }

  let body: { caption?: string; sortOrder?: number };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const updated = await prisma.trekMedia.update({
    where: { id: mediaId },
    data: {
      ...(body.caption !== undefined && { caption: body.caption.trim() }),
      ...(body.sortOrder !== undefined && { sortOrder: body.sortOrder }),
    },
    select: {
      id: true,
      url: true,
      mediaType: true,
      caption: true,
      sortOrder: true,
    },
  });

  return Response.json({ media: updated });
}

/**
 * DELETE /api/admin/treks/:id/media/:mediaId
 *
 * Removes a media item from a trek.
 */
export async function DELETE(_req: NextRequest, { params }: Params) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { id, mediaId } = await params;

  const media = await prisma.trekMedia.findUnique({
    where: { id: mediaId },
    select: { id: true, trekId: true },
  });

  if (!media || media.trekId !== id) {
    return Response.json({ error: "Media item not found" }, { status: 404 });
  }

  await prisma.trekMedia.delete({ where: { id: mediaId } });

  return Response.json({ message: "Media item removed" });
}
