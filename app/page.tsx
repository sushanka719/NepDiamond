import { createSupabaseServerClient } from "@/lib/supabase-server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
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
} from "lucide-react";

export default async function Home() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true },
    });

    if (dbUser?.role === "ADMIN") redirect("/dashboard/admin");
    if (dbUser?.role === "GUIDE") redirect("/dashboard/guide");
    if (dbUser?.role === "TRAVELLER") redirect("/dashboard/traveller");
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col">
      {/* Public Navbar */}
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
              Get Started <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

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
                href="/auth/login"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 px-6 py-3 text-base font-semibold text-white transition-colors shadow-lg shadow-emerald-900/40"
              >
                Start Exploring <ArrowRight className="h-5 w-5" />
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

        {/* Features */}
        <section id="features" className="py-20 sm:py-28">
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
        <section id="how-it-works" className="py-20 bg-slate-50 dark:bg-slate-900/50">
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
                <div key={step} className="space-y-3 relative">
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
        <section id="for-guides" className="py-20 sm:py-28">
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
        <section className="py-20 bg-slate-50 dark:bg-slate-900/50">
          <div className="mx-auto max-w-2xl px-6 text-center space-y-6">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">
              Ready to explore Nepal?
            </h2>
            <p className="text-slate-500 dark:text-slate-400">
              Join thousands of travellers and guides on NepDiamond. Your Himalayan adventure starts here.
            </p>
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-8 py-3.5 text-base font-semibold text-white transition-colors shadow-lg shadow-emerald-900/20"
            >
              Get Started Free <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8 bg-white dark:bg-slate-950">
        <div className="mx-auto max-w-6xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <Mountain className="h-5 w-5 text-emerald-600" />
            <span className="font-semibold text-slate-700 dark:text-slate-300">NepDiamond</span>
          </div>
          <p>© {new Date().getFullYear()} NepDiamond. Built for Nepal&apos;s trekking community.</p>
        </div>
      </footer>
    </div>
  );
}
