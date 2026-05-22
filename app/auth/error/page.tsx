import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Mountain } from "lucide-react";

interface Props {
  searchParams: Promise<{ message?: string }>;
}

const ERROR_MESSAGES: Record<string, string> = {
  missing_code: "The authentication code was missing from the callback URL.",
  auth_failed: "Authentication failed. Please try again.",
  access_denied: "You denied access to your Google account.",
};

export default async function AuthErrorPage({ searchParams }: Props) {
  const { message } = await searchParams;
  const readable =
    (message && ERROR_MESSAGES[message]) ??
    message ??
    "An unexpected error occurred during sign-in.";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex items-center gap-2">
            <Mountain className="h-8 w-8 text-emerald-600" />
            <span className="text-2xl font-bold tracking-tight">NepDiamond</span>
          </div>
        </div>

        <Card className="shadow-lg border-destructive/30">
          <CardHeader className="space-y-1 pb-3">
            <div className="flex items-center justify-center">
              <AlertCircle className="h-10 w-10 text-destructive" />
            </div>
            <CardTitle className="text-xl text-center text-destructive">
              Sign-in failed
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-sm text-muted-foreground">{readable}</p>
            <a
              href="/auth/login"
              className="inline-flex w-full items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
            >
              Try again
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
