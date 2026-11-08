import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import type { ActionResult } from "@/lib/action-result";
import { createServiceClient } from "@/lib/supabase/clients.server";
import { getAdminContext } from "./admin";

/** An error whose message is safe and useful to show to the person. */
export class UserError extends Error {}

const GENERIC_FAILURE = "Something went wrong. Please try again in a moment.";

function failureFrom(error: unknown, scope: string): ActionResult<never> {
  if (error instanceof UserError) return { ok: false, error: error.message };
  console.error(`[action:${scope}]`, error);
  return { ok: false, error: GENERIC_FAILURE };
}

/** Parses input with a schema, turning the first problem into a readable error. */
export function parseOrThrow<S extends z.ZodType>(schema: S, input: unknown): z.output<S> {
  const result = schema.safeParse(input);
  if (!result.success) throw new UserError(result.error.issues[0]?.message ?? "Please check your entries.");
  return result.data;
}

/** Runs guest-facing work and converts failures into a result the form can show. */
export async function guestAction<T>(scope: string, work: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await work() };
  } catch (error) {
    return failureFrom(error, scope);
  }
}

/** Confirms an admin session before running work as that admin. */
export async function adminAction<T>(
  scope: string,
  work: (supabase: SupabaseClient) => Promise<T>,
): Promise<ActionResult<T>> {
  try {
    const admin = await getAdminContext();
    if (!admin) throw new UserError("Your session has ended. Please sign in again.");
    return { ok: true, data: await work(admin.supabase) };
  } catch (error) {
    return failureFrom(error, scope);
  }
}

export function refreshPublicSite(): void {
  revalidatePath("/", "layout");
}

async function clientAddress(): Promise<string> {
  const headerList = await headers();
  return headerList.get("x-real-ip") ?? headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

export async function enforceRateLimit(scope: string, limit: number, windowSeconds: number): Promise<void> {
  const { data, error } = await createServiceClient().rpc("check_rate_limit", {
    p_key: `${scope}:${await clientAddress()}`,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });
  if (error) throw error;
  if (data !== true) throw new UserError("That was a lot of attempts. Please wait a few minutes and try again.");
}
