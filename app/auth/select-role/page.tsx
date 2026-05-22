import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mountain } from "lucide-react";
import SelectRoleForm from "./select-role-form";

export default function SelectRolePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 px-4">
      <div className="w-full max-w-lg space-y-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex items-center gap-2">
            <Mountain className="h-8 w-8 text-emerald-600" />
            <span className="text-2xl font-bold tracking-tight">NepDiamond</span>
          </div>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl text-center">How will you use NepDiamond?</CardTitle>
            <CardDescription className="text-center">
              Choose your role to get a tailored experience. You can't change this later.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SelectRoleForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
