import { createSupabaseServerClient } from "@/lib/supabase-server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import ProfileEditForm from "./profile-edit-form";

export default async function EditProfilePage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      fullName: true,
      email: true,
      phone: true,
      avatarUrl: true,
      role: true,
      guideProfile: {
        select: {
          bio: true,
          experienceYears: true,
          dailyRate: true,
          currency: true,
          languages: true,
          specializations: true,
          licenseNumber: true,
          coverPhotoUrl: true,
          verificationStatus: true,
        },
      },
    },
  });

  if (!dbUser) redirect("/auth/login");

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Edit Profile</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Update your account information and preferences.
        </p>
      </div>
      <ProfileEditForm
        user={{
          fullName: dbUser.fullName,
          email: dbUser.email,
          phone: dbUser.phone ?? "",
          avatarUrl: dbUser.avatarUrl ?? "",
          role: dbUser.role as "ADMIN" | "GUIDE" | "TRAVELLER",
        }}
        guideProfile={
          dbUser.role === "GUIDE" && dbUser.guideProfile
            ? {
                bio: dbUser.guideProfile.bio ?? "",
                experienceYears: dbUser.guideProfile.experienceYears,
                dailyRate: Number(dbUser.guideProfile.dailyRate),
                currency: dbUser.guideProfile.currency,
                languages: dbUser.guideProfile.languages,
                specializations: dbUser.guideProfile.specializations,
                licenseNumber: dbUser.guideProfile.licenseNumber ?? "",
                coverPhotoUrl: dbUser.guideProfile.coverPhotoUrl ?? "",
                verificationStatus: dbUser.guideProfile.verificationStatus,
              }
            : null
        }
      />
    </div>
  );
}
