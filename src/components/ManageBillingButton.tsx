"use client";

import { useState } from "react";

export default function ManageBillingButton() {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    const res = await fetch("/api/stripe/portal", { method: "POST" });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    setLoading(false);
  }

  return (
    <button onClick={handleClick} disabled={loading} className="btn-secondary text-sm">
      {loading ? "Loading…" : "Manage billing"}
    </button>
  );
}
