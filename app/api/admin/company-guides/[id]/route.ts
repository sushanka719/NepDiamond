import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";
import { NextRequest } from "next/server";

type Params = { params: Promise<{ id: string }> };

/**
 * GET /api/admin/company-guides/:id
 */
export async function GET(_req: NextRequest, { params }: Params) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { id } = await params;

  const guide = await prisma.companyGuide.findUnique({
    where: { id, deletedAt: null },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      licenseNumber: true,
      experienceYears: true,
      languages: true,
      specializations: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      assignments: {
        select: {
          id: true,
          role: true,
          assignedAt: true,
          departure: {
            select: { id: true, departureDate: true, status: true, trek: { select: { id: true, title: true } } },
          },
        },
        orderBy: { assignedAt: "desc" },
      },
    },
  });

  if (!guide) return Response.json({ error: "Company guide not found" }, { status: 404 });

  return Response.json({ guide });
}

/**
 * PUT /api/admin/company-guides/:id
 * Update guide details.
 */
export async function PUT(request: NextRequest, { params }: Params) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { id } = await params;

  const existing = await prisma.companyGuide.findUnique({ where: { id, deletedAt: null }, select: { id: true, email: true } });
  if (!existing) return Response.json({ error: "Company guide not found" }, { status: 404 });

  let body: {
    fullName?: string;
    email?: string;
    phone?: string;
    licenseNumber?: string;
    experienceYears?: number;
    languages?: string[];
    specializations?: string[];
    isActive?: boolean;
  };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (body.email && body.email !== existing.email) {
    const conflict = await prisma.companyGuide.findUnique({ where: { email: body.email }, select: { id: true } });
    if (conflict && conflict.id !== id) {
      return Response.json({ error: "A guide with that email already exists" }, { status: 409 });
    }
  }

  const guide = await prisma.companyGuide.update({
    where: { id },
    data: {
      ...(body.fullName !== undefined && { fullName: body.fullName.trim() }),
      ...(body.email !== undefined && { email: body.email }),
      ...(body.phone !== undefined && { phone: body.phone }),
      ...(body.licenseNumber !== undefined && { licenseNumber: body.licenseNumber }),
      ...(body.experienceYears !== undefined && { experienceYears: body.experienceYears }),
      ...(body.languages !== undefined && { languages: body.languages }),
      ...(body.specializations !== undefined && { specializations: body.specializations }),
      ...(body.isActive !== undefined && { isActive: body.isActive }),
    },
    select: { id: true, fullName: true, email: true, phone: true, licenseNumber: true, experienceYears: true, languages: true, specializations: true, isActive: true, updatedAt: true },
  });

  return Response.json({ guide });
}

/**
 * DELETE /api/admin/company-guides/:id
 * Soft-delete a company guide.
 */
export async function DELETE(_req: NextRequest, { params }: Params) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { id } = await params;

  const guide = await prisma.companyGuide.findUnique({ where: { id }, select: { id: true, deletedAt: true } });
  if (!guide) return Response.json({ error: "Company guide not found" }, { status: 404 });
  if (guide.deletedAt) return Response.json({ error: "Guide already deleted" }, { status: 409 });

  await prisma.companyGuide.update({ where: { id }, data: { deletedAt: new Date(), isActive: false } });

  return Response.json({ message: "Company guide deleted" });
}
