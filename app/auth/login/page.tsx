import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Mountain, ArrowLeft } from "lucide-react";
import GoogleSignInButton from "./google-sign-in-button";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 px-4">
      <div className="w-full max-w-md space-y-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to home
        </Link>
        {/* Brand */}
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex items-center gap-2">
            <Mountain className="h-8 w-8 text-emerald-600" />
            <span className="text-2xl font-bold tracking-tight">NepDiamond</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Discover Nepal's finest trekking routes and guides
          </p>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl text-center">Welcome</CardTitle>
            <CardDescription className="text-center">
              Sign in to your account to continue
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <GoogleSignInButton />
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  Secure sign-in
                </span>
              </div>
            </div>
            <p className="text-center text-xs text-muted-foreground leading-relaxed">
              By signing in, you agree to our{" "}
              <span className="underline underline-offset-4 cursor-pointer hover:text-primary">
                Terms of Service
              </span>{" "}
              and{" "}
              <span className="underline underline-offset-4 cursor-pointer hover:text-primary">
                Privacy Policy
              </span>
              .
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
