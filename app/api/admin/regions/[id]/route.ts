import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";
import { NextRequest } from "next/server";

type Params = { params: Promise<{ id: string }> };

/**
 * GET /api/admin/regions/:id
 */
export async function GET(_req: NextRequest, { params }: Params) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { id } = await params;

  const region = await prisma.region.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      slug: true,
      imageUrl: true,
      isActive: true,
      createdAt: true,
      treks: {
        where: { deletedAt: null },
        select: {
          id: true,
          title: true,
          slug: true,
          difficulty: true,
          status: true,
          durationDays: true,
          pricePerPerson: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!region) {
    return Response.json({ error: "Region not found" }, { status: 404 });
  }

  return Response.json({ region });
}

/**
 * PUT /api/admin/regions/:id
 *
 * Updates a region. Body: { name?, imageUrl?, isActive? }
 */
export async function PUT(request: NextRequest, { params }: Params) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { id } = await params;

  let body: { name?: string; imageUrl?: string; isActive?: boolean };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const existing = await prisma.region.findUnique({
    where: { id },
    select: { id: true, name: true, slug: true },
  });
  if (!existing) {
    return Response.json({ error: "Region not found" }, { status: 404 });
  }

  const nameChanged = body.name && body.name.trim() !== existing.name;

  if (nameChanged) {
    const conflict = await prisma.region.findFirst({
      where: { name: body.name!.trim(), id: { not: id } },
      select: { id: true },
    });
    if (conflict) {
      return Response.json(
        { error: "A region with that name already exists" },
        { status: 409 }
      );
    }
  }

  const region = await prisma.region.update({
    where: { id },
    data: {
      ...(body.name !== undefined && {
        name: body.name.trim(),
        slug: body.name
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/\s+/g, "-")
          .replace(/-+/g, "-"),
      }),
      ...(body.imageUrl !== undefined && { imageUrl: body.imageUrl }),
      ...(body.isActive !== undefined && { isActive: body.isActive }),
    },
    select: {
      id: true,
      name: true,
      slug: true,
      imageUrl: true,
      isActive: true,
      createdAt: true,
    },
  });

  return Response.json({ region });
}

/**
 * DELETE /api/admin/regions/:id
 *
 * Hard-deletes a region. Blocked if the region has any treks attached.
 */
export async function DELETE(_req: NextRequest, { params }: Params) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { id } = await params;

  const region = await prisma.region.findUnique({
    where: { id },
    select: { id: true, _count: { select: { treks: true } } },
  });

  if (!region) {
    return Response.json({ error: "Region not found" }, { status: 404 });
  }

  if (region._count.treks > 0) {
    return Response.json(
      {
        error: `Cannot delete: ${region._count.treks} trek(s) are linked to this region. Reassign or delete them first.`,
      },
      { status: 409 }
    );
  }

  await prisma.region.delete({ where: { id } });

  return Response.json({ message: "Region deleted" });
}
