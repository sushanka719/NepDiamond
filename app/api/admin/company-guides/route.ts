import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";
import { NextRequest } from "next/server";

/**
 * GET /api/admin/company-guides
 * List all company guides.
 *
 * Query: page, limit, search, isActive (true|false)
 */
export async function GET(request: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { searchParams } = request.nextUrl;
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 20)));
  const skip = (page - 1) * limit;
  const search = searchParams.get("search");
  const isActiveParam = searchParams.get("isActive");

  const where = {
    deletedAt: null,
    ...(isActiveParam !== null && { isActive: isActiveParam === "true" }),
    ...(search && {
      OR: [
        { fullName: { contains: search, mode: "insensitive" as const } },
        { email: { contains: search, mode: "insensitive" as const } },
      ],
    }),
  };

  const [guides, total] = await Promise.all([
    prisma.companyGuide.findMany({
      where,
      skip,
      take: limit,
      orderBy: { fullName: "asc" },
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
        _count: { select: { assignments: true } },
      },
    }),
    prisma.companyGuide.count({ where }),
  ]);

  return Response.json({ items: guides, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } });
}

/**
 * POST /api/admin/company-guides
 * Create a new company guide.
 *
 * Body: { fullName, email?, phone?, licenseNumber?, experienceYears?, languages?, specializations? }
 */
export async function POST(request: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  let body: {
    fullName?: string;
    email?: string;
    phone?: string;
    licenseNumber?: string;
    experienceYears?: number;
    languages?: string[];
    specializations?: string[];
  };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.fullName?.trim()) return Response.json({ error: "fullName is required" }, { status: 400 });

  if (body.email) {
    const conflict = await prisma.companyGuide.findUnique({ where: { email: body.email }, select: { id: true } });
    if (conflict) return Response.json({ error: "A guide with that email already exists" }, { status: 409 });
  }

  const guide = await prisma.companyGuide.create({
    data: {
      fullName: body.fullName.trim(),
      email: body.email ?? null,
      phone: body.phone ?? null,
      licenseNumber: body.licenseNumber ?? null,
      experienceYears: body.experienceYears ?? 0,
      languages: body.languages ?? [],
      specializations: body.specializations ?? [],
    },
    select: { id: true, fullName: true, email: true, phone: true, licenseNumber: true, experienceYears: true, languages: true, specializations: true, isActive: true, createdAt: true },
  });

  return Response.json({ guide }, { status: 201 });
}
