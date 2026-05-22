import { createSupabaseServerClient } from "@/lib/supabase-server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, CheckCircle, XCircle } from "lucide-react";

const STATUS_CONFIG = {
  PENDING: {
    label: "Pending review",
    icon: Clock,
    className:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  },
  APPROVED: {
    label: "Verified",
    icon: CheckCircle,
    className:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
  REJECTED: {
    label: "Rejected",
    icon: XCircle,
    className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  },
};

export default async function GuideDashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      fullName: true,
      email: true,
      avatarUrl: true,
      role: true,
      guideProfile: {
        select: {
          verificationStatus: true,
          bio: true,
          experienceYears: true,
          dailyRate: true,
          currency: true,
          languages: true,
          specializations: true,
          rejectionReason: true,
        },
      },
    },
  });

  if (!dbUser || dbUser.role !== "GUIDE") redirect("/auth/select-role");

  const profile = dbUser.guideProfile;
  const status = (profile?.verificationStatus ?? "PENDING") as keyof typeof STATUS_CONFIG;
  const statusConf = STATUS_CONFIG[status];
  const StatusIcon = statusConf.icon;

  return (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Guide Dashboard</h1>
            <p className="text-muted-foreground text-sm mt-1">{dbUser.email}</p>
          </div>
          <Badge className={statusConf.className}>
            <StatusIcon className="h-3.5 w-3.5 mr-1" />
            {statusConf.label}
          </Badge>
        </div>

        {status === "PENDING" && (
          <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-900">
            <CardContent className="py-4">
              <p className="text-sm text-yellow-800 dark:text-yellow-400">
                Your profile is under review. An admin will verify your details
                shortly. You&apos;ll be visible to travellers once approved.
              </p>
            </CardContent>
          </Card>
        )}

        {status === "REJECTED" && profile?.rejectionReason && (
          <Card className="border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900">
            <CardContent className="py-4">
              <p className="text-sm font-medium text-red-800 dark:text-red-400 mb-1">
                Your profile was rejected
              </p>
              <p className="text-sm text-red-700 dark:text-red-300">
                {profile.rejectionReason}
              </p>
              <a
                href="/auth/guide-profile"
                className="text-sm underline mt-2 inline-block text-red-800 dark:text-red-400"
              >
                Resubmit profile →
              </a>
            </CardContent>
          </Card>
        )}

        {profile && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Daily Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {Number(profile.dailyRate).toFixed(0)}{" "}
                  <span className="text-base font-normal text-muted-foreground">
                    {profile.currency}
                  </span>
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Experience
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {profile.experienceYears}{" "}
                  <span className="text-base font-normal text-muted-foreground">
                    years
                  </span>
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Languages
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1">
                  {profile.languages.length > 0 ? (
                    profile.languages.map((l: string) => (
                      <Badge key={l} variant="secondary" className="text-xs">
                        {l}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-muted-foreground text-sm">
                      None listed
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {!profile && (
          <Card>
            <CardContent className="py-8 text-center space-y-3">
              <p className="text-muted-foreground">
                You haven&apos;t set up your guide profile yet.
              </p>
              <a
                href="/auth/guide-profile"
                className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
              >
                Set up profile
              </a>
            </CardContent>
          </Card>
        )}
    </div>
  );
}
