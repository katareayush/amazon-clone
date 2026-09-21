import type { Metadata } from "next";
import { Suspense } from "react";
import AuthForm from "@/components/AuthForm";

export const metadata: Metadata = { title: "Amazon Clone Sign in" };

export default function Page() {
  return (
    <Suspense>
      <AuthForm mode="signin" />
    </Suspense>
  );
}
