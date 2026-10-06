import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Use | Storedel",
  description:
    "Read the terms that apply when using Storedel as a customer or store owner.",
  alternates: {
    canonical: "/terms",
  },
};

const sections = [
  {
    title: "Using Storedel",
    body: [
      "Storedel helps local stores create online storefronts and lets customers place orders with those stores.",
      "You agree to provide accurate information and use the service only for lawful purposes.",
    ],
  },
  {
    title: "Accounts",
    body: [
      "You are responsible for activity under your account and for keeping your login access secure.",
      "Store owners are responsible for keeping store details, products, prices, availability, and fulfillment settings accurate.",
    ],
  },
  {
    title: "Orders",
    body: [
      "Orders are placed with the selected store. The store is responsible for accepting, preparing, rejecting, cancelling, delivering, or handing over orders.",
      "Prices, delivery fees, availability, pickup timing, and delivery timing may vary by store and order.",
    ],
  },
  {
    title: "Payments and refunds",
    body: [
      "Payment methods may vary by store and location.",
      "Refunds, cancellations, and order adjustments are handled according to store policies and applicable law.",
    ],
  },
  {
    title: "Content and conduct",
    body: [
      "You may not upload or share illegal, misleading, harmful, or infringing content.",
      "Storedel may restrict access, remove content, or suspend accounts when needed to protect users, stores, or the platform.",
    ],
  },
  {
    title: "Service availability",
    body: [
      "We work to keep Storedel reliable, but the service may be interrupted for maintenance, updates, network issues, or events outside our control.",
      "Storedel is provided without guarantees that every feature will always be available or error-free.",
    ],
  },
];

export default function TermsPage() {
  return (
    <main className="mx-auto min-h-dvh w-full max-w-[640px] bg-[#f4f7f8] text-gray-900">
      <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/95 px-4 py-3 backdrop-blur">
        <div className="flex h-10 items-center gap-3">
          <Link
            href="/profile"
            aria-label="Back to profile"
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-700 transition active:scale-95"
          >
            <i className="fa-solid fa-arrow-left text-sm" aria-hidden="true" />
          </Link>
          <h1 className="text-base font-bold text-gray-900">Terms of Use</h1>
        </div>
      </header>

      <section className="px-4 py-6">
        <div className="rounded-[20px] border border-gray-100 bg-white p-5">
          <p className="text-[11px] font-bold uppercase tracking-widest text-primary">
            Storedel
          </p>
          <h2 className="mt-1 text-2xl font-black tracking-tight text-gray-900">
            Terms of Use
          </h2>
          <p className="mt-2 text-xs font-medium text-gray-500">
            Last updated: October 5, 2026
          </p>
          <p className="mt-4 text-sm font-medium leading-6 text-gray-600">
            These terms apply when you use Storedel as a customer, store owner,
            or visitor.
          </p>
        </div>

        <div className="mt-4 space-y-3 pb-10">
          {sections.map((section) => (
            <section
              key={section.title}
              className="rounded-[20px] border border-gray-100 bg-white p-5"
            >
              <h2 className="text-[15px] font-extrabold text-gray-900">
                {section.title}
              </h2>
              <div className="mt-3 space-y-2">
                {section.body.map((paragraph) => (
                  <p
                    key={paragraph}
                    className="text-sm font-medium leading-6 text-gray-600"
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}

          <section className="rounded-[20px] border border-gray-100 bg-white p-5">
            <h2 className="text-[15px] font-extrabold text-gray-900">Contact</h2>
            <p className="mt-3 text-sm font-medium leading-6 text-gray-600">
              For questions about these terms, contact Storedel support through
              the app or website.
            </p>
          </section>
        </div>
      </section>
    </main>
  );
}
