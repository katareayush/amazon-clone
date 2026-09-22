"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, refreshSession, useUser } from "@/lib/client/api";

export default function AccountLink() {
  const { user } = useUser();
  const router = useRouter();
  return (
    <div className="group relative hidden shrink-0 md:block">
      <Link href={user ? "/orders" : "/signin"} className="block rounded-sm border border-transparent px-1.5 pt-2.5 pb-1.5 leading-tight hover:border-white">
        <div className="text-xs">Hello, {user ? user.name.split(" ")[0] : "sign in"}</div>
        <div className="text-sm font-bold">Account &amp; Lists ▾</div>
      </Link>
      <div className="invisible absolute top-full right-0 z-50 w-56 rounded bg-white p-4 text-sm text-black opacity-0 shadow-xl transition group-hover:visible group-hover:opacity-100">
        {user ? (
          <>
            <p className="mb-2 truncate text-xs text-muted">{user.email}</p>
            <Link href="/orders" className="block py-1 hover:text-link-hover hover:underline">Your Orders</Link>
            <button
              onClick={async () => {
                await api("/api/auth/logout", { method: "POST" });
                await refreshSession();
                router.push("/");
                router.refresh();
              }}
              className="block py-1 hover:text-link-hover hover:underline"
            >
              Sign Out
            </button>
          </>
        ) : (
          <>
            <Link href="/signin" className="btn-yellow block text-center">Sign in</Link>
            <p className="mt-2 text-xs">New customer? <Link href="/register" className="link">Start here.</Link></p>
          </>
        )}
      </div>
    </div>
  );
}
