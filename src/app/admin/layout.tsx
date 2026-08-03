import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "@/components/LogoutButton";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role, first_name").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/dashboard");

  return (
    <div className="flex-1 flex flex-col">
      <header className="border-b border-black/5 bg-white">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-2 font-bold text-lg" style={{ color: "var(--green-900)" }}>
            <Image src="/logo.png" alt="MacVoy School of Irish Dance" width={32} height={32} />
            MacVoy Admin
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/admin" className="hover:underline">
              Registrations
            </Link>
            <Link href="/admin/programs" className="hover:underline">
              Classes & pricing
            </Link>
            <Link href="/admin/calendar" className="hover:underline">
              Events
            </Link>
            <Link href="/dashboard" className="hover:underline">
              Parent view
            </Link>
            <span className="text-black/40">{profile?.first_name}</span>
            <LogoutButton />
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
