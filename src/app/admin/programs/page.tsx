import { createClient } from "@/lib/supabase/server";
import { buildClassGroups } from "@/lib/classGroups";
import ProgramPriceEditor from "@/components/ProgramPriceEditor";
import type { Program, Location } from "@/lib/types";

export default async function AdminProgramsPage() {
  const supabase = await createClient();
  const [{ data: programs }, { data: locations }] = await Promise.all([
    supabase.from("programs").select("*"),
    supabase.from("locations").select("*"),
  ]);

  const groups = buildClassGroups((programs as Program[]) ?? []);
  const locById = new Map(((locations as Location[]) ?? []).map((l) => [l.id, l]));

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--green-900)" }}>
        Classes & pricing
      </h1>
      <p className="text-sm text-black/60 mb-8">
        Set the monthly tuition for each class. This is what families are charged via recurring billing once
        they&apos;re approved. Combined classes (e.g. Monday + Thursday) are priced as one monthly amount split
        evenly across their weekly meetings.
      </p>

      {(["mississauga", "pickering"] as const).map((slug) => {
        const loc = [...locById.values()].find((l) => l.slug === slug);
        if (!loc) return null;
        const locGroups = groups.filter((g) => g.location_id === loc.id);
        return (
          <div key={slug} className="mb-8">
            <h2 className="font-semibold text-lg mb-3" style={{ color: "var(--green-900)" }}>
              {loc.name}
            </h2>
            <div className="space-y-3">
              {locGroups.map((g) => (
                <ProgramPriceEditor key={g.group_key} group={g} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
