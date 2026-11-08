import "server-only";

import type { SupabaseClient, User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { cache } from "react";
import { createSessionClient } from "@/lib/supabase/clients.server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export interface AdminContext {
  supabase: SupabaseClient;
  user: User;
}

/** Verifies the session with Supabase and confirms the user is listed as an admin. */
export const getAdminContext = cache(async (): Promise<AdminContext | null> => {
  if (!isSupabaseConfigured) return null;
  const supabase = await createSessionClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;

  const { data, error } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", auth.user.id)
    .maybeSingle();
  if (error) throw error;
  return data ? { supabase, user: auth.user } : null;
});

export async function requireAdminPage(): Promise<AdminContext> {
  const admin = await getAdminContext();
  if (!admin) redirect("/admin/login");
  return admin;
}
