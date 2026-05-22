import { createSupabaseServerClient } from "@/lib/supabase-server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Navbar from "@/components/navbar";

export default async function AdminDashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { fullName: true, email: true, role: true },
  });

  if (!dbUser || dbUser.role !== "ADMIN") redirect("/auth/login");

  const pendingGuides = await prisma.guideProfile.findMany({
    where: { verificationStatus: "PENDING" },
    select: {
      id: true,
      user: { select: { fullName: true, email: true } },
      experienceYears: true,
      dailyRate: true,
      currency: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar
        user={{
          fullName: dbUser.fullName,
          avatarUrl: null,
          role: "ADMIN",
        }}
      />

      <main className="mx-auto max-w-5xl px-6 py-8 space-y-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              Pending Guide Verifications
              <Badge variant="secondary">{pendingGuides.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pendingGuides.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No pending verifications.
              </p>
            ) : (
              <div className="divide-y">
                {pendingGuides.map((g: typeof pendingGuides[number]) => (
                  <div
                    key={g.id}
                    className="py-3 flex items-center justify-between gap-4"
                  >
                    <div>
                      <p className="font-medium text-sm">{g.user.fullName}</p>
                      <p className="text-xs text-muted-foreground">
                        {g.user.email}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {g.experienceYears} yrs exp ·{" "}
                        {Number(g.dailyRate).toFixed(0)} {g.currency}/day
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(g.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
