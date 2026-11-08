import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";

const SUPABASE_DIR = path.resolve(__dirname, "../../supabase");
export const ADMIN_ID = "00000000-0000-0000-0000-00000000000a";
export const OUTSIDER_ID = "00000000-0000-0000-0000-00000000000b";

/** Recreates the parts of a Supabase project the migrations depend on. */
const PLATFORM_STUB = `
  create role anon nologin;
  create role authenticated nologin;
  create role service_role nologin bypassrls;
  grant usage on schema public to anon, authenticated, service_role;
  alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
  alter default privileges in schema public grant execute on functions to anon, authenticated, service_role;
  create schema auth;
  grant usage on schema auth to anon, authenticated, service_role;
  create table auth.users (id uuid primary key);
  create function auth.uid() returns uuid language sql stable as
    $$ select nullif(current_setting('request.jwt.sub', true), '')::uuid $$;
  create schema storage;
  create table storage.buckets (
    id text primary key, name text, public boolean,
    file_size_limit bigint, allowed_mime_types text[]
  );
  create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text);
  alter table storage.objects enable row level security;
  grant usage on schema storage to anon, authenticated, service_role;
  grant all on storage.objects, storage.buckets to authenticated, service_role;
  grant select on storage.objects to anon;
`;

export async function createTestDatabase(): Promise<PGlite> {
  const db = new PGlite();
  await db.exec(PLATFORM_STUB);
  const migrationsDir = path.join(SUPABASE_DIR, "migrations");
  for (const file of readdirSync(migrationsDir).sort()) {
    await db.exec(readFileSync(path.join(migrationsDir, file), "utf8"));
  }
  await db.exec(readFileSync(path.join(SUPABASE_DIR, "seed.sql"), "utf8"));
  await db.exec(`
    insert into auth.users (id) values ('${ADMIN_ID}'), ('${OUTSIDER_ID}');
    insert into public.admin_users (user_id) values ('${ADMIN_ID}');
    insert into public.guests (id, full_name, invite_code, max_companions)
      values ('10000000-0000-0000-0000-000000000001', 'Ana Reyes', 'ABCD2345', 2);
  `);
  return db;
}

type Role = "anon" | "authenticated" | "service_role";

/** Runs one statement as a given role, then returns to the superuser. */
export async function queryAs<T>(
  db: PGlite,
  role: Role,
  sql: string,
  params: unknown[] = [],
  userId?: string,
): Promise<T[]> {
  await db.exec(`set request.jwt.sub = '${userId ?? ""}'; set role ${role};`);
  try {
    const result = await db.query<T>(sql, params);
    return result.rows;
  } finally {
    await db.exec(`reset role; set request.jwt.sub = '';`);
  }
}
