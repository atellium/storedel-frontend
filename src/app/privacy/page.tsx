import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | Storedel",
  description:
    "Read how Storedel collects, uses, and protects information for customers and store owners.",
  alternates: {
    canonical: "/privacy",
  },
};

const sections = [
  {
    title: "Information we collect",
    body: [
      "We collect account details such as your name, phone number, email address, saved addresses, and store information you provide.",
      "We collect order, cart, product, payment preference, fulfillment, and support information needed to operate Storedel.",
      "With permission, we may collect device notification tokens so we can send order and store updates.",
    ],
  },
  {
    title: "How we use information",
    body: [
      "We use information to create accounts, show stores and products, process orders, manage delivery or pickup, send notifications, and improve app reliability.",
      "Store owners use customer order details only to fulfill and support orders placed through their stores.",
    ],
  },
  {
    title: "Sharing",
    body: [
      "We share order details with the relevant store so the store can prepare, deliver, or hand over the order.",
      "We may use service providers for hosting, analytics, notifications, storage, and operational support. We do not sell personal information.",
    ],
  },
  {
    title: "Your choices",
    body: [
      "You can update account and address information from the app where available.",
      "You can disable browser or device notifications at any time from your device settings.",
      "You may contact us to request help with account or data questions.",
    ],
  },
  {
    title: "Security and retention",
    body: [
      "We use reasonable technical and organizational safeguards to protect information.",
      "We keep information as long as needed to provide the service, comply with legal obligations, resolve disputes, and maintain business records.",
    ],
  },
];

export default function PrivacyPage() {
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
          <h1 className="text-base font-bold text-gray-900">Privacy Policy</h1>
        </div>
      </header>

      <section className="px-4 py-6">
        <div className="rounded-[20px] border border-gray-100 bg-white p-5">
          <p className="text-[11px] font-bold uppercase tracking-widest text-primary">
            Storedel
          </p>
          <h2 className="mt-1 text-2xl font-black tracking-tight text-gray-900">
            Privacy Policy
          </h2>
          <p className="mt-2 text-xs font-medium text-gray-500">
            Last updated: October 5, 2026
          </p>
          <p className="mt-4 text-sm font-medium leading-6 text-gray-600">
            This policy explains how Storedel handles information when customers
            shop from local stores and store owners manage their business on the
            platform.
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
              For privacy questions, contact Storedel support through the app or
              website.
            </p>
          </section>
        </div>
      </section>
    </main>
  );
}
