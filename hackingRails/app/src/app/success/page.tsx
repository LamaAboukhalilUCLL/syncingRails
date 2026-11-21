// Shown after payment. Display only: tickets are issued in the webhook.
import { Suspense } from "react";
import Link from "next/link";
import { getStripe } from "@/lib/stripe";

function money(cents: number | null, currency: string | null) {
  return new Intl.NumberFormat("en-IE", { style: "currency", currency: (currency || "eur").toUpperCase() }).format((cents ?? 0) / 100);
}

export default function Success({ searchParams }: PageProps<"/success">) {
  return (
    <Suspense fallback={<Shell title="Loading your booking…" />}>
      <Booking searchParams={searchParams} />
    </Suspense>
  );
}

async function Booking({ searchParams }: { searchParams: PageProps<"/success">["searchParams"] }) {
  const { session_id } = await searchParams;
  if (typeof session_id !== "string") {
    return <Shell title="No booking found" />;
  }

  let session;
  try {
    session = await getStripe().checkout.sessions.retrieve(session_id, { expand: ["line_items"] });
  } catch {
    return <Shell title="We couldn't find this booking" />;
  }

  const paid = session.payment_status !== "unpaid";
  const ref = session.id.slice(-8).toUpperCase();

  return (
    <Shell title={paid ? "You're going! 🎉" : "Payment processing…"}>
      <p className="text-slate-600">
        {session.metadata?.route} · {session.metadata?.passengers} traveller(s)
      </p>
      <p className="mt-1 text-sm text-slate-500">
        Booking reference <span className="font-mono font-semibold text-slate-800">{ref}</span>
      </p>
      <ul className="mt-6 divide-y divide-slate-100 text-sm">
        {session.line_items?.data.map((li) => (
          <li key={li.id} className="flex justify-between gap-4 py-2">
            <span className="text-slate-700">
              {li.quantity}× {li.description}
            </span>
            <span className="text-slate-900">{money(li.amount_total, li.currency)}</span>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex justify-between border-t border-slate-200 pt-4 font-semibold">
        <span>Total paid</span>
        <span>{money(session.amount_total, session.currency)}</span>
      </div>
      {session.metadata?.co2_kg && (
        <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          🌱 This trip emits about {session.metadata.co2_kg} kg CO₂ per person.
        </p>
      )}
    </Shell>
  );
}

function Shell({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-900 px-4 py-16">
      <div className="mx-auto max-w-xl rounded-3xl bg-white p-8 shadow-2xl">
        <h1 className="text-3xl font-bold text-slate-900">{title}</h1>
        <div className="mt-4">{children}</div>
        <Link href="/" className="mt-8 inline-block rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-700">
          Plan another trip
        </Link>
      </div>
    </main>
  );
}
