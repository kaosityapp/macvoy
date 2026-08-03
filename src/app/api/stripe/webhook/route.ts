import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig!, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    return NextResponse.json({ error: `Webhook signature verification failed: ${message}` }, { status: 400 });
  }

  const supabase = createServiceClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const registrationId = session.metadata?.registration_id;
      const parentId = session.metadata?.parent_id;
      const monthlyPriceCents = Number(session.metadata?.monthly_price_cents ?? 0);
      if (registrationId && parentId && session.subscription) {
        const sub = await stripe.subscriptions.retrieve(session.subscription as string);
        await supabase.from("subscriptions").upsert(
          {
            registration_id: registrationId,
            parent_id: parentId,
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: sub.id,
            status: sub.status,
            monthly_price_cents: monthlyPriceCents,
            current_period_end: new Date((sub as any).current_period_end * 1000).toISOString(),
          },
          { onConflict: "registration_id" }
        );
      }
      if (parentId && session.amount_total) {
        await supabase.from("payments").insert({
          parent_id: parentId,
          registration_id: registrationId,
          stripe_payment_intent_id: session.payment_intent as string,
          amount_cents: session.amount_total,
          status: "succeeded",
          description: "Registration checkout",
        });
      }
      break;
    }

    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      await supabase
        .from("subscriptions")
        .update({
          status: sub.status,
          current_period_end: new Date((sub as any).current_period_end * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("stripe_subscription_id", sub.id);
      break;
    }

    case "invoice.payment_succeeded": {
      const invoice = event.data.object as Stripe.Invoice;
      const subId = (invoice as any).subscription as string | null;
      if (subId) {
        const { data: subRow } = await supabase
          .from("subscriptions")
          .select("id, parent_id, registration_id")
          .eq("stripe_subscription_id", subId)
          .maybeSingle();
        if (subRow) {
          await supabase.from("payments").insert({
            parent_id: subRow.parent_id,
            registration_id: subRow.registration_id,
            subscription_id: subRow.id,
            stripe_invoice_id: invoice.id,
            amount_cents: invoice.amount_paid,
            status: "succeeded",
            description: "Monthly tuition",
          });
        }
      }
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const subId = (invoice as any).subscription as string | null;
      if (subId) {
        await supabase
          .from("subscriptions")
          .update({ status: "past_due", updated_at: new Date().toISOString() })
          .eq("stripe_subscription_id", subId);
      }
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}
