import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import OrderCard from "@/components/OrderCard";
import { getUser } from "@/server/auth";
import { listOrders } from "@/server/orders";

export const metadata: Metadata = { title: "Your Orders" };

export default async function OrdersPage() {
  const user = await getUser();
  if (!user) redirect("/signin?next=/orders");
  const orders = await listOrders(user.id);

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <h1 className="text-[28px]">Your Orders</h1>
      {orders.length === 0 ? (
        <p className="mt-4 text-sm">
          You have not placed any orders. <Link href="/" className="link">Start shopping</Link>
        </p>
      ) : (
        <ul className="mt-4 space-y-5">
          {orders.map((o) => (
            <li key={o.id}><OrderCard o={o} /></li>
          ))}
        </ul>
      )}
    </div>
  );
}
