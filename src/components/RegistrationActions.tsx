"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function RegistrationActions({ registrationId }: { registrationId: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState<string | null>(null);
  const [showReject, setShowReject] = useState(false);
  const [reason, setReason] = useState("");

  async function setStatus(status: "approved" | "rejected" | "waitlisted", notes?: string) {
    setLoading(status);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    await supabase
      .from("registrations")
      .update({
        status,
        admin_notes: notes ?? null,
        reviewed_by: user?.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", registrationId);
    setLoading(null);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-2 items-end">
      <div className="flex gap-2">
        <button onClick={() => setStatus("approved")} disabled={!!loading} className="btn-primary text-xs px-3 py-1.5">
          {loading === "approved" ? "…" : "Approve"}
        </button>
        <button
          onClick={() => setStatus("waitlisted")}
          disabled={!!loading}
          className="btn-secondary text-xs px-3 py-1.5"
        >
          {loading === "waitlisted" ? "…" : "Waitlist"}
        </button>
        <button
          onClick={() => setShowReject((s) => !s)}
          disabled={!!loading}
          className="text-xs px-3 py-1.5 rounded-lg border border-red-300 text-red-700"
        >
          Reject
        </button>
      </div>
      {showReject && (
        <div className="flex gap-2 items-center">
          <input
            className="input text-xs py-1"
            placeholder="Reason (optional)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <button
            onClick={() => setStatus("rejected", reason)}
            disabled={!!loading}
            className="text-xs px-3 py-1.5 rounded-lg bg-red-600 text-white"
          >
            Confirm
          </button>
        </div>
      )}
    </div>
  );
}
