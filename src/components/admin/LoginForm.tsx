"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { signIn } from "@/lib/actions/auth";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string>();
  const [isBusy, setIsBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setIsBusy(true);
    setError(undefined);
    const result = await signIn({ email, password });
    if (result.ok) {
      router.replace("/admin");
      router.refresh();
      return;
    }
    setError(result.error);
    setIsBusy(false);
  };

  return (
    <form onSubmit={submit} className="mt-8 space-y-4 text-left">
      <div>
        <label htmlFor="login-email" className="eyebrow mb-2 block text-[0.62rem] text-soft-ink">Email</label>
        <input id="login-email" type="email" autoComplete="username" required className="field" value={email} onChange={(event) => setEmail(event.target.value)} />
      </div>
      <div>
        <label htmlFor="login-password" className="eyebrow mb-2 block text-[0.62rem] text-soft-ink">Password</label>
        <input id="login-password" type="password" autoComplete="current-password" required className="field" value={password} onChange={(event) => setPassword(event.target.value)} />
      </div>
      {error && <p role="alert" className="text-sm text-[#9a3b2f]">{error}</p>}
      <button type="submit" className="btn btn-solid w-full" disabled={isBusy}>{isBusy ? "Signing in" : "Sign In"}</button>
    </form>
  );
}
