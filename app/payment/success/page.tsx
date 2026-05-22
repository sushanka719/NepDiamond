import { createSupabaseServerClient } from "@/lib/supabase-server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/navbar";
import { CheckCircle2, CalendarDays, ArrowRight } from "lucide-react";

export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; id?: string }>;
}) {
  const { type, id } = await searchParams;

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { fullName: true, avatarUrl: true, role: true },
  });
  if (!dbUser) redirect("/auth/login");

  let title = "";
  let subtitle = "";
  let detailHref = "/dashboard/traveller";
  let detailLabel = "Go to Dashboard";

  if (type === "booking" && id) {
    const booking = await prisma.trekBooking.findUnique({
      where: { id, userId: user.id },
      select: {
        departure: {
          select: {
            departureDate: true,
            trek: { select: { title: true, slug: true } },
          },
        },
      },
    });
    if (booking) {
      title = booking.departure.trek.title;
      subtitle = `Departure on ${new Date(booking.departure.departureDate).toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}`;
      detailHref = "/dashboard/traveller/bookings";
      detailLabel = "View My Bookings";
    }
  }

  if (type === "hire" && id) {
    const hire = await prisma.guideHire.findUnique({
      where: { id, requesterId: user.id },
      select: {
        startDate: true,
        endDate: true,
        guide: { select: { user: { select: { fullName: true } } } },
      },
    });
    if (hire) {
      title = `Guide: ${hire.guide.user.fullName}`;
      subtitle = `${new Date(hire.startDate).toLocaleDateString("en-US", { day: "numeric", month: "short" })} – ${new Date(hire.endDate).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}`;
      detailHref = "/dashboard/traveller/hires";
      detailLabel = "View My Hires";
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar
        user={{
          fullName: dbUser.fullName,
          avatarUrl: dbUser.avatarUrl,
          role: dbUser.role as "TRAVELLER" | "GUIDE" | "ADMIN",
        }}
      />
      <main className="flex items-center justify-center min-h-[calc(100vh-4rem)] px-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl p-8 max-w-md w-full text-center space-y-5">
          <div className="flex items-center justify-center">
            <div className="h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <CheckCircle2 className="h-9 w-9 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <div className="space-y-1">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Payment Successful!</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Your payment has been confirmed.</p>
          </div>
          {title && (
            <div className="rounded-xl bg-slate-50 dark:bg-slate-800 px-4 py-3 text-left space-y-1">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{title}</p>
              {subtitle && (
                <p className="text-xs text-slate-500 flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5 text-emerald-500" />
                  {subtitle}
                </p>
              )}
            </div>
          )}
          <div className="flex flex-col gap-2 pt-1">
            <Link
              href={detailHref}
              className="flex items-center justify-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-4 py-2.5 text-sm font-medium text-white transition-colors"
            >
              {detailLabel} <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/" className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
              Back to Home
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
