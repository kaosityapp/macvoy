import { DAY_NAMES, type ClassGroup, type Program } from "./types";

export function buildClassGroups(programs: Program[]): ClassGroup[] {
  const byKey = new Map<string, Program[]>();
  for (const p of programs) {
    if (!byKey.has(p.group_key)) byKey.set(p.group_key, []);
    byKey.get(p.group_key)!.push(p);
  }

  const groups: ClassGroup[] = [];
  for (const [group_key, meetings] of byKey) {
    meetings.sort((a, b) => a.day_of_week - b.day_of_week || a.start_time.localeCompare(b.start_time));
    const first = meetings[0];
    const label = meetings
      .map((m) => `${DAY_NAMES[m.day_of_week]} ${formatTime(m.start_time)}-${formatTime(m.end_time)}`)
      .join(" & ");
    groups.push({
      group_key,
      location_id: first.location_id,
      label: `${first.name}${meetings.length > 1 ? " (combined)" : ""} — ${label}`,
      level: first.level,
      age_group: first.age_group,
      shoe_type: meetings.map((m) => m.shoe_type).join(" / "),
      monthly_price_cents: meetings.reduce((sum, m) => sum + m.monthly_price_cents, 0) || first.monthly_price_cents,
      meetings,
    });
  }

  groups.sort((a, b) => a.meetings[0].sort_order - b.meetings[0].sort_order);
  return groups;
}

export function formatTime(t: string) {
  const [hStr, mStr] = t.split(":");
  let h = parseInt(hStr, 10);
  const m = mStr;
  const ampm = h >= 12 ? "pm" : "am";
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${m}${ampm}`;
}
