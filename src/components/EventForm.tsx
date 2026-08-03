"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { ClassGroup, Location } from "@/lib/types";

export default function EventForm({ locations, groups }: { locations: Location[]; groups: ClassGroup[] }) {
  const router = useRouter();
  const supabase = createClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [locationId, setLocationId] = useState("");
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  function toggleGroup(key: string) {
    setSelectedGroups((s) => (s.includes(key) ? s.filter((k) => k !== key) : [...s, key]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await supabase.from("events").insert({
      title,
      description: description || null,
      starts_at: new Date(startsAt).toISOString(),
      location_id: locationId || null,
      applies_to_group_keys: selectedGroups,
    });
    setSaving(false);
    setTitle("");
    setDescription("");
    setStartsAt("");
    setLocationId("");
    setSelectedGroups([]);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-3">
      <div className="grid sm:grid-cols-2 gap-3">
        <input className="input" placeholder="Event title" required value={title} onChange={(e) => setTitle(e.target.value)} />
        <input
          className="input"
          type="datetime-local"
          required
          value={startsAt}
          onChange={(e) => setStartsAt(e.target.value)}
        />
      </div>
      <textarea
        className="input"
        placeholder="Description (optional)"
        rows={2}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <select className="input" value={locationId} onChange={(e) => setLocationId(e.target.value)}>
        <option value="">All locations</option>
        {locations.map((l) => (
          <option key={l.id} value={l.id}>
            {l.name}
          </option>
        ))}
      </select>
      <div>
        <label className="label">Restrict to specific classes (optional — leave blank for everyone)</label>
        <div className="flex flex-wrap gap-2">
          {groups.map((g) => (
            <label
              key={g.group_key}
              className="text-xs flex items-center gap-1 border rounded-full px-2 py-1 cursor-pointer"
              style={{
                borderColor: selectedGroups.includes(g.group_key) ? "var(--green-700)" : "#d4d0c4",
                background: selectedGroups.includes(g.group_key) ? "#f0f5f1" : "white",
              }}
            >
              <input
                type="checkbox"
                className="hidden"
                checked={selectedGroups.includes(g.group_key)}
                onChange={() => toggleGroup(g.group_key)}
              />
              {g.label}
            </label>
          ))}
        </div>
      </div>
      <button type="submit" disabled={saving} className="btn-primary text-sm">
        {saving ? "Adding…" : "Add event"}
      </button>
    </form>
  );
}
