import { createSupabaseServerClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { Sparkles } from "lucide-react";
import TrekPlanner from "@/components/trek-planner";

export default async function PlannerPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-emerald-500" />
          AI Trek Planner
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Describe your dream trek and get a personalised itinerary with matched guides — powered by Gemini AI.
        </p>
      </div>
      <TrekPlanner />
    </div>
  );
}
