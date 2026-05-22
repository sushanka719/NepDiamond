import { createSupabaseServerClient } from "@/lib/supabase-server";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  Mountain,
  Compass,
  Users,
  ShieldCheck,
  Star,
  MapPin,
  ArrowRight,
  CheckCircle,
  BadgeCheck,
  Clock,
  ChevronRight,
  CalendarDays,
  DollarSign,
  Mail,
  Phone,
} from "lucide-react";
import Navbar from "@/components/navbar";

type Role = "TRAVELLER" | "GUIDE" | "ADMIN";

export default async function Home() {
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
      if (dbUser?.role) {
        authedUser = dbUser as { fullName: string; avatarUrl: string | null; role: Role };
      }
    }
  } catch {
    // Auth check failed — show public landing
  }

  // Fetch 5 featured guides for the carousel
  const rawGuides = await prisma.guideProfile.findMany({
    where: {
      verificationStatus: "APPROVED",
      deletedAt: null,
      user: { isActive: true, deletedAt: null },
    },
    take: 5,
    orderBy: { verifiedAt: "desc" },
    select: {
      id: true,
      experienceYears: true,
      dailyRate: true,
      currency: true,
      specializations: true,
      languages: true,
      user: { select: { fullName: true, avatarUrl: true } },
      reviews: { where: { deletedAt: null }, select: { rating: true } },
    },
  });

  const guides = rawGuides.map((g) => {
    const avgRating =
      g.reviews.length > 0
        ? Math.round(
            (g.reviews.reduce((s, r) => s + r.rating, 0) / g.reviews.length) * 10
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

  // Fetch 4 upcoming departures
  const rawDepartures = await prisma.trekDeparture.findMany({
    where: {
      deletedAt: null,
      status: { in: ["SCHEDULED", "FULL"] },
      trek: { deletedAt: null },
    },
    take: 4,
    orderBy: { departureDate: "asc" },
    select: {
      id: true,
      departureDate: true,
      pricePerPerson: true,
      maxParticipants: true,
      status: true,
      currency: true,
      trek: {
        select: {
          title: true,
          slug: true,
          difficulty: true,
          durationDays: true,
          coverImageUrl: true,
          region: { select: { name: true } },
        },
      },
      _count: { select: { bookings: true } },
    },
  });

  const departures = rawDepartures.map((d) => ({
    ...d,
    pricePerPerson: Number(d.pricePerPerson),
    departureDate: d.departureDate.toISOString(),
  }));

  const DIFFICULTY_COLORS: Record<string, string> = {
    EASY: "bg-green-100 text-green-800",
    MODERATE: "bg-yellow-100 text-yellow-800",
    STRENUOUS: "bg-orange-100 text-orange-800",
    EXTREME: "bg-red-100 text-red-800",
  };

  const avatarColors = [
    "bg-emerald-500",
    "bg-sky-500",
    "bg-violet-500",
    "bg-orange-500",
    "bg-rose-500",
  ];

  function getInitials(name: string) {
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col">
      {authedUser ? (
        <Navbar user={authedUser} />
      ) : (
        <header className="sticky top-0 z-50 border-b bg-white/95 dark:bg-slate-900/95 backdrop-blur shadow-sm">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="flex h-16 items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-emerald-50">
                  <Mountain className="h-5 w-5 text-emerald-600" />
                </div>
                <span className="font-bold text-lg tracking-tight">NepDiamond</span>
              </div>
              <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-400">
                <a href="#features" className="hover:text-emerald-600 transition-colors">Features</a>
                <a href="#how-it-works" className="hover:text-emerald-600 transition-colors">How it works</a>
                <a href="#for-guides" className="hover:text-emerald-600 transition-colors">For Guides</a>
              </nav>
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

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-b from-emerald-950 via-slate-900 to-slate-950 text-white py-24 sm:py-36">
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `radial-gradient(circle at 20% 50%, #10b981 0%, transparent 50%),
                                radial-gradient(circle at 80% 20%, #0d9488 0%, transparent 40%)`,
            }}
          />
          <div className="relative mx-auto max-w-4xl px-6 text-center space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-950/50 px-4 py-1.5 text-xs font-medium text-emerald-400">
              <MapPin className="h-3.5 w-3.5" /> Nepal&apos;s Premier Trekking Platform
            </div>
            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight">
              Discover Nepal&apos;s{" "}
              <span className="text-emerald-400">Hidden Gems</span>
            </h1>
            <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Connect with verified local guides, explore breathtaking trekking routes,
              and create unforgettable Himalayan adventures — all in one place.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/guides"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 px-6 py-3 text-base font-semibold text-white transition-colors shadow-lg shadow-emerald-900/40"
              >
                Browse Guides <ArrowRight className="h-5 w-5" />
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/20 bg-white/5 hover:bg-white/10 px-6 py-3 text-base font-semibold text-white transition-colors"
              >
                How it works
              </a>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="border-y bg-emerald-50 dark:bg-emerald-950/20">
          <div className="mx-auto max-w-4xl px-6 py-10">
            <dl className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
              {[
                { label: "Verified Guides", value: "50+", icon: ShieldCheck },
                { label: "Trekking Routes", value: "120+", icon: Compass },
                { label: "Happy Travellers", value: "2,000+", icon: Star },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="space-y-1">
                  <Icon className="h-6 w-6 text-emerald-600 mx-auto" />
                  <p className="text-3xl font-extrabold text-slate-900 dark:text-white">{value}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* Featured Guides Carousel */}
        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-6 space-y-8">
            <div className="flex items-end justify-between">
              <div className="space-y-1">
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                  Meet Our Guides
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  Verified local experts ready to lead your Himalayan adventure
                </p>
              </div>
              <Link
                href="/guides"
                className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors"
              >
                View all <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            {guides.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-700 py-16 text-center space-y-3">
                <Compass className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto" />
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Guides coming soon
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  {guides.map((guide, i) => (
                    <div
                      key={guide.id}
                      className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col gap-3 hover:shadow-md hover:border-emerald-200 dark:hover:border-emerald-800 transition-all"
                    >
                      <div className="flex items-start justify-between">
                        {guide.user.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={guide.user.avatarUrl}
                            alt={guide.user.fullName}
                            className="h-12 w-12 rounded-full object-cover ring-2 ring-slate-100 dark:ring-slate-800"
                          />
                        ) : (
                          <div
                            className={`h-12 w-12 rounded-full ${avatarColors[i % avatarColors.length]} flex items-center justify-center text-white font-bold text-base shrink-0`}
                          >
                            {getInitials(guide.user.fullName)}
                          </div>
                        )}
                        <span className="flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-900">
                          <BadgeCheck className="h-3 w-3" />
                          Verified
                        </span>
                      </div>

                      <div className="min-w-0">
                        <h3 className="font-semibold text-slate-900 dark:text-white text-sm leading-tight truncate">
                          {guide.user.fullName}
                        </h3>
                        {guide.specializations.length > 0 && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 truncate mt-0.5">
                            <MapPin className="h-3 w-3 shrink-0" />
                            {guide.specializations[0]}
                          </p>
                        )}
                      </div>

                      {guide.avgRating !== null ? (
                        <div className="flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400 shrink-0" />
                          <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                            {guide.avgRating}
                          </span>
                          <span className="text-xs text-slate-400">({guide.reviewCount})</span>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400">No reviews yet</p>
                      )}

                      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mt-auto">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {guide.experienceYears} yrs
                        </span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          ${guide.dailyRate}
                          <span className="font-normal text-slate-400">/day</span>
                        </span>
                      </div>

                      <Link
                        href={`/guides/${guide.id}`}
                        className="w-full text-center text-xs font-medium rounded-lg border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 dark:hover:bg-emerald-600 dark:hover:text-white dark:hover:border-emerald-600 py-1.5 transition-all"
                      >
                        View Profile
                      </Link>
                    </div>
                  ))}
                </div>

                <div className="flex justify-center pt-2">
                  <Link
                    href="/guides"
                    className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-2.5 text-sm transition-colors shadow-sm"
                  >
                    View More Guides <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </>
            )}
          </div>
        </section>

        {/* Upcoming Departures */}
        <section className="py-16 sm:py-20 bg-slate-50 dark:bg-slate-900/50">
          <div className="mx-auto max-w-6xl px-6 space-y-8">
            <div className="flex items-end justify-between">
              <div className="space-y-1">
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                  Upcoming Treks
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  Group departures with fixed dates — book your seat now
                </p>
              </div>
              <Link
                href="/treks"
                className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors"
              >
                View all <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            {departures.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-700 py-16 text-center space-y-3">
                <Mountain className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto" />
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  No upcoming departures at the moment
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {departures.map((d: typeof departures[number]) => {
                    const spotsLeft = d.maxParticipants - d._count.bookings;
                    const isFull = d.status === "FULL";
                    return (
                      <div
                        key={d.id}
                        className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col hover:shadow-md hover:border-emerald-200 dark:hover:border-emerald-800 transition-all"
                      >
                        {/* Cover image */}
                        <div className="h-36 bg-slate-100 dark:bg-slate-800 overflow-hidden relative">
                          {d.trek.coverImageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={d.trek.coverImageUrl}
                              alt={d.trek.title}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full flex items-center justify-center">
                              <Mountain className="h-8 w-8 text-slate-400" />
                            </div>
                          )}
                          {/* Spots badge */}
                          <span className={`absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isFull
                              ? "bg-amber-100 text-amber-700"
                              : "bg-emerald-100 text-emerald-700"
                          }`}>
                            {isFull ? "Full" : `${spotsLeft} spots left`}
                          </span>
                        </div>

                        <div className="p-4 flex flex-col gap-2 flex-1">
                          <div className="flex items-start justify-between gap-1">
                            <h3 className="font-semibold text-slate-900 dark:text-white text-sm leading-snug line-clamp-2 flex-1">
                              {d.trek.title}
                            </h3>
                          </div>

                          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                            <MapPin className="h-3 w-3 shrink-0" />
                            {d.trek.region.name}
                          </p>

                          <span className={`self-start text-[10px] font-semibold px-2 py-0.5 rounded-full ${DIFFICULTY_COLORS[d.trek.difficulty]}`}>
                            {d.trek.difficulty}
                          </span>

                          <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-auto pt-1">
                            <span className="flex items-center gap-1">
                              <CalendarDays className="h-3 w-3 shrink-0" />
                              {new Date(d.departureDate).toLocaleDateString("en-US", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </span>
                            <span className="flex items-center gap-1 ml-auto font-semibold text-slate-800 dark:text-slate-200">
                              <DollarSign className="h-3 w-3" />
                              {d.pricePerPerson.toLocaleString()}
                            </span>
                          </div>

                          <Link
                            href={`/treks/${d.trek.slug}`}
                            className="mt-1 w-full text-center text-xs font-medium rounded-lg border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 dark:hover:bg-emerald-600 dark:hover:text-white dark:hover:border-emerald-600 py-1.5 transition-all"
                          >
                            View &amp; Book
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-center pt-2">
                  <Link
                    href="/treks"
                    className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-2.5 text-sm transition-colors shadow-sm"
                  >
                    View All Treks <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </>
            )}
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-20 sm:py-28 bg-slate-50 dark:bg-slate-900/50">
          <div className="mx-auto max-w-5xl px-6 space-y-14">
            <div className="text-center space-y-3">
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">
                Everything you need for the perfect trek
              </h2>
              <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
                From planning to summiting, NepDiamond handles every step of your Himalayan journey.
              </p>
            </div>
            <div className="grid sm:grid-cols-3 gap-6">
              {[
                {
                  icon: Compass,
                  title: "Curated Routes",
                  description:
                    "Browse hundreds of trekking routes with difficulty ratings, duration, and seasonal guides.",
                  color: "text-sky-600",
                  bg: "bg-sky-50 dark:bg-sky-950/30",
                },
                {
                  icon: Users,
                  title: "Verified Guides",
                  description:
                    "Every guide is background-checked and reviewed by our admin team before you can hire them.",
                  color: "text-emerald-600",
                  bg: "bg-emerald-50 dark:bg-emerald-950/30",
                },
                {
                  icon: ShieldCheck,
                  title: "Safe Bookings",
                  description:
                    "Secure payments, transparent pricing, and 24/7 support throughout your adventure.",
                  color: "text-violet-600",
                  bg: "bg-violet-50 dark:bg-violet-950/30",
                },
              ].map(({ icon: Icon, title, description, color, bg }) => (
                <div
                  key={title}
                  className="rounded-xl border bg-white dark:bg-slate-900 p-6 space-y-4 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className={`inline-flex h-11 w-11 items-center justify-center rounded-lg ${bg}`}>
                    <Icon className={`h-5 w-5 ${color}`} />
                  </div>
                  <h3 className="font-semibold text-slate-900 dark:text-white text-lg">{title}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="py-20">
          <div className="mx-auto max-w-4xl px-6 space-y-12">
            <div className="text-center space-y-3">
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">
                Your journey in 3 simple steps
              </h2>
            </div>
            <div className="grid sm:grid-cols-3 gap-8 text-center">
              {[
                {
                  step: "01",
                  title: "Create your account",
                  description: "Sign up with Google in seconds and choose your role — Traveller or Guide.",
                },
                {
                  step: "02",
                  title: "Find your route & guide",
                  description: "Browse curated treks and connect with a verified local guide who fits your style.",
                },
                {
                  step: "03",
                  title: "Trek & experience Nepal",
                  description: "Book your guide, plan your itinerary, and head into the Himalayas with confidence.",
                },
              ].map(({ step, title, description }) => (
                <div key={step} className="space-y-3">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-white font-bold text-lg mx-auto">
                    {step}
                  </div>
                  <h3 className="font-semibold text-slate-900 dark:text-white text-base">{title}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* For Guides */}
        <section id="for-guides" className="py-20 sm:py-28 bg-slate-50 dark:bg-slate-900/50">
          <div className="mx-auto max-w-5xl px-6">
            <div className="rounded-2xl bg-gradient-to-r from-emerald-900 to-teal-900 p-8 sm:p-12 grid sm:grid-cols-2 gap-8 items-center">
              <div className="space-y-5 text-white">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-emerald-300">
                  <ShieldCheck className="h-3.5 w-3.5" /> For Professional Guides
                </div>
                <h2 className="text-3xl font-bold leading-tight">
                  Grow your guiding business with NepDiamond
                </h2>
                <p className="text-emerald-100/80 text-sm leading-relaxed">
                  Join our network of verified guides. Set your own rates, manage bookings,
                  and reach thousands of travellers looking for authentic Nepal experiences.
                </p>
                <Link
                  href="/auth/login"
                  className="inline-flex items-center gap-2 rounded-lg bg-white text-emerald-900 font-semibold px-5 py-2.5 text-sm hover:bg-emerald-50 transition-colors"
                >
                  Join as a Guide <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <ul className="space-y-3">
                {[
                  "Verified badge displayed on your profile",
                  "Manage your availability and schedule",
                  "Transparent earnings dashboard",
                  "Dedicated support for guides",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-emerald-100">
                    <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20">
          <div className="mx-auto max-w-2xl px-6 text-center space-y-6">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">
              Ready to explore Nepal?
            </h2>
            <p className="text-slate-500 dark:text-slate-400">
              Join thousands of travellers and guides on NepDiamond. Your Himalayan adventure starts here.
            </p>
            <Link
              href={authedUser ? "/guides" : "/auth/login"}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-8 py-3.5 text-base font-semibold text-white transition-colors shadow-lg shadow-emerald-900/20"
            >
              {authedUser ? "Browse Guides" : "Get Started Free"} <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300">
        {/* Main footer grid */}
        <div className="mx-auto max-w-6xl px-6 py-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand column */}
          <div className="lg:col-span-1 flex flex-col gap-5">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600">
                <Mountain className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">NepDiamond</span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Nepal&apos;s premier trekking platform — connecting adventurers with verified local guides for unforgettable Himalayan journeys.
            </p>
            {/* Social links */}
            <div className="flex items-center gap-3">
              {[
                {
                  label: "Instagram",
                  svg: (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                    </svg>
                  ),
                },
                {
                  label: "Twitter / X",
                  svg: (
                    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  ),
                },
                {
                  label: "LinkedIn",
                  svg: (
                    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/>
                    </svg>
                  ),
                },
                {
                  label: "YouTube",
                  svg: (
                    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.4a2.78 2.78 0 0 0 1.95-1.97A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="white"/>
                    </svg>
                  ),
                },
              ].map(({ label, svg }) => (
                <a
                  key={label}
                  href="#"
                  aria-label={label}
                  className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-800 text-slate-400 hover:bg-emerald-600 hover:text-white transition-colors"
                >
                  {svg}
                </a>
              ))}
            </div>
          </div>

          {/* Explore column */}
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Explore</h3>
            <ul className="flex flex-col gap-2.5 text-sm">
              {[
                { label: "All Treks", href: "/treks" },
                { label: "Find a Guide", href: "/guides" },
                { label: "Trek Planner", href: "/dashboard/traveller/planner" },
                { label: "Regions", href: "/treks" },
                { label: "Upcoming Departures", href: "/treks" },
              ].map(({ label, href }) => (
                <li key={label}>
                  <Link href={href} className="text-slate-400 hover:text-emerald-400 transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* For Guides column */}
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">For Guides</h3>
            <ul className="flex flex-col gap-2.5 text-sm">
              {[
                { label: "Become a Guide", href: "/auth/login" },
                { label: "Guide Dashboard", href: "/dashboard/guide" },
                { label: "Manage Schedule", href: "/dashboard/guide/schedule" },
                { label: "Track Earnings", href: "/dashboard/guide/earnings" },
                { label: "Verification", href: "/auth/guide-profile" },
              ].map(({ label, href }) => (
                <li key={label}>
                  <Link href={href} className="text-slate-400 hover:text-emerald-400 transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact column */}
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Contact</h3>
            <ul className="flex flex-col gap-3 text-sm">
              <li className="flex items-start gap-2.5 text-slate-400">
                <MapPin className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                <span>Thamel, Kathmandu<br />Nepal</span>
              </li>
              <li className="flex items-center gap-2.5 text-slate-400">
                <Mail className="h-4 w-4 text-emerald-500 shrink-0" />
                <a href="mailto:hello@nepdiamond.com" className="hover:text-emerald-400 transition-colors">
                  hello@nepdiamond.com
                </a>
              </li>
              <li className="flex items-center gap-2.5 text-slate-400">
                <Phone className="h-4 w-4 text-emerald-500 shrink-0" />
                <a href="tel:+97714567890" className="hover:text-emerald-400 transition-colors">
                  +977 1 456 7890
                </a>
              </li>
            </ul>
            {/* Trust badge */}
            <div className="mt-2 flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-xs text-slate-400">
              <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
              <span>All guides are verified &amp; background-checked</span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-800" />

        {/* Bottom bar */}
        <div className="mx-auto max-w-6xl px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} NepDiamond. Built for Nepal&apos;s trekking community.</p>
          <div className="flex items-center gap-5">
            {["Privacy Policy", "Terms of Service", "Cookie Policy"].map((item) => (
              <a key={item} href="#" className="hover:text-slate-300 transition-colors">
                {item}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
