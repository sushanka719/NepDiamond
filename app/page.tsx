import { createSupabaseServerClient } from "@/lib/supabase-server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function Home() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  });

  if (!dbUser) redirect("/auth/login");

  if (dbUser.role === "ADMIN") redirect("/dashboard/admin");
  if (dbUser.role === "GUIDE") redirect("/dashboard/guide");

  redirect("/dashboard/traveller");
}
