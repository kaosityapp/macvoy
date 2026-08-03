import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex-1 flex flex-col">
      <header className="border-b border-black/5 bg-white">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-lg" style={{ color: "var(--green-900)" }}>
            <Image src="/logo.png" alt="MacVoy School of Irish Dance" width={36} height={36} />
            MacVoy School of Irish Dance
          </div>
          <nav className="flex items-center gap-3">
            <Link href="/login" className="btn-secondary text-sm">
              Log in
            </Link>
            <Link href="/signup" className="btn-primary text-sm">
              Register a dancer
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section
          className="px-6 py-20 text-center"
          style={{ background: "linear-gradient(180deg, #0b3d24 0%, #14532d 100%)" }}
        >
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            2025–2026 Registration is open
          </h1>
          <p className="text-white/85 max-w-xl mx-auto mb-8">
            Classes in Mississauga and Pickering, beginner through competitive,
            for dancers of all ages. Register online, and we&apos;ll email you
            once your registration is approved.
          </p>
          <Link
            href="/signup"
            className="inline-block rounded-lg px-6 py-3 font-semibold"
            style={{ background: "white", color: "var(--green-900)" }}
          >
            Start registration
          </Link>
        </section>

        <section className="max-w-5xl mx-auto px-6 py-14 grid md:grid-cols-2 gap-6">
          <div className="card">
            <h2 className="font-bold text-xl mb-2" style={{ color: "var(--green-900)" }}>
              Mississauga
            </h2>
            <p className="text-sm text-black/60 mb-3">
              The Irish Club of Mississauga, 39-4120 Ridgeway Drive
            </p>
            <p className="text-sm font-semibold mb-1">Tuesdays</p>
            <ul className="text-sm text-black/70 space-y-1 list-disc list-inside">
              <li>5:30–6:00pm — Beginner 1 soft shoe (ages 3–6)</li>
              <li>6:00–6:45pm — Beginner soft shoe (6+)</li>
              <li>6:45–7:15pm — Beginner hard shoe (6+)</li>
              <li>7:00–8:00pm — Advanced soft shoe (9+)</li>
              <li>8:00–9:00pm — Advanced hard shoe (9+)</li>
              <li>9:00–10:00pm — Adult soft/hard shoe (18+)</li>
            </ul>
          </div>
          <div className="card">
            <h2 className="font-bold text-xl mb-2" style={{ color: "var(--green-900)" }}>
              Pickering
            </h2>
            <p className="text-sm text-black/60 mb-3">
              The Dance Experience, 153-1895 Clements Road
            </p>
            <p className="text-sm font-semibold mb-1">Mondays</p>
            <ul className="text-sm text-black/70 space-y-1 list-disc list-inside mb-3">
              <li>5:30–6:00pm — Beginner soft shoe (3–6)</li>
              <li>6:00–7:30pm — Competitive soft/hard shoe</li>
              <li>7:30–9:00pm — Adult competitive soft/hard shoe (18+)</li>
              <li>9:00–10:00pm — Competitive ceili teams</li>
            </ul>
            <p className="text-sm font-semibold mb-1">Thursdays</p>
            <ul className="text-sm text-black/70 space-y-1 list-disc list-inside">
              <li>5:30–6:15pm — Beginner soft shoe (6+)</li>
              <li>6:15–6:45pm — Beginner hard shoe (6+)</li>
              <li>6:45–8:45pm — Competitive soft/hard shoe</li>
              <li>8:45–10:00pm — Adult soft/hard shoe (18+)</li>
            </ul>
          </div>
        </section>

        <section className="max-w-5xl mx-auto px-6 pb-16 text-center text-sm text-black/60">
          Zoom classes and private lessons available upon request — email{" "}
          <a className="underline" href="mailto:MacVoyIrishDance@rogers.com">
            MacVoyIrishDance@rogers.com
          </a>
        </section>
      </main>

      <footer className="border-t border-black/5 py-6 text-center text-xs text-black/50">
        © {new Date().getFullYear()} MacVoy School of Irish Dance
      </footer>
    </div>
  );
}
