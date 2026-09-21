"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api, RequestError } from "@/lib/client/api";

export default function CancelOrder({ id }: { id: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <div className="mt-4">
      <button
        disabled={busy}
        className="btn-white"
        onClick={async () => {
          if (!confirm("Cancel this order? Items go back into stock.")) return;
          setBusy(true);
          try {
            await api(`/api/orders/${id}/cancel`, { method: "POST" });
            router.refresh();
          } catch (e) {
            setError(e instanceof RequestError ? e.message : "Couldn't cancel this order.");
          }
          setBusy(false);
        }}
      >
        Cancel order
      </button>
      {error && <p role="alert" className="mt-2 text-sm text-deal">{error}</p>}
    </div>
  );
}
