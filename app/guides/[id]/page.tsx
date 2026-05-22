import { createSupabaseServerClient } from "@/lib/supabase-server";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Navbar from "@/components/navbar";
import { Badge } from "@/components/ui/badge";
import {
  BadgeCheck,
  Star,
  Clock,
  Languages,
  MapPin,
  ChevronLeft,
} from "lucide-react";
import Link from "next/link";
import HireForm from "./hire-form";

export default async function GuideProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const [dbUser, guide] = await Promise.all([
    prisma.user.findUnique({
      where: { id: user.id },
      select: { fullName: true, avatarUrl: true, role: true },
    }),
    prisma.guideProfile.findUnique({
      where: { id: (await params).id },
      select: {
        id: true,
        bio: true,
        experienceYears: true,
        languages: true,
        dailyRate: true,
        currency: true,
        specializations: true,
        coverPhotoUrl: true,
        verificationStatus: true,
        verifiedAt: true,
        user: {
          select: { id: true, fullName: true, avatarUrl: true, createdAt: true },
        },
        reviews: {
          where: { deletedAt: null },
          select: {
            id: true,
            rating: true,
            comment: true,
            createdAt: true,
            reviewer: { select: { fullName: true, avatarUrl: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      },
    }),
  ]);

  if (!dbUser) redirect("/auth/login");
  if (!guide || guide.verificationStatus !== "APPROVED") notFound();

  const avgRating =
    guide.reviews.length > 0
      ? Math.round(
          (guide.reviews.reduce((s, r) => s + r.rating, 0) / guide.reviews.length) * 10
        ) / 10
      : null;

  const dailyRate = Number(guide.dailyRate);
  const canHire = dbUser.role === "TRAVELLER";

  const initials = guide.user.fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar
        user={{
          fullName: dbUser.fullName,
          avatarUrl: dbUser.avatarUrl,
          role: dbUser.role as "TRAVELLER" | "GUIDE" | "ADMIN",
        }}
      />

      <main className="mx-auto max-w-4xl px-4 sm:px-6 py-8 space-y-8">
        {/* Back */}
        <Link
          href="/guides"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" /> Back to Guides
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left — Profile card */}
          <div className="lg:col-span-2 space-y-6">
            {/* Hero */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-5">
              <div className="flex items-start gap-5">
                {guide.user.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={guide.user.avatarUrl}
                    alt={guide.user.fullName}
                    className="h-20 w-20 rounded-2xl object-cover ring-2 ring-slate-100 dark:ring-slate-800 shrink-0"
                  />
                ) : (
                  <div className="h-20 w-20 rounded-2xl bg-emerald-500 flex items-center justify-center text-white text-2xl font-bold shrink-0">
                    {initials}
                  </div>
                )}
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white">{guide.user.fullName}</h1>
                    <span className="flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-900">
                      <BadgeCheck className="h-3 w-3" /> Verified
                    </span>
                  </div>
                  {guide.specializations.length > 0 && (
                    <p className="text-sm text-slate-500 flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      {guide.specializations.join(" · ")}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-emerald-500" />
                      {guide.experienceYears} yrs experience
                    </span>
                    {avgRating !== null && (
                      <span className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        {avgRating} ({guide.reviews.length} review{guide.reviews.length !== 1 ? "s" : ""})
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {guide.bio && (
                <div>
                  <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">About</h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{guide.bio}</p>
                </div>
              )}

              {guide.languages.length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                    <Languages className="h-3.5 w-3.5" /> Languages
                  </h2>
                  <div className="flex flex-wrap gap-1.5">
                    {guide.languages.map((l) => (
                      <Badge key={l} variant="secondary" className="text-xs">{l}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {guide.specializations.length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Specializations</h2>
                  <div className="flex flex-wrap gap-1.5">
                    {guide.specializations.map((s) => (
                      <span key={s} className="text-xs bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 px-2.5 py-1 rounded-lg border border-emerald-100 dark:border-emerald-900">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Reviews */}
            {guide.reviews.length > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200">Reviews</h2>
                  {avgRating !== null && (
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      <span className="font-semibold text-sm">{avgRating}</span>
                      <span className="text-xs text-slate-400">({guide.reviews.length})</span>
                    </div>
                  )}
                </div>
                <div className="space-y-4 divide-y divide-slate-100 dark:divide-slate-800">
                  {guide.reviews.map((r) => {
                    const revInitials = r.reviewer.fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
                    return (
                      <div key={r.id} className="pt-4 first:pt-0 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            {r.reviewer.avatarUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={r.reviewer.avatarUrl} alt={r.reviewer.fullName} className="h-8 w-8 rounded-full object-cover" />
                            ) : (
                              <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-semibold text-slate-600 dark:text-slate-300">{revInitials}</div>
                            )}
                            <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{r.reviewer.fullName}</span>
                          </div>
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} className={`h-3.5 w-3.5 ${i < r.rating ? "fill-amber-400 text-amber-400" : "text-slate-200 dark:text-slate-700"}`} />
                            ))}
                          </div>
                        </div>
                        {r.comment && (
                          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{r.comment}</p>
                        )}
                        <p className="text-xs text-slate-400">{new Date(r.createdAt).toLocaleDateString()}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right — Hire card */}
          <div className="lg:col-span-1">
            <div className="sticky top-20">
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
                <div className="text-center pb-2 border-b border-slate-100 dark:border-slate-800">
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {dailyRate} <span className="text-base font-normal text-slate-500">{guide.currency}</span>
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">per day</p>
                </div>

                {canHire ? (
                  <HireForm
                    guideId={guide.id}
                    guideName={guide.user.fullName}
                    dailyRate={dailyRate}
                    currency={guide.currency}
                  />
                ) : (
                  <p className="text-sm text-center text-slate-500 dark:text-slate-400 py-2">
                    {dbUser.role === "GUIDE"
                      ? "Guides cannot hire other guides."
                      : "Sign in as a traveller to hire this guide."}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
