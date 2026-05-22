import { createSupabaseServerClient } from "@/lib/supabase-server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Star, MapPin, Clock, ArrowRight, BadgeCheck } from "lucide-react";
import Navbar from "@/components/navbar";

const MOCK_GUIDES = [
  {
    id: 1,
    name: "Pemba Sherpa",
    location: "Namche Bazaar, Khumbu",
    experience: 12,
    rate: 60,
    currency: "USD",
    rating: 4.9,
    reviews: 87,
    specializations: ["Everest Base Camp", "High Altitude"],
    initials: "PS",
    color: "bg-emerald-500",
    verified: true,
  },
  {
    id: 2,
    name: "Rajesh Tamang",
    location: "Pokhara, Gandaki",
    experience: 8,
    rate: 45,
    currency: "USD",
    rating: 4.7,
    reviews: 53,
    specializations: ["Annapurna Circuit", "Photography"],
    initials: "RT",
    color: "bg-sky-500",
    verified: true,
  },
  {
    id: 3,
    name: "Kami Dorje",
    location: "Syabrubesi, Langtang",
    experience: 5,
    rate: 35,
    currency: "USD",
    rating: 4.6,
    reviews: 31,
    specializations: ["Langtang Valley", "Culture"],
    initials: "KD",
    color: "bg-violet-500",
    verified: true,
  },
  {
    id: 4,
    name: "Binod Gurung",
    location: "Arughat, Gorkha",
    experience: 10,
    rate: 50,
    currency: "USD",
    rating: 4.8,
    reviews: 69,
    specializations: ["Manaslu Circuit", "Remote Treks"],
    initials: "BG",
    color: "bg-orange-500",
    verified: true,
  },
];

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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar
        user={{
          fullName: dbUser.fullName,
          avatarUrl: dbUser.avatarUrl,
          role: "TRAVELLER",
        }}
      />

      <main className="mx-auto max-w-5xl px-6 py-10 space-y-8">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {MOCK_GUIDES.map((guide) => (
              <div
                key={guide.id}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col gap-4 hover:shadow-md hover:border-emerald-200 dark:hover:border-emerald-800 transition-all group"
              >
                {/* Avatar + badge */}
                <div className="flex items-start justify-between">
                  <div
                    className={`h-14 w-14 rounded-full ${guide.color} flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-sm`}
                  >
                    {guide.initials}
                  </div>
                  {guide.verified && (
                    <span className="flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-900">
                      <BadgeCheck className="h-3 w-3" />
                      Verified
                    </span>
                  )}
                </div>

                {/* Name + location */}
                <div className="space-y-0.5 min-w-0">
                  <h3 className="font-semibold text-slate-900 dark:text-white text-sm leading-tight truncate">
                    {guide.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 truncate">
                    <MapPin className="h-3 w-3 shrink-0" />
                    {guide.location}
                  </p>
                </div>

                {/* Rating */}
                <div className="flex items-center gap-1.5">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400 shrink-0" />
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {guide.rating}
                  </span>
                  <span className="text-xs text-slate-400 dark:text-slate-500">
                    ({guide.reviews} reviews)
                  </span>
                </div>

                {/* Specializations */}
                <div className="flex flex-wrap gap-1">
                  {guide.specializations.map((spec) => (
                    <span
                      key={spec}
                      className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-md"
                    >
                      {spec}
                    </span>
                  ))}
                </div>

                {/* Rate + experience */}
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mt-auto">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {guide.experience} yrs exp
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    ${guide.rate}
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
        </section>
      </main>
    </div>
  );
}
