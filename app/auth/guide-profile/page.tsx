import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mountain } from "lucide-react";
import GuideProfileForm from "./guide-profile-form";

export default function GuideProfilePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 px-4 py-12">
      <div className="w-full max-w-xl space-y-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex items-center gap-2">
            <Mountain className="h-8 w-8 text-emerald-600" />
            <span className="text-2xl font-bold tracking-tight">NepDiamond</span>
          </div>
          <p className="text-sm text-muted-foreground">Step 2 of 2 — Set up your guide profile</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">Guide Profile</CardTitle>
            <CardDescription>
              Tell travellers about yourself. An admin will review and verify your profile before it goes live.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <GuideProfileForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
