import { createSupabaseServerClient } from "@/lib/supabase-server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Navbar from "@/components/navbar";
import DashboardSidebar from "@/components/dashboard-sidebar";

type Role = "ADMIN" | "GUIDE" | "TRAVELLER";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
          role: dbUser.role as Role,
        }}
      />
      <div className="flex">
        <DashboardSidebar role={dbUser.role as Role} />
        <main className="flex-1 min-w-0 px-6 py-8">{children}</main>
      </div>
    </div>
  );
}
