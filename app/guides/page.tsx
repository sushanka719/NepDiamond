import { createSupabaseServerClient } from "@/lib/supabase-server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Compass } from "lucide-react";
import Navbar from "@/components/navbar";

export default async function GuidesPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { fullName: true, avatarUrl: true, role: true },
  });

  if (!dbUser) redirect("/auth/login");

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar
        user={{
          fullName: dbUser.fullName,
          avatarUrl: dbUser.avatarUrl,
          role: dbUser.role as "TRAVELLER" | "GUIDE" | "ADMIN",
        }}
      />

      <main className="mx-auto max-w-5xl px-6 py-16">
        <div className="flex flex-col items-center justify-center text-center space-y-4 py-20">
          <div className="h-16 w-16 rounded-full bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center">
            <Compass className="h-8 w-8 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Guide Directory
          </h1>
          <p className="text-slate-500 dark:text-slate-400 max-w-sm">
            Full guide listings coming soon. You&apos;ll be able to filter by
            specialization, location, price, and rating.
          </p>
        </div>
      </main>
    </div>
  );
}
