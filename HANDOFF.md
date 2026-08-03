# MacVoy School of Irish Dance — Web App

A full registration, approval, account/login, recurring billing, and class calendar
system for MacVoy School of Irish Dance — built to replace a $95/month + transaction
fee platform.

## What's built

- **Registration form** matching the original Microsoft Forms registration exactly:
  dancer info, parent #1/#2, emergency contact, medical notes, "how did you hear
  about us," location + class picker (Mississauga/Pickering with every listed class
  time), t-shirt/socks add-ons, and all 6 waivers (liability, media, code of conduct,
  attire, costume rental, fee/cancellation policy).
- **Accounts**: parents create an account, log in, and register one or more dancers
  from their family dashboard.
- **Approval workflow**: every registration starts `pending`. Debbie (admin) reviews
  and approves/waitlists/rejects from `/admin`, seeing parent contact info and medical
  notes.
- **Recurring billing**: once approved, the parent clicks "Set up billing" and pays
  via Stripe Checkout (monthly subscription + one-time add-on fee). Stripe webhooks
  keep subscription status in sync; parents can manage/cancel via the Stripe customer
  portal.
- **Calendar**: `/dashboard/calendar` shows only the classes a family is actually
  enrolled in (by day/time/location), plus upcoming events (competitions, recitals)
  that admin adds from `/admin/calendar`.
- **Admin pricing tool**: `/admin/programs` lets Debbie set/change monthly tuition
  per class without touching code.

## Pricing already configured

Based on the rates you gave me (30 min = $12, 60 min = $22, 75 min = $27, 90 min =
$32, 120 min = $42, 45 min interpolated at $17), every class in both locations has
tuition pre-filled — combined Monday+Thursday competitive/adult classes are priced as
the sum of each day's own block. Debbie can adjust any of these any time from
`/admin/programs` — no developer needed.

## Stack (why this is so much cheaper than $95/mo)

- **Next.js** app, hosted on **Vercel** (free tier covers this easily; paid tier if
  traffic grows is $20/mo flat, not per-transaction).
- **Supabase** (Postgres + auth) — free tier covers a school this size.
- **Stripe** — no monthly fee, just standard card processing (~2.9% + $0.30/transaction,
  the same processor most platforms use under the hood anyway).

Total realistic monthly cost: **$0–20/month**, versus $95/month + transaction fees.

## What I built this on (dev environment)

- Supabase project: `macvoy-irish-dance` (project ref `ypbgdsrtwkafokeqkgmg`), created
  under your Kaosity Supabase organization.
- Code is complete and builds cleanly (`npm run build` succeeds) in
  `~/macvoy-irish-dance` in this session — I'll send it to you as a zip.

## What's left before this is "live" for real families

1. **Deploy to Vercel** (I couldn't do this automatically — the connected Vercel
   account doesn't have permission to create new projects, likely a team-role
   restriction). Easiest path:
   - Push this code to a GitHub repo.
   - In Vercel, "Add New Project" → import that repo → it auto-detects Next.js.
   - Add the environment variables from `.env.local` (Supabase URL/key are already
     real; Stripe keys are placeholders — see step 2).
2. **Connect real Stripe keys**: create a Stripe account (or use Debbie's if she has
   one), grab the secret key and publishable key from the Stripe dashboard, and set
   up a webhook pointing at `https://<your-domain>/api/stripe/webhook` for these
   events: `checkout.session.completed`, `customer.subscription.updated`,
   `customer.subscription.deleted`, `invoice.payment_succeeded`,
   `invoice.payment_failed`. Put the webhook signing secret in `STRIPE_WEBHOOK_SECRET`.
3. **Get the Supabase service role key**: Supabase Dashboard → this project →
   Project Settings → API → `service_role` key → put it in
   `SUPABASE_SERVICE_ROLE_KEY`. This is required for the Stripe webhook to write
   subscription/payment records.
4. **Make Debbie an admin**: after she signs up once through the normal signup form,
   run this in the Supabase SQL editor:
   ```sql
   update profiles set role = 'admin' where email = 'debbie@example.com';
   ```
5. **Custom domain** (optional): point your existing domain at the Vercel project,
   or use the free `*.vercel.app` URL to start.
6. **Move to a production Supabase project** if you want this fully separated from
   my dev workspace — or just keep using this one (it's already under your own
   Supabase organization, so you own it either way).

## Files

- `src/app/` — all pages (marketing site, signup/login, parent dashboard,
  registration wizard, admin console).
- `src/lib/` — Supabase clients, Stripe client, class/pricing helpers.
- `src/components/` — shared UI (waiver checkboxes, price editor, checkout button,
  etc).
- Database schema + seed data (locations, all 13 class options, add-ons, pricing)
  already applied to the Supabase project above.
