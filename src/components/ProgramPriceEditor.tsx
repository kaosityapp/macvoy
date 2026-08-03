"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { ClassGroup } from "@/lib/types";

export default function ProgramPriceEditor({ group }: { group: ClassGroup }) {
  const router = useRouter();
  const supabase = createClient();
  const [value, setValue] = useState((group.monthly_price_cents / 100).toFixed(2));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    const cents = Math.round(parseFloat(value || "0") * 100);
    const meetings = group.meetings;

    // Put the full monthly price on the first meeting row, zero the rest —
    // buildClassGroups() sums all meetings in a group back into one total.
    await Promise.all(
      meetings.map((m, i) =>
        supabase
          .from("programs")
          .update({ monthly_price_cents: i === 0 ? cents : 0 })
          .eq("id", m.id)
      )
    );

    setSaving(false);
    setSaved(true);
    router.refresh();
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <div className="card flex items-center justify-between gap-4 flex-wrap">
      <div>
        <div className="font-medium text-sm">{group.label}</div>
        <div className="text-xs text-black/50">
          {group.level} · ages {group.age_group} · {group.shoe_type}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-black/50">$</span>
        <input
          className="input w-24 text-sm"
          type="number"
          min="0"
          step="0.01"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <span className="text-xs text-black/50">/month</span>
        <button onClick={handleSave} disabled={saving} className="btn-primary text-xs px-3 py-1.5">
          {saving ? "Saving…" : saved ? "Saved ✓" : "Save"}
        </button>
      </div>
    </div>
  );
}
