import { createClient } from "@/lib/supabase/server";
import { buildClassGroups } from "@/lib/classGroups";
import RegistrationActions from "@/components/RegistrationActions";
import type { Program, Location, Addon } from "@/lib/types";

export default async function AdminRegistrationsPage() {
  const supabase = await createClient();

  const [{ data: registrations }, { data: programs }, { data: locations }, { data: addons }] = await Promise.all([
    supabase
      .from("registrations")
      .select("*, dancers(*, profiles:parent_id(first_name, last_name, email, phone))")
      .order("created_at", { ascending: false }),
    supabase.from("programs").select("*"),
    supabase.from("locations").select("*"),
    supabase.from("addons").select("*"),
  ]);

  const classGroups = buildClassGroups((programs as Program[]) ?? []);
  const locById = new Map(((locations as Location[]) ?? []).map((l) => [l.id, l]));
  const addonById = new Map(((addons as Addon[]) ?? []).map((a) => [a.id, a]));

  const pending = (registrations ?? []).filter((r) => r.status === "pending");
  const others = (registrations ?? []).filter((r) => r.status !== "pending");

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--green-900)" }}>
        Registrations
      </h1>
      <p className="text-sm text-black/60 mb-8">{pending.length} pending review</p>

      <section className="mb-10">
        <h2 className="font-semibold mb-3">Pending</h2>
        {pending.length === 0 && <p className="text-sm text-black/50">Nothing pending review.</p>}
        <div className="space-y-3">
          {pending.map((reg) => {
            const dancer = (reg as any).dancers;
            const parent = dancer?.profiles;
            const group = classGroups.find((g) => g.group_key === reg.program_group_key);
            const addon = reg.addon_id ? addonById.get(reg.addon_id) : null;
            return (
              <div key={reg.id} className="card">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <div className="font-semibold">
                      {dancer?.first_name} {dancer?.last_name}{" "}
                      <span className="text-xs font-normal text-black/50">
                        (born {dancer?.birthday}, {dancer?.gender})
                      </span>
                    </div>
                    <div className="text-sm text-black/70">{locById.get(reg.location_id)?.name}</div>
                    <div className="text-sm">{group?.label ?? reg.program_group_key}</div>
                    {addon && <div className="text-xs text-black/50">Add-on: {addon.name}</div>}
                    <div className="text-xs text-black/50 mt-1">
                      Parent: {parent?.first_name} {parent?.last_name} · {parent?.email} · {parent?.phone}
                    </div>
                    {dancer?.medical_notes && dancer.medical_notes !== "None" && (
                      <div className="text-xs text-red-700 mt-1">Medical: {dancer.medical_notes}</div>
                    )}
                  </div>
                  <RegistrationActions registrationId={reg.id} />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="font-semibold mb-3">History</h2>
        <div className="space-y-2">
          {others.map((reg) => {
            const dancer = (reg as any).dancers;
            const group = classGroups.find((g) => g.group_key === reg.program_group_key);
            return (
              <div key={reg.id} className="flex items-center justify-between text-sm border-b border-black/5 pb-2">
                <div>
                  {dancer?.first_name} {dancer?.last_name} — {group?.label ?? reg.program_group_key}
                </div>
                <span className={`badge badge-${reg.status}`}>{reg.status}</span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
