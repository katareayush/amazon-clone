"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import Logo from "./Logo";
import { api, refreshSession, RequestError } from "@/lib/client/api";

type Mode = "signin" | "register";

// Only allow same-site relative redirects after sign-in.
const safeNext = (next: string | null) => (next && next.startsWith("/") && !next.startsWith("//") ? next : "/");

export default function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const next = safeNext(useSearchParams().get("next"));
  const [values, setValues] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState<{ message: string; fields?: Record<string, string> } | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const body = mode === "register" ? values : { email: values.email, password: values.password };
      await api(`/api/auth/${mode === "register" ? "register" : "login"}`, { method: "POST", body });
      await refreshSession();
      router.push(next);
      router.refresh();
    } catch (e) {
      setError(e instanceof RequestError ? { message: e.message, fields: e.fields } : { message: "Something went wrong" });
      setBusy(false);
    }
  }

  const field = (key: keyof typeof values, label: string, type = "text", autoComplete?: string) => (
    <label className="block text-[13px] font-bold">
      {label}
      <input
        type={type}
        autoComplete={autoComplete}
        required
        className="input mt-1 font-normal"
        value={values[key]}
        onChange={(e) => setValues({ ...values, [key]: e.target.value })}
      />
      {error?.fields?.[key] && <span className="mt-1 block text-xs font-normal text-deal">! {error.fields[key]}</span>}
    </label>
  );

  const otherHref = `${mode === "register" ? "/signin" : "/register"}${next !== "/" ? `?next=${encodeURIComponent(next)}` : ""}`;

  return (
    <div className="flex min-h-screen flex-col items-center bg-white px-4 py-4">
      <Link href="/" className="mb-4"><Logo dark /></Link>
      <form onSubmit={submit} className="w-full max-w-[350px] rounded-lg border border-line p-6">
        <h1 className="mb-4 text-[28px]">{mode === "register" ? "Create account" : "Sign in"}</h1>
        {error && !error.fields && (
          <div role="alert" className="mb-4 rounded-lg border border-deal p-3 text-sm">
            <p className="font-bold text-deal">There was a problem</p>
            <p>{error.message}</p>
          </div>
        )}
        <div className="space-y-3">
          {mode === "register" && field("name", "Your name", "text", "name")}
          {field("email", "Email", "email", "email")}
          {field("password", "Password", "password", mode === "register" ? "new-password" : "current-password")}
          {mode === "register" && <p className="text-xs text-muted">ⓘ Passwords must be at least 8 characters.</p>}
        </div>
        <button disabled={busy} className="btn-yellow mt-4 w-full py-2">
          {mode === "register" ? "Create your account" : "Sign in"}
        </button>
        <p className="mt-4 text-xs">
          This is a demo store. Don&apos;t reuse a real password.
        </p>
      </form>
      <div className="mt-6 w-full max-w-[350px] text-center text-xs text-muted">
        <p className="mb-3">{mode === "register" ? "Already have an account?" : "New to Amazon Clone?"}</p>
        <Link href={otherHref} className="btn-white block py-1.5 text-black">
          {mode === "register" ? "Sign in" : "Create your Amazon Clone account"}
        </Link>
      </div>
    </div>
  );
}
