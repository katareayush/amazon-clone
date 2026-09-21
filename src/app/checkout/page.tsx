import type { Metadata } from "next";
import { redirect } from "next/navigation";
import CheckoutForm from "@/components/CheckoutForm";
import { getUser } from "@/server/auth";

export const metadata: Metadata = { title: "Amazon Clone Checkout" };

export default async function CheckoutPage() {
  const user = await getUser();
  if (!user) redirect("/signin?next=/checkout");
  return <CheckoutForm userName={user.name} />;
}
