// Creates the admin account. Usage: npm run create-admin -- you@example.com "a long password"
import { createClient } from "@supabase/supabase-js";

const MIN_PASSWORD_LENGTH = 12;
const [email, password] = process.argv.slice(2);
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function fail(message) {
  console.error(message);
  process.exit(1);
}

if (!url || !serviceKey) fail("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local first.");
if (!email || !password) fail('Usage: npm run create-admin -- you@example.com "a long password"');
if (password.length < MIN_PASSWORD_LENGTH) fail(`Use a password of at least ${MIN_PASSWORD_LENGTH} characters.`);

const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });
const { data, error } = await supabase.auth.admin.createUser({ email, password, email_confirm: true });
if (error) fail(`Could not create the user: ${error.message}`);

const { error: linkError } = await supabase.from("admin_users").insert({ user_id: data.user.id });
if (linkError) fail(`User created, but could not grant admin access: ${linkError.message}`);

console.log(`Admin account ready for ${email}. Sign in at /admin.`);
