import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatCents } from "@/lib/stripe";
import { buildClassGroups } from "@/lib/classGroups";
import StartSubscriptionButton from "@/components/StartSubscriptionButton";
import type { Program, Location, Addon } from "@/lib/types";

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending review",
  approved: "Approved",
  rejected: "Not approved",
  waitlisted: "Waitlisted",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: dancers }, { data: programs }, { data: locations }, { data: addons }, { data: subs }] =
    await Promise.all([
      supabase
        .from("dancers")
        .select("*, registrations(*)")
        .eq("parent_id", user.id)
        .order("created_at", { ascending: false }),
      supabase.from("programs").select("*"),
      supabase.from("locations").select("*"),
      supabase.from("addons").select("*"),
      supabase.from("subscriptions").select("*").eq("parent_id", user.id),
    ]);

  const classGroups = buildClassGroups((programs as Program[]) ?? []);
  const locById = new Map(((locations as Location[]) ?? []).map((l) => [l.id, l]));
  const addonById = new Map(((addons as Addon[]) ?? []).map((a) => [a.id, a]));
  const subByReg = new Map((subs ?? []).map((s) => [s.registration_id, s]));

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "var(--green-900)" }}>
          My family
        </h1>
        <Link href="/dashboard/register" className="btn-primary text-sm">
          Register a dancer
        </Link>
      </div>

      {(!dancers || dancers.length === 0) && (
        <div className="card text-center py-12">
          <p className="text-black/60 mb-4">You haven&apos;t registered any dancers yet.</p>
          <Link href="/dashboard/register" className="btn-primary">
            Start registration
          </Link>
        </div>
      )}

      <div className="space-y-4">
        {(dancers ?? []).map((dancer) => {
          const registrations = (dancer.registrations ?? []) as any[];
          return (
            <div key={dancer.id} className="card">
              <h2 className="font-bold text-lg mb-3">
                {dancer.first_name} {dancer.last_name}
              </h2>
              {registrations.length === 0 && <p className="text-sm text-black/50">No registration on file.</p>}
              <div className="space-y-3">
                {registrations.map((reg) => {
                  const group = classGroups.find((g) => g.group_key === reg.program_group_key);
                  const loc = locById.get(reg.location_id);
                  const addon = reg.addon_id ? addonById.get(reg.addon_id) : null;
                  const sub = subByReg.get(reg.id);
                  return (
                    <div key={reg.id} className="rounded-lg border border-black/10 p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-sm">
                          {loc?.name} — {group?.label ?? reg.program_group_key}
                        </span>
                        <span className={`badge badge-${reg.status}`}>{STATUS_LABEL[reg.status]}</span>
                      </div>
                      <p className="text-xs text-black/50 mb-2">
                        Season {reg.season}
                        {addon ? ` · Add-on: ${addon.name}` : ""}
                      </p>

                      {reg.status === "approved" && !sub && group && (
                        <StartSubscriptionButton
                          registrationId={reg.id}
                          label={`Set up billing — ${formatCents(group.monthly_price_cents)}/month`}
                        />
                      )}
                      {reg.status === "approved" && sub && (
                        <p className="text-xs">
                          Billing status: <strong>{sub.status}</strong>
                          {sub.current_period_end &&
                            ` · renews ${new Date(sub.current_period_end).toLocaleDateString()}`}
                        </p>
                      )}
                      {reg.status === "pending" && (
                        <p className="text-xs text-black/50">
                          We&apos;ll email you once MacVoy School of Irish Dance reviews this registration.
                        </p>
                      )}
                      {reg.status === "rejected" && reg.admin_notes && (
                        <p className="text-xs text-red-700">{reg.admin_notes}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
