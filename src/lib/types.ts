export type UserRole = "parent" | "admin";
export type RegistrationStatus = "pending" | "approved" | "rejected" | "waitlisted";
export type DancerGender = "Female" | "Male";
export type LocationSlug = "mississauga" | "pickering";
export type SubscriptionStatus =
  | "incomplete"
  | "active"
  | "past_due"
  | "canceled"
  | "trialing"
  | "unpaid";

export interface Profile {
  id: string;
  role: UserRole;
  first_name: string;
  last_name: string;
  phone: string | null;
  email: string;
  created_at: string;
}

export interface Location {
  id: string;
  slug: LocationSlug;
  name: string;
  address: string;
}

export interface Program {
  id: string;
  location_id: string;
  name: string;
  shoe_type: string;
  age_group: string;
  level: string;
  day_of_week: number; // 0=Sun..6=Sat
  start_time: string; // HH:MM:SS
  end_time: string;
  monthly_price_cents: number;
  active: boolean;
  sort_order: number;
  group_key: string;
}

export interface Addon {
  id: string;
  name: string;
  price_cents: number;
  active: boolean;
}

export interface Dancer {
  id: string;
  parent_id: string;
  first_name: string;
  last_name: string;
  address: string;
  birthday: string;
  gender: DancerGender;
  parent2_first_name: string | null;
  parent2_last_name: string | null;
  parent2_phone: string | null;
  parent2_email: string | null;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  emergency_contact_relationship: string;
  medical_notes: string;
  heard_about_us: string | null;
  created_at: string;
}

export interface Registration {
  id: string;
  dancer_id: string;
  location_id: string;
  season: string;
  program_group_key: string;
  addon_id: string | null;
  status: RegistrationStatus;
  liability_waiver_agreed: boolean;
  media_waiver_agreed: boolean;
  code_of_conduct_agreed: boolean;
  attire_requirements_agreed: boolean;
  costume_rental_agreed: boolean;
  fee_cancellation_policy_agreed: boolean;
  admin_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export interface EventRow {
  id: string;
  location_id: string | null;
  title: string;
  description: string | null;
  starts_at: string;
  ends_at: string | null;
  applies_to_group_keys: string[];
}

export interface SubscriptionRow {
  id: string;
  registration_id: string;
  parent_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  status: SubscriptionStatus;
  monthly_price_cents: number;
  current_period_end: string | null;
}

// A "class group" is a set of Program rows sharing a group_key — this is what
// shows up as a single selectable option on the registration form (matching
// the original paper/Microsoft-Forms registration options).
export interface ClassGroup {
  group_key: string;
  location_id: string;
  label: string;
  level: string;
  age_group: string;
  shoe_type: string;
  monthly_price_cents: number;
  meetings: Program[];
}

export const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
