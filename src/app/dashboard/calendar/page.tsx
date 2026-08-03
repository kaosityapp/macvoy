import { createClient } from "@/lib/supabase/server";
import { buildClassGroups, formatTime } from "@/lib/classGroups";
import { DAY_NAMES } from "@/lib/types";
import type { Program, Location, EventRow } from "@/lib/types";

export default async function CalendarPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: dancers }, { data: programs }, { data: locations }, { data: events }] = await Promise.all([
    supabase.from("dancers").select("id, first_name, registrations(program_group_key, status)").eq("parent_id", user.id),
    supabase.from("programs").select("*"),
    supabase.from("locations").select("*"),
    supabase.from("events").select("*").order("starts_at", { ascending: true }),
  ]);

  const enrolledGroupKeys = new Set<string>();
  (dancers ?? []).forEach((d: any) =>
    (d.registrations ?? []).forEach((r: any) => {
      if (r.status === "approved") enrolledGroupKeys.add(r.program_group_key);
    })
  );

  const locById = new Map(((locations as Location[]) ?? []).map((l) => [l.id, l]));
  const groups = buildClassGroups((programs as Program[]) ?? []).filter((g) => enrolledGroupKeys.has(g.group_key));

  const byDay: Record<number, { time: string; label: string; loc: string; groupKey: string }[]> = {};
  for (const g of groups) {
    for (const m of g.meetings) {
      byDay[m.day_of_week] = byDay[m.day_of_week] || [];
      byDay[m.day_of_week].push({
        time: `${formatTime(m.start_time)}–${formatTime(m.end_time)}`,
        label: `${m.name}`,
        loc: locById.get(m.location_id)?.name ?? "",
        groupKey: g.group_key,
      });
    }
  }

  const relevantEvents = ((events as EventRow[]) ?? []).filter(
    (e) => e.applies_to_group_keys.length === 0 || e.applies_to_group_keys.some((k) => enrolledGroupKeys.has(k))
  );
  const upcoming = relevantEvents.filter((e) => new Date(e.starts_at) >= new Date());

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--green-900)" }}>
        Class calendar
      </h1>
      <p className="text-sm text-black/60 mb-6">
        Showing only the classes your approved registrations are enrolled in.
      </p>

      {enrolledGroupKeys.size === 0 ? (
        <div className="card text-center py-10 text-black/50">
          No approved registrations yet — your weekly class schedule will show here once you&apos;re approved.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          {[1, 2, 4].map((day) => (
            <div key={day} className="card">
              <h2 className="font-semibold mb-2" style={{ color: "var(--green-900)" }}>
                {DAY_NAMES[day] === "Mon" ? "Monday" : DAY_NAMES[day] === "Tue" ? "Tuesday" : "Thursday"}
              </h2>
              {(byDay[day] ?? []).length === 0 && <p className="text-sm text-black/40">No classes</p>}
              <ul className="space-y-2">
                {(byDay[day] ?? []).map((c, i) => (
                  <li key={i} className="text-sm">
                    <span className="font-medium">{c.time}</span> — {c.label}
                    <div className="text-xs text-black/50">{c.loc}</div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <h2 className="font-semibold mb-3">Upcoming events</h2>
        {upcoming.length === 0 && <p className="text-sm text-black/50">No upcoming events scheduled.</p>}
        <ul className="space-y-3">
          {upcoming.map((e) => (
            <li key={e.id} className="border-b border-black/5 pb-2">
              <div className="font-medium text-sm">{e.title}</div>
              <div className="text-xs text-black/50">
                {new Date(e.starts_at).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
                {locById.get(e.location_id ?? "") ? ` · ${locById.get(e.location_id ?? "")!.name}` : ""}
              </div>
              {e.description && <div className="text-xs text-black/60 mt-1">{e.description}</div>}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
