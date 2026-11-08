import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/LoginForm";
import { getAdminContext } from "@/lib/server/admin";

export const metadata: Metadata = { title: "Sign In", robots: { index: false, follow: false } };

export default async function LoginPage() {
  if (await getAdminContext()) redirect("/admin");

  return (
    <main className="linen flex min-h-svh items-center justify-center px-4">
      <div className="hairline-frame w-full max-w-md bg-ivory px-8 py-12 text-center shadow-soft">
        <p className="font-script text-4xl text-soft-ink">The Grand Debut</p>
        <h1 className="mt-1 font-editorial text-3xl">Dashboard</h1>
        <LoginForm />
      </div>
    </main>
  );
}
