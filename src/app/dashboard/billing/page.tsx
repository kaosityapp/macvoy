import { createClient } from "@/lib/supabase/server";
import { formatCents } from "@/lib/stripe";
import ManageBillingButton from "@/components/ManageBillingButton";

export default async function BillingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: subs } = await supabase
    .from("subscriptions")
    .select("*, registrations(program_group_key, dancers(first_name, last_name))")
    .eq("parent_id", user.id);

  const { data: payments } = await supabase
    .from("payments")
    .select("*")
    .eq("parent_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold mb-6" style={{ color: "var(--green-900)" }}>
        Billing
      </h1>

      <div className="card mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Active subscriptions</h2>
          {subs && subs.length > 0 && <ManageBillingButton />}
        </div>
        {(!subs || subs.length === 0) && (
          <p className="text-sm text-black/50">
            No active billing yet. Once a registration is approved, you can set up monthly billing from your
            family dashboard.
          </p>
        )}
        <div className="space-y-3">
          {(subs ?? []).map((s) => {
            const reg = (s as any).registrations;
            return (
              <div key={s.id} className="flex items-center justify-between border-b border-black/5 pb-2 text-sm">
                <div>
                  <div className="font-medium">
                    {reg?.dancers?.first_name} {reg?.dancers?.last_name}
                  </div>
                  <div className="text-black/50 text-xs">{reg?.program_group_key}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{formatCents(s.monthly_price_cents)}/mo</div>
                  <span className={`badge badge-${s.status === "active" ? "approved" : "pending"}`}>{s.status}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="card">
        <h2 className="font-semibold mb-4">Payment history</h2>
        {(!payments || payments.length === 0) && <p className="text-sm text-black/50">No payments yet.</p>}
        <div className="space-y-2">
          {(payments ?? []).map((p) => (
            <div key={p.id} className="flex items-center justify-between text-sm border-b border-black/5 pb-2">
              <div>
                <div>{p.description ?? "Payment"}</div>
                <div className="text-xs text-black/40">{new Date(p.created_at).toLocaleDateString()}</div>
              </div>
              <div className="text-right">
                <div className="font-semibold">{formatCents(p.amount_cents)}</div>
                <span className="text-xs text-black/50">{p.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
