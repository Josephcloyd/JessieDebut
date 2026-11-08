"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import type { ActionResult } from "@/lib/action-result";
import { UserError, enforceRateLimit, guestAction, parseOrThrow } from "@/lib/server/action";
import { createSessionClient } from "@/lib/supabase/clients.server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

const loginSchema = z.object({
  email: z.email("Please enter a valid email address."),
  password: z.string().min(1, "Please enter your password."),
});

const LOGIN_ATTEMPTS = 8;
const LOGIN_WINDOW_SECONDS = 600;
const INVALID_LOGIN = "That email and password don't match an admin account.";

export async function signIn(input: { email: string; password: string }): Promise<ActionResult> {
  return guestAction("signIn", async () => {
    if (!isSupabaseConfigured) throw new UserError("Supabase is not connected yet. See docs/SETUP.md.");
    const credentials = parseOrThrow(loginSchema, input);
    await enforceRateLimit("login", LOGIN_ATTEMPTS, LOGIN_WINDOW_SECONDS);

    const supabase = await createSessionClient();
    const { data, error } = await supabase.auth.signInWithPassword(credentials);
    if (error || !data.user) throw new UserError(INVALID_LOGIN);

    const { data: adminRow } = await supabase.from("admin_users").select("user_id").eq("user_id", data.user.id).maybeSingle();
    if (!adminRow) {
      await supabase.auth.signOut();
      throw new UserError(INVALID_LOGIN);
    }
  });
}

export async function signOut(): Promise<void> {
  const supabase = await createSessionClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
