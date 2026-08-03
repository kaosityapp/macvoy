import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";
import { buildClassGroups } from "@/lib/classGroups";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { registrationId } = await req.json();

  const { data: registration } = await supabase
    .from("registrations")
    .select("*, dancers!inner(parent_id, first_name, last_name)")
    .eq("id", registrationId)
    .single();

  if (!registration || (registration as any).dancers.parent_id !== user.id) {
    return NextResponse.json({ error: "Registration not found" }, { status: 404 });
  }
  if (registration.status !== "approved") {
    return NextResponse.json({ error: "This registration hasn't been approved yet" }, { status: 400 });
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  const { data: programs } = await supabase.from("programs").select("*");
  const { data: addon } = registration.addon_id
    ? await supabase.from("addons").select("*").eq("id", registration.addon_id).single()
    : { data: null };

  const groups = buildClassGroups(programs ?? []);
  const group = groups.find((g) => g.group_key === registration.program_group_key);
  if (!group || group.monthly_price_cents <= 0) {
    return NextResponse.json(
      { error: "Pricing for this class hasn't been set yet. Please contact the studio." },
      { status: 400 }
    );
  }

  // Reuse an existing Stripe customer for this parent if we've created one before.
  const { data: existingSub } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("parent_id", user.id)
    .not("stripe_customer_id", "is", null)
    .limit(1)
    .maybeSingle();

  let customerId = existingSub?.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: profile?.email,
      name: `${profile?.first_name} ${profile?.last_name}`,
      metadata: { supabase_user_id: user.id },
    });
    customerId = customer.id;
  }

  const lineItems: Array<{ price_data: any; quantity: number }> = [
    {
      price_data: {
        currency: "cad",
        product_data: { name: `${group.label} — MacVoy School of Irish Dance` },
        unit_amount: group.monthly_price_cents,
        recurring: { interval: "month" },
      },
      quantity: 1,
    },
  ];

  if (addon && addon.price_cents > 0) {
    lineItems.push({
      price_data: {
        currency: "cad",
        product_data: { name: addon.name },
        unit_amount: addon.price_cents,
      },
      quantity: 1,
    } as any);
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: lineItems as any,
    success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?billing=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?billing=cancelled`,
    metadata: {
      registration_id: registrationId,
      parent_id: user.id,
      monthly_price_cents: String(group.monthly_price_cents),
    },
    subscription_data: {
      metadata: { registration_id: registrationId, parent_id: user.id },
    },
  });

  return NextResponse.json({ url: session.url });
}
