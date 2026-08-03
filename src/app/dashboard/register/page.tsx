"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { buildClassGroups } from "@/lib/classGroups";
import { formatCents } from "@/lib/stripe";
import type { Addon, ClassGroup, Location, Program } from "@/lib/types";

const HEARD_ABOUT_OPTIONS = [
  "Internet search",
  "Social media (Facebook, Twitter, etc)",
  "Local Irish club",
  "Word of mouth",
  "Returning dancer",
  "Restyling/Transfer",
];

type FormState = {
  dancerFirstName: string;
  dancerLastName: string;
  dancerAddress: string;
  dancerBirthday: string;
  dancerGender: "" | "Female" | "Male";
  parent1Name: string;
  parent1Phone: string;
  parent1Email: string;
  parent2Name: string;
  parent2Phone: string;
  parent2Email: string;
  emergencyName: string;
  emergencyPhone: string;
  emergencyRelationship: string;
  medicalNotes: string;
  heardAbout: string;
  locationSlug: "" | "mississauga" | "pickering";
  groupKey: string;
  addonId: string;
  agreeLiability: boolean;
  agreeMedia: boolean;
  agreeConduct: boolean;
  agreeAttire: boolean;
  agreeCostume: boolean;
  agreeFeePolicy: boolean;
};

const initialState: FormState = {
  dancerFirstName: "",
  dancerLastName: "",
  dancerAddress: "",
  dancerBirthday: "",
  dancerGender: "",
  parent1Name: "",
  parent1Phone: "",
  parent1Email: "",
  parent2Name: "",
  parent2Phone: "",
  parent2Email: "",
  emergencyName: "",
  emergencyPhone: "",
  emergencyRelationship: "",
  medicalNotes: "",
  heardAbout: "",
  locationSlug: "",
  groupKey: "",
  addonId: "",
  agreeLiability: false,
  agreeMedia: false,
  agreeConduct: false,
  agreeAttire: false,
  agreeCostume: false,
  agreeFeePolicy: false,
};

const STEPS = ["Dancer", "Contacts", "Class", "Waivers", "Review"];

export default function RegisterDancerPage() {
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(initialState);
  const [locations, setLocations] = useState<Location[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [addons, setAddons] = useState<Addon[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const [{ data: loc }, { data: prog }, { data: add }, { data: userData }] = await Promise.all([
        supabase.from("locations").select("*"),
        supabase.from("programs").select("*").eq("active", true),
        supabase.from("addons").select("*").eq("active", true),
        supabase.auth.getUser(),
      ]);
      setLocations(loc ?? []);
      setPrograms(prog ?? []);
      setAddons(add ?? []);

      if (userData.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("first_name,last_name,phone,email")
          .eq("id", userData.user.id)
          .single();
        if (profile) {
          setForm((f) => ({
            ...f,
            parent1Name: `${profile.first_name} ${profile.last_name}`,
            parent1Phone: profile.phone ?? "",
            parent1Email: profile.email ?? "",
          }));
        }
      }
      setLoading(false);
    })();
  }, [supabase]);

  const classGroups: ClassGroup[] = useMemo(() => buildClassGroups(programs), [programs]);
  const groupsForLocation = useMemo(() => {
    const loc = locations.find((l) => l.slug === form.locationSlug);
    if (!loc) return [];
    return classGroups.filter((g) => g.location_id === loc.id);
  }, [classGroups, locations, form.locationSlug]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function nextStep() {
    setError(null);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }
  function prevStep() {
    setError(null);
    setStep((s) => Math.max(s - 1, 0));
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        router.push("/login?redirect=/dashboard/register");
        return;
      }
      const [p1First, ...p1Rest] = form.parent1Name.trim().split(" ");
      const [p2First, ...p2Rest] = form.parent2Name.trim().split(" ");

      const loc = locations.find((l) => l.slug === form.locationSlug);
      if (!loc) throw new Error("Please choose a location.");

      const { data: dancer, error: dancerErr } = await supabase
        .from("dancers")
        .insert({
          parent_id: userData.user.id,
          first_name: form.dancerFirstName,
          last_name: form.dancerLastName,
          address: form.dancerAddress,
          birthday: form.dancerBirthday,
          gender: form.dancerGender,
          parent2_first_name: p2First || null,
          parent2_last_name: p2Rest.join(" ") || null,
          parent2_phone: form.parent2Phone || null,
          parent2_email: form.parent2Email || null,
          emergency_contact_name: form.emergencyName,
          emergency_contact_phone: form.emergencyPhone,
          emergency_contact_relationship: form.emergencyRelationship,
          medical_notes: form.medicalNotes || "None",
          heard_about_us: form.heardAbout || null,
        })
        .select()
        .single();

      if (dancerErr) throw dancerErr;

      const { error: regErr } = await supabase.from("registrations").insert({
        dancer_id: dancer.id,
        location_id: loc.id,
        program_group_key: form.groupKey,
        addon_id: form.addonId || null,
        liability_waiver_agreed: form.agreeLiability,
        media_waiver_agreed: form.agreeMedia,
        code_of_conduct_agreed: form.agreeConduct,
        attire_requirements_agreed: form.agreeAttire,
        costume_rental_agreed: form.agreeCostume,
        fee_cancellation_policy_agreed: form.agreeFeePolicy,
      });

      if (regErr) throw regErr;

      router.push("/dashboard?registered=1");
      router.refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="max-w-2xl mx-auto px-6 py-12">Loading…</div>;
  }

  const allWaiversAgreed =
    form.agreeLiability &&
    form.agreeMedia &&
    form.agreeConduct &&
    form.agreeAttire &&
    form.agreeCostume &&
    form.agreeFeePolicy;

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--green-900)" }}>
        2025–2026 Registration
      </h1>
      <p className="text-sm text-black/60 mb-6">
        Complete this form for each dancer. Once submitted, your registration will be reviewed and
        you&apos;ll be notified by email when it&apos;s approved and ready for payment.
      </p>

      <ol className="flex items-center gap-2 mb-8 text-xs font-semibold">
        {STEPS.map((s, i) => (
          <li
            key={s}
            className="flex-1 text-center py-2 rounded"
            style={{
              background: i === step ? "var(--green-700)" : i < step ? "#dcfce7" : "#f1f0ea",
              color: i === step ? "white" : i < step ? "#166534" : "#6b7280",
            }}
          >
            {s}
          </li>
        ))}
      </ol>

      {error && <div className="mb-4 rounded-lg bg-red-50 text-red-700 text-sm px-3 py-2">{error}</div>}

      <div className="card">
        {step === 0 && (
          <div className="space-y-4">
            <div>
              <label className="label">Dancer&apos;s first and last name</label>
              <div className="grid grid-cols-2 gap-3">
                <input className="input" value={form.dancerFirstName} onChange={(e) => update("dancerFirstName", e.target.value)} placeholder="First name" />
                <input className="input" value={form.dancerLastName} onChange={(e) => update("dancerLastName", e.target.value)} placeholder="Last name" />
              </div>
            </div>
            <div>
              <label className="label">Dancer&apos;s full address (including city and postal code)</label>
              <textarea className="input" rows={2} value={form.dancerAddress} onChange={(e) => update("dancerAddress", e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Dancer&apos;s birthday</label>
                <input type="date" className="input" value={form.dancerBirthday} onChange={(e) => update("dancerBirthday", e.target.value)} />
              </div>
              <div>
                <label className="label">Dancer&apos;s gender</label>
                <select className="input" value={form.dancerGender} onChange={(e) => update("dancerGender", e.target.value as FormState["dancerGender"])}>
                  <option value="">Select…</option>
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <p className="font-semibold text-sm" style={{ color: "var(--green-900)" }}>
              Parent #1 (or adult dancer if 18+)
            </p>
            <input className="input" placeholder="First and last name" value={form.parent1Name} onChange={(e) => update("parent1Name", e.target.value)} />
            <input className="input" placeholder="Phone number" value={form.parent1Phone} onChange={(e) => update("parent1Phone", e.target.value)} />
            <input className="input" placeholder="Email address" value={form.parent1Email} onChange={(e) => update("parent1Email", e.target.value)} />

            <p className="font-semibold text-sm pt-2" style={{ color: "var(--green-900)" }}>
              Parent #2 (optional)
            </p>
            <input className="input" placeholder="First and last name" value={form.parent2Name} onChange={(e) => update("parent2Name", e.target.value)} />
            <input className="input" placeholder="Phone number" value={form.parent2Phone} onChange={(e) => update("parent2Phone", e.target.value)} />
            <input className="input" placeholder="Email address" value={form.parent2Email} onChange={(e) => update("parent2Email", e.target.value)} />

            <p className="font-semibold text-sm pt-2" style={{ color: "var(--green-900)" }}>
              Emergency contact (different than Parent #1)
            </p>
            <input className="input" placeholder="First and last name" value={form.emergencyName} onChange={(e) => update("emergencyName", e.target.value)} />
            <input className="input" placeholder="Phone number" value={form.emergencyPhone} onChange={(e) => update("emergencyPhone", e.target.value)} />
            <input className="input" placeholder="Relationship to dancer" value={form.emergencyRelationship} onChange={(e) => update("emergencyRelationship", e.target.value)} />

            <div>
              <label className="label">Medical conditions, medications and allergies</label>
              <textarea className="input" rows={2} value={form.medicalNotes} onChange={(e) => update("medicalNotes", e.target.value)} placeholder="None, or please describe" />
            </div>

            <div>
              <label className="label">How did you hear about MacVoy School of Irish Dance?</label>
              <select className="input" value={form.heardAbout} onChange={(e) => update("heardAbout", e.target.value)}>
                <option value="">Select…</option>
                {HEARD_ABOUT_OPTIONS.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div>
              <label className="label">Pick a location to register for</label>
              <div className="grid grid-cols-2 gap-3">
                {locations.map((loc) => (
                  <button
                    type="button"
                    key={loc.id}
                    onClick={() => {
                      update("locationSlug", loc.slug);
                      update("groupKey", "");
                    }}
                    className="rounded-lg border p-3 text-left"
                    style={{
                      borderColor: form.locationSlug === loc.slug ? "var(--green-700)" : "#d4d0c4",
                      background: form.locationSlug === loc.slug ? "#f0f5f1" : "white",
                    }}
                  >
                    <div className="font-semibold">{loc.name}</div>
                    <div className="text-xs text-black/60">{loc.address}</div>
                  </button>
                ))}
              </div>
            </div>

            {form.locationSlug && (
              <div>
                <label className="label">Pick a class to register for</label>
                <p className="text-xs text-black/50 mb-2">
                  Email MacVoyIrishDance@rogers.com if you&apos;re unsure which class to register for.
                </p>
                <div className="space-y-2">
                  {groupsForLocation.map((g) => (
                    <label
                      key={g.group_key}
                      className="flex items-start gap-3 rounded-lg border p-3 cursor-pointer"
                      style={{
                        borderColor: form.groupKey === g.group_key ? "var(--green-700)" : "#d4d0c4",
                        background: form.groupKey === g.group_key ? "#f0f5f1" : "white",
                      }}
                    >
                      <input
                        type="radio"
                        name="groupKey"
                        className="mt-1"
                        checked={form.groupKey === g.group_key}
                        onChange={() => update("groupKey", g.group_key)}
                      />
                      <div>
                        <div className="font-semibold text-sm">{g.label}</div>
                        <div className="text-xs text-black/60">
                          {g.level} · ages {g.age_group} · {g.shoe_type}
                        </div>
                        {g.monthly_price_cents > 0 && (
                          <div className="text-xs font-semibold mt-1" style={{ color: "var(--green-700)" }}>
                            {formatCents(g.monthly_price_cents)}/month
                          </div>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="label">Pick an add-on</label>
              <p className="text-xs text-black/50 mb-2">
                All dancers MUST wear a class t-shirt, and all female dancers MUST wear Irish dance socks.
              </p>
              <div className="space-y-2">
                {addons.map((a) => (
                  <label
                    key={a.id}
                    className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer"
                    style={{
                      borderColor: form.addonId === a.id ? "var(--green-700)" : "#d4d0c4",
                      background: form.addonId === a.id ? "#f0f5f1" : "white",
                    }}
                  >
                    <input
                      type="radio"
                      name="addonId"
                      checked={form.addonId === a.id}
                      onChange={() => update("addonId", a.id)}
                    />
                    <div className="text-sm">
                      {a.name}
                      {a.price_cents > 0 && <span className="text-black/60"> — {formatCents(a.price_cents)}</span>}
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <WaiverBlock
              title="Liability Waiver"
              text={`By agreeing, I acknowledge my understanding that there is a certain amount of risk involved in Irish dancing, and release MacVoy School of Irish Dance, its instructors, and studio locations from liability in the case of an accident, injury, communicable disease etc. to myself or my child(ren). I confirm that I, or my child(ren), am/is/are in good physical condition before participating in each class and am/is/are able to participate fully in the classes attended. I have outlined all medical conditions that MacVoy School of Irish Dance should be aware of on the completed registration form and will inform if any new symptoms or health problems arise.`}
              checked={form.agreeLiability}
              onChange={(v) => update("agreeLiability", v)}
            />
            <WaiverBlock
              title="Media Waiver"
              text={`By agreeing, I acknowledge and accept that any photos, videos, quotations or recordings taken by/on behalf of MacVoy School of Irish Dance are property of MacVoy School of Irish Dance and may be used without compensation for promotional, educational, commercial, or instructional purposes on all mediums.`}
              checked={form.agreeMedia}
              onChange={(v) => update("agreeMedia", v)}
            />
            <WaiverBlock
              title="Code of Conduct"
              text={`As a student/parent/guardian at MacVoy School of Irish Dance, I commit to arriving on time with proper footwear and attire, actively participating, supporting and encouraging classmates, acting respectfully toward instructors and students, accepting feedback courteously, demonstrating good sportsmanship, practicing at home, and living up to these commitments.`}
              checked={form.agreeConduct}
              onChange={(v) => update("agreeConduct", v)}
            />
            <WaiverBlock
              title="Class Attire and Dance Bag Requirements"
              text={`Mandatory attire for class is the MacVoy School of Irish Dance t-shirt, leggings or shorts (no denim or baggy pants), white Irish dance socks for females, and proper footwear. Black ballet slippers are suitable for beginners/non-competitive dancers. Irish soft shoes are required for competitive dancers. Irish hard shoes are required for all dancers enrolled in the hard shoe class. No juice/pop, candy/gum or food, electronics or toys allowed in class. The studio is a scent free and allergen free environment.`}
              checked={form.agreeAttire}
              onChange={(v) => update("agreeAttire", v)}
            />
            <WaiverBlock
              title="Annual School Costume Rental"
              text={`School costumes and all related items are property of MacVoy School of Irish Dance. Costumes are to be worn at all competitions, recitals and performances. If a dancer withdraws from the program, the costume and related items must be returned immediately in the same condition it was received, or a replacement fee will be charged.`}
              checked={form.agreeCostume}
              onChange={(v) => update("agreeCostume", v)}
            />
            <WaiverBlock
              title="Fee and Cancellation Policy"
              text={`MacVoy School of Irish Dance reserves the right to change class date, time, and delivery if conflicts occur. 2025-2026 dance year is from September to June ending with the recital. Commitment is required for the entire duration. Competitive dancers are required to continue with lessons throughout the summer. Proper written notice is required for withdrawal. No refunds will be given on tuition payment or additional fees paid under any circumstances. There are no refunds on missed classes, and non-attendance does not constitute a withdrawal. Late fees will be charged on late payments, and dancers will not be permitted to class until paid in full.`}
              checked={form.agreeFeePolicy}
              onChange={(v) => update("agreeFeePolicy", v)}
            />
          </div>
        )}

        {step === 4 && (
          <div className="space-y-3 text-sm">
            <ReviewRow label="Dancer" value={`${form.dancerFirstName} ${form.dancerLastName}`} />
            <ReviewRow label="Birthday" value={form.dancerBirthday} />
            <ReviewRow label="Location" value={locations.find((l) => l.slug === form.locationSlug)?.name ?? ""} />
            <ReviewRow
              label="Class"
              value={groupsForLocation.find((g) => g.group_key === form.groupKey)?.label ?? "Not selected"}
            />
            <ReviewRow label="Add-on" value={addons.find((a) => a.id === form.addonId)?.name ?? "None selected"} />
            <ReviewRow label="Parent #1" value={`${form.parent1Name} · ${form.parent1Phone} · ${form.parent1Email}`} />
            <ReviewRow label="Emergency contact" value={`${form.emergencyName} · ${form.emergencyPhone}`} />
            <ReviewRow label="Waivers" value={allWaiversAgreed ? "All agreed ✓" : "Incomplete — go back to Waivers step"} />
            <p className="text-xs text-black/50 pt-2">
              After you submit, your registration will show as <strong>Pending</strong> until MacVoy School of
              Irish Dance reviews and approves it. You&apos;ll then be able to set up recurring billing from your
              dashboard.
            </p>
          </div>
        )}

        <div className="flex items-center justify-between mt-6 pt-4 border-t">
          <button type="button" onClick={prevStep} disabled={step === 0} className="btn-secondary disabled:opacity-40">
            Back
          </button>
          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={nextStep}
              disabled={step === 2 && !form.groupKey}
              className="btn-primary"
            >
              Continue
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || !allWaiversAgreed || !form.groupKey}
              className="btn-primary"
            >
              {submitting ? "Submitting…" : "Submit registration"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function WaiverBlock({
  title,
  text,
  checked,
  onChange,
}: {
  title: string;
  text: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="rounded-lg border border-black/10 p-3">
      <p className="font-semibold text-sm mb-1">{title}</p>
      <p className="text-xs text-black/60 mb-2 max-h-28 overflow-y-auto">{text}</p>
      <label className="flex items-center gap-2 text-sm font-medium">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        I agree
      </label>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-black/5 pb-2">
      <span className="text-black/50">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}
