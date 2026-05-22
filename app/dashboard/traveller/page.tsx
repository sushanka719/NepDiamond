import { createSupabaseServerClient } from "@/lib/supabase-server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Mountain } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import LogoutButton from "@/components/logout-button";

export default async function TravellerDashboardPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { fullName: true, email: true, avatarUrl: true, role: true },
  });

  if (!dbUser) redirect("/auth/login");
  if (dbUser.role !== "TRAVELLER") redirect("/dashboard/guide");

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="border-b bg-white dark:bg-slate-900 px-6 py-4">
        <div className="mx-auto max-w-5xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mountain className="h-6 w-6 text-emerald-600" />
            <span className="font-bold text-lg">NepDiamond</span>
          </div>
          <div className="flex items-center gap-3">
            {dbUser.avatarUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={dbUser.avatarUrl}
                alt={dbUser.fullName}
                className="h-8 w-8 rounded-full object-cover"
              />
            )}
            <span className="text-sm font-medium hidden sm:block">{dbUser.fullName}</span>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Welcome, {dbUser.fullName.split(" ")[0]}!</h1>
          <p className="text-muted-foreground text-sm mt-1">Start exploring Nepal's best treks.</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { title: "Treks explored", value: "0" },
            { title: "Guides hired", value: "0" },
            { title: "Reviews given", value: "0" },
          ].map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Trek listings coming soon.
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
