"use server";

import { redirect } from "next/navigation";
import { clearAdminSessionCookie } from "@/lib/auth/admin-session";

export async function adminLogoutAction(): Promise<void> {
  await clearAdminSessionCookie();
  redirect("/admin/login");
}
