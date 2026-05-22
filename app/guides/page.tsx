import { createSupabaseServerClient } from "@/lib/supabase-server";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  Star,
  MapPin,
  Clock,
  BadgeCheck,
  Compass,
  ArrowRight,
  Mountain,
} from "lucide-react";
import Navbar from "@/components/navbar";

type Role = "TRAVELLER" | "GUIDE" | "ADMIN";

export default async function GuidesPage() {
  let authedUser: { fullName: string; avatarUrl: string | null; role: Role } | null = null;

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { fullName: true, avatarUrl: true, role: true },
      });
      if (dbUser) authedUser = { fullName: dbUser.fullName, avatarUrl: dbUser.avatarUrl, role: dbUser.role as Role };
    }
  } catch {
    // Show public page
  }

  const rawGuides = await prisma.guideProfile.findMany({
    where: {
      verificationStatus: "APPROVED",
      deletedAt: null,
      user: { isActive: true, deletedAt: null },
    },
    orderBy: { verifiedAt: "desc" },
    select: {
      id: true,
      bio: true,
      experienceYears: true,
      dailyRate: true,
      currency: true,
      specializations: true,
      languages: true,
      user: {
        select: { id: true, fullName: true, avatarUrl: true },
      },
      reviews: {
        where: { deletedAt: null },
        select: { rating: true },
      },
    },
  });

  const guides = rawGuides.map((g) => {
    const avgRating =
      g.reviews.length > 0
        ? Math.round(
            (g.reviews.reduce((s, r) => s + r.rating, 0) / g.reviews.length) *
              10
          ) / 10
        : null;
    return {
      id: g.id,
      bio: g.bio,
      experienceYears: g.experienceYears,
      dailyRate: Number(g.dailyRate),
      currency: g.currency,
      specializations: g.specializations,
      languages: g.languages,
      user: g.user,
      reviewCount: g.reviews.length,
      avgRating,
    };
  });

  function getInitials(name: string) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  const avatarColors = [
    "bg-emerald-500",
    "bg-sky-500",
    "bg-violet-500",
    "bg-orange-500",
    "bg-rose-500",
    "bg-teal-500",
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {authedUser ? (
        <Navbar user={authedUser} />
      ) : (
        <header className="sticky top-0 z-50 border-b bg-white/95 dark:bg-slate-900/95 backdrop-blur shadow-sm">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="flex h-16 items-center justify-between">
              <Link href="/" className="flex items-center gap-2">
                <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-emerald-50">
                  <Mountain className="h-5 w-5 text-emerald-600" />
                </div>
                <span className="font-bold text-lg tracking-tight">NepDiamond</span>
              </Link>
              <Link
                href="/auth/login"
                className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors shadow-sm"
              >
                Login <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </header>
      )}

      <main className="mx-auto max-w-5xl px-6 py-10 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Find a Guide
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            {guides.length > 0
              ? `${guides.length} verified guide${guides.length !== 1 ? "s" : ""} ready for your next trek`
              : "Guides will appear here once verified"}
          </p>
        </div>

        {/* Empty state */}
        {guides.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-700 py-20 text-center space-y-3">
            <Compass className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto" />
            <p className="text-base font-medium text-slate-600 dark:text-slate-400">
              No verified guides yet
            </p>
            <p className="text-sm text-slate-400 dark:text-slate-500 max-w-xs mx-auto">
              Our admin team is reviewing guide applications. Check back soon!
            </p>
          </div>
        )}

        {/* Guide grid */}
        {guides.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {guides.map((guide, i) => (
              <div
                key={guide.id}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col gap-4 hover:shadow-md hover:border-emerald-200 dark:hover:border-emerald-800 transition-all"
              >
                {/* Avatar + badge */}
                <div className="flex items-start justify-between">
                  {guide.user.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={guide.user.avatarUrl}
                      alt={guide.user.fullName}
                      className="h-14 w-14 rounded-full object-cover ring-2 ring-slate-100 dark:ring-slate-800"
                    />
                  ) : (
                    <div
                      className={`h-14 w-14 rounded-full ${avatarColors[i % avatarColors.length]} flex items-center justify-center text-white font-bold text-lg shrink-0`}
                    >
                      {getInitials(guide.user.fullName)}
                    </div>
                  )}
                  <span className="flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-900">
                    <BadgeCheck className="h-3 w-3" />
                    Verified
                  </span>
                </div>

                {/* Name */}
                <div className="space-y-0.5 min-w-0">
                  <h3 className="font-semibold text-slate-900 dark:text-white text-base leading-tight">
                    {guide.user.fullName}
                  </h3>
                  {guide.specializations.length > 0 && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 truncate">
                      <MapPin className="h-3 w-3 shrink-0" />
                      {guide.specializations[0]}
                    </p>
                  )}
                </div>

                {/* Bio */}
                {guide.bio && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {guide.bio}
                  </p>
                )}

                {/* Rating */}
                {guide.avgRating !== null ? (
                  <div className="flex items-center gap-1.5">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400 shrink-0" />
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {guide.avgRating}
                    </span>
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      ({guide.reviewCount} review
                      {guide.reviewCount !== 1 ? "s" : ""})
                    </span>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">No reviews yet</p>
                )}

                {/* Tags */}
                {guide.specializations.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {guide.specializations.slice(0, 3).map((spec) => (
                      <span
                        key={spec}
                        className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-md"
                      >
                        {spec}
                      </span>
                    ))}
                    {guide.specializations.length > 3 && (
                      <span className="text-xs text-slate-400">
                        +{guide.specializations.length - 3}
                      </span>
                    )}
                  </div>
                )}

                {/* Languages */}
                {guide.languages.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {guide.languages.slice(0, 3).map((lang) => (
                      <span
                        key={lang}
                        className="text-xs bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-md"
                      >
                        {lang}
                      </span>
                    ))}
                  </div>
                )}

                {/* Rate + exp */}
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mt-auto">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {guide.experienceYears} yrs exp
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    ${guide.dailyRate}
                    <span className="font-normal text-slate-400">/day</span>
                  </span>
                </div>

                {/* CTA */}
                <Link
                  href={`/guides/${guide.id}`}
                  className="w-full text-center text-sm font-medium rounded-lg border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 dark:hover:bg-emerald-600 dark:hover:text-white dark:hover:border-emerald-600 py-2 transition-all flex items-center justify-center gap-1.5"
                >
                  View Profile <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
