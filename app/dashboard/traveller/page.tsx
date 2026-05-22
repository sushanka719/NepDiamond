import { createSupabaseServerClient } from "@/lib/supabase-server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Star, MapPin, Clock, ArrowRight, BadgeCheck, Compass } from "lucide-react";

export default async function TravellerDashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { fullName: true, email: true, avatarUrl: true, role: true },
  });

  if (!dbUser) redirect("/auth/login");
  if (dbUser.role !== "TRAVELLER") redirect("/dashboard/guide");

  const rawGuides = await prisma.guideProfile.findMany({
    where: {
      verificationStatus: "APPROVED",
      deletedAt: null,
      user: { isActive: true, deletedAt: null },
    },
    take: 4,
    orderBy: { verifiedAt: "desc" },
    select: {
      id: true,
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
  ];

  return (
    <div className="space-y-8">
        {/* Welcome */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Welcome back, {dbUser.fullName.split(" ")[0]}!
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Discover Nepal&apos;s finest trekking guides for your next adventure.
          </p>
        </div>

        {/* Featured Guides */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
              Featured Guides
            </h2>
            <Link
              href="/guides"
              className="text-sm font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 flex items-center gap-1 transition-colors"
            >
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {guides.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-700 py-16 text-center space-y-3">
              <Compass className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto" />
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                No verified guides yet
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Check back soon — guides are being reviewed and approved.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {guides.map((guide, i) => (
                  <div
                    key={guide.id}
                    className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col gap-4 hover:shadow-md hover:border-emerald-200 dark:hover:border-emerald-800 transition-all group"
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
                          className={`h-14 w-14 rounded-full ${avatarColors[i % avatarColors.length]} flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-sm`}
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
                      <h3 className="font-semibold text-slate-900 dark:text-white text-sm leading-tight truncate">
                        {guide.user.fullName}
                      </h3>
                      {guide.specializations.length > 0 && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 truncate">
                          <MapPin className="h-3 w-3 shrink-0" />
                          {guide.specializations[0]}
                        </p>
                      )}
                    </div>

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

                    {/* Specialization tags */}
                    {guide.specializations.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {guide.specializations.slice(0, 2).map((spec) => (
                          <span
                            key={spec}
                            className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-md"
                          >
                            {spec}
                          </span>
                        ))}
                        {guide.specializations.length > 2 && (
                          <span className="text-xs text-slate-400">
                            +{guide.specializations.length - 2}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Rate + experience */}
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
                      className="w-full text-center text-sm font-medium rounded-lg border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 dark:hover:bg-emerald-600 dark:hover:text-white dark:hover:border-emerald-600 py-2 transition-all"
                    >
                      View Profile
                    </Link>
                  </div>
                ))}
              </div>

              {/* View More button */}
              <div className="flex justify-center pt-2">
                <Link
                  href="/guides"
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-2.5 text-sm transition-colors shadow-sm"
                >
                  View More Guides
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </>
          )}
        </section>
    </div>
  );
}
