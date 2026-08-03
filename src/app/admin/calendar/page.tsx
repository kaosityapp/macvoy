import { createClient } from "@/lib/supabase/server";
import { buildClassGroups } from "@/lib/classGroups";
import EventForm from "@/components/EventForm";
import type { Program, Location, EventRow } from "@/lib/types";

export default async function AdminCalendarPage() {
  const supabase = await createClient();
  const [{ data: events }, { data: programs }, { data: locations }] = await Promise.all([
    supabase.from("events").select("*").order("starts_at", { ascending: true }),
    supabase.from("programs").select("*"),
    supabase.from("locations").select("*"),
  ]);

  const groups = buildClassGroups((programs as Program[]) ?? []);
  const locById = new Map(((locations as Location[]) ?? []).map((l) => [l.id, l]));

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--green-900)" }}>
        Events
      </h1>
      <p className="text-sm text-black/60 mb-8">
        Add competitions, recitals, and other one-off events. Restrict an event to specific classes, or leave it
        open to show up for everyone.
      </p>

      <EventForm locations={(locations as Location[]) ?? []} groups={groups} />

      <div className="mt-8 space-y-2">
        {((events as EventRow[]) ?? []).map((e) => (
          <div key={e.id} className="card flex items-center justify-between">
            <div>
              <div className="font-medium text-sm">{e.title}</div>
              <div className="text-xs text-black/50">
                {new Date(e.starts_at).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
                {locById.get(e.location_id ?? "") ? ` · ${locById.get(e.location_id ?? "")!.name}` : " · All locations"}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
