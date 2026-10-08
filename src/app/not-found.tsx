import Image from "next/image";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-gradient-to-br from-green-50 via-white to-emerald-50 px-5 py-12 text-gray-900">
      <section className="w-full max-w-md text-center">
        <Link
          href="/"
          aria-label="Storedel home"
          className="relative mx-auto block h-10 w-[222px]"
        >
          <Image
            src="/images/storedel-logo.png"
            alt="Storedel"
            fill
            priority
            sizes="222px"
            className="object-contain"
          />
        </Link>

        <div className="mt-10 rounded-[24px] border border-green-100 bg-white p-7 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
          <p className="text-sm font-extrabold uppercase tracking-[0.28em] text-green-700">
            404
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-gray-950">
            Page not found
          </h1>
          <p className="mt-3 text-sm font-medium leading-6 text-gray-500">
            The page you are looking for may have moved, expired, or does not
            exist on Storedel.
          </p>

          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            <Link
              href="/stores"
              className="inline-flex h-12 items-center justify-center rounded-xl bg-green-700 px-5 text-sm font-extrabold text-white transition hover:bg-green-800"
            >
              Find stores
            </Link>
            <Link
              href="/"
              className="inline-flex h-12 items-center justify-center rounded-xl border border-gray-200 bg-white px-5 text-sm font-extrabold text-gray-700 transition hover:bg-gray-50"
            >
              Go home
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
