"use server";

import { searchAdminCommand } from "@/lib/admin/command-search";
import { requireAdminSession } from "@/lib/auth/admin-session";

export async function adminCommandSearchAction(query: string) {
  await requireAdminSession();
  return searchAdminCommand(query);
}
