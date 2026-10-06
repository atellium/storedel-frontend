"use client";

import {
  ArrowRight,
  Check,
  ClipboardList,
  Globe2,
  Package,
  QrCode,
  Share2,
  ShoppingBag,
  Smartphone,
  Store,
} from "lucide-react";
import { AuthButton } from "@/features/auth/auth-button";

const features = [
  {
    icon: Store,
    title: "Your Online Store",
    description:
      "Give your shop its own professional online storefront with your name, products and business details.",
  },
  {
    icon: Package,
    title: "Product Catalogue",
    description:
      "Add products, prices, variants and availability from a simple dashboard.",
  },
  {
    icon: ClipboardList,
    title: "Receive Orders",
    description:
      "Customers can add products to cart and place orders directly with your store.",
  },
  {
    icon: Smartphone,
    title: "Manage From Mobile",
    description:
      "Manage products, orders and your store directly from your phone.",
  },
  {
    icon: Share2,
    title: "Share Anywhere",
    description:
      "Share your store link through WhatsApp, Facebook, Instagram or SMS.",
  },
  {
    icon: QrCode,
    title: "Store QR Code",
    description:
      "Put your QR code at your counter so existing customers can order again easily.",
  },
];

const storeTypes = [
  "Grocery Stores",
  "Vegetable Shops",
  "Bakeries",
  "Stationery Shops",
  "Pet Stores",
  "Local Retail Stores",
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background text-main">
      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-border/80 bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="text-2xl font-extrabold tracking-tight text-primary">
            Storedel
          </div>

          <nav className="hidden items-center gap-8 text-sm font-semibold text-secondary md:flex">
            <a href="#features" className="transition hover:text-main">
              Features
            </a>
            <a href="#how-it-works" className="transition hover:text-main">
              How It Works
            </a>
            <a href="#pricing" className="transition hover:text-main">
              Pricing
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <AuthButton
              href="/profile"
              className="hidden rounded-xl px-4 py-2.5 text-sm font-semibold text-main sm:block"
            >
              Profile
            </AuthButton>

            <button className="rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white transition hover:opacity-90">
              Create Store
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="overflow-hidden">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-2 lg:px-8 lg:py-28">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1.5 text-xs font-bold text-primary">
              <Store size={14} />
              Built for local shopkeepers
            </div>

            <h1 className="max-w-2xl text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
              Take your local store{" "}
              <span className="text-primary">online.</span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-7 text-secondary sm:text-lg">
              Create your digital store, showcase products, receive orders and
              let your existing customers order from you online.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button className="flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-bold text-white shadow-sm">
                Create Your Store
                <ArrowRight size={17} />
              </button>

              <button className="rounded-xl border border-border bg-white px-6 py-3.5 text-sm font-bold text-main">
                View Demo Store
              </button>
            </div>

            <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-sm text-secondary">
              <span className="flex items-center gap-1.5">
                <Check size={15} className="text-primary" />
                No technical knowledge needed
              </span>
              <span className="flex items-center gap-1.5">
                <Check size={15} className="text-primary" />
                Setup in minutes
              </span>
            </div>
          </div>

          {/* Main image / product mockup placeholder */}
          <div className="relative">
            <div className="absolute -left-10 top-10 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
            <div className="absolute -right-10 bottom-10 h-40 w-40 rounded-full bg-accent/10 blur-3xl" />

            <div className="relative mx-auto max-w-xl rounded-[2rem] border border-border bg-white p-3 shadow-xl">
              <div className="flex aspect-[4/3] items-center justify-center rounded-[1.5rem] bg-gray-100 text-center text-sm text-secondary">
                <div>
                  <Smartphone
                    size={46}
                    className="mx-auto mb-3 text-gray-400"
                  />
                  Store dashboard / mobile app
                  <br />
                  mockup placeholder
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core benefits */}
      <section className="border-y border-border bg-white">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
          {[
            {
              icon: Globe2,
              title: "Your Store Online",
              text: "A dedicated digital storefront for your business.",
            },
            {
              icon: ShoppingBag,
              title: "Sell Your Products",
              text: "Show products and accept customer orders.",
            },
            {
              icon: Share2,
              title: "Share Your Link",
              text: "Send your store directly to existing customers.",
            },
            {
              icon: ClipboardList,
              title: "Manage Orders",
              text: "View and manage every order from one place.",
            },
          ].map((item) => (
            <div key={item.title} className="flex gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <item.icon size={20} />
              </div>

              <div>
                <h3 className="font-bold">{item.title}</h3>
                <p className="mt-1 text-sm leading-6 text-secondary">
                  {item.text}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Positioning section */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="rounded-3xl bg-primary p-8 text-white sm:p-10">
            <p className="text-sm font-bold text-white/70">
              YOUR STORE. YOUR CUSTOMERS.
            </p>

            <h2 className="mt-4 text-3xl font-extrabold leading-tight sm:text-4xl">
              We don&apos;t replace your shop.
              <br />
              We make it easier to order from.
            </h2>

            <p className="mt-5 max-w-lg leading-7 text-white/80">
              Storedel gives the customers who already know your business a
              simple way to browse products and place orders online.
            </p>
          </div>

          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-primary">
              Not another marketplace
            </p>

            <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Build your own digital ordering channel
            </h2>

            <div className="mt-7 space-y-5">
              {[
                "Your own store page",
                "Your own customers",
                "Your own products and pricing",
                "Share directly using your own link",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10">
                    <Check size={15} className="text-primary" />
                  </div>
                  <span className="font-semibold">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-bold uppercase tracking-wider text-primary">
              Simple setup
            </p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Start taking orders in four steps
            </h2>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-4">
            {[
              {
                number: "01",
                title: "Create your store",
                text: "Add your store name, details and business hours.",
              },
              {
                number: "02",
                title: "Add products",
                text: "Upload your products, prices and availability.",
              },
              {
                number: "03",
                title: "Share your link",
                text: "Send your store link or QR code to your customers.",
              },
              {
                number: "04",
                title: "Receive orders",
                text: "Customers order and you manage everything from Storedel.",
              },
            ].map((step) => (
              <div
                key={step.number}
                className="relative rounded-2xl border border-border bg-background p-6"
              >
                <span className="text-sm font-extrabold text-primary">
                  {step.number}
                </span>

                <h3 className="mt-5 text-lg font-bold">{step.title}</h3>

                <p className="mt-2 text-sm leading-6 text-secondary">
                  {step.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo storefront */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-primary">
              Customer experience
            </p>

            <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Give customers a simple way to order from your shop
            </h2>

            <p className="mt-5 max-w-xl leading-7 text-secondary">
              Customers open your store link, browse products, add items to
              their cart and place an order directly with you.
            </p>

            <div className="mt-7 space-y-4">
              {[
                "Mobile-friendly storefront",
                "Product search and categories",
                "Simple cart and checkout",
                "Order status updates",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <Check size={17} className="text-primary" />
                  <span className="font-semibold">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex min-h-[420px] items-center justify-center rounded-3xl bg-gray-100 text-center text-sm text-secondary">
            <div>
              <ShoppingBag size={42} className="mx-auto mb-3 text-gray-400" />
              Customer-facing store page
              <br />
              mockup placeholder
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-wider text-primary">
              Everything you need
            </p>

            <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Simple tools for running your store online
            </h2>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-2xl border border-border bg-background p-6"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <feature.icon size={21} />
                </div>

                <h3 className="mt-5 text-lg font-bold">{feature.title}</h3>

                <p className="mt-2 text-sm leading-6 text-secondary">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Store types */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-sm font-bold uppercase tracking-wider text-primary">
            Built for local businesses
          </p>

          <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
            If customers already buy from you,
            <br className="hidden sm:block" /> Storedel can help.
          </h2>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {storeTypes.map((type) => (
            <div
              key={type}
              className="rounded-2xl border border-border bg-white p-5 text-center"
            >
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
                <Store size={25} />
              </div>

              <p className="mt-4 text-sm font-bold">{type}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Share section */}
      <section className="bg-white py-20">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div className="flex min-h-[360px] items-center justify-center rounded-3xl bg-gray-100 text-center text-sm text-secondary">
            <div>
              <QrCode size={52} className="mx-auto mb-4 text-gray-400" />
              QR / WhatsApp sharing
              <br />
              illustration placeholder
            </div>
          </div>

          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-primary">
              Bring your customers online
            </p>

            <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Share your store anywhere
            </h2>

            <p className="mt-5 max-w-xl leading-7 text-secondary">
              Every Storedel shop gets its own shareable link and QR code. Send
              it to your customers or display it inside your physical store.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              {["WhatsApp", "Facebook", "Instagram", "QR Code"].map((item) => (
                <span
                  key={item}
                  className="rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-bold"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="text-center">
            <p className="text-sm font-bold uppercase tracking-wider text-primary">
              Simple pricing
            </p>

            <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Everything your local store needs
            </h2>
          </div>

          <div className="mx-auto mt-12 max-w-lg overflow-hidden rounded-3xl border border-primary/20 bg-white shadow-lg">
            <div className="bg-primary p-7 text-white">
              <p className="font-bold">Storedel Starter</p>

              <div className="mt-3 flex items-end gap-1">
                <span className="text-4xl font-extrabold">₹999</span>
                <span className="pb-1 text-sm text-white/70">/ year</span>
              </div>

              <p className="mt-3 text-sm text-white/80">
                Everything you need to start receiving orders online.
              </p>
            </div>

            <div className="p-7">
              <div className="space-y-4">
                {[
                  "Your online store",
                  "Product catalogue",
                  "Online ordering",
                  "Store management",
                  "Store QR code",
                  "Shareable store link",
                  "Order management",
                ].map((feature) => (
                  <div key={feature} className="flex items-center gap-3">
                    <Check size={16} className="text-primary" />
                    <span className="text-sm font-semibold">{feature}</span>
                  </div>
                ))}
              </div>

              <button className="mt-7 w-full rounded-xl bg-primary py-3.5 text-sm font-bold text-white">
                Create Your Store
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-4 pb-20 sm:px-6">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-3xl bg-main px-6 py-14 text-center text-white sm:px-10">
          <h2 className="mx-auto max-w-3xl text-3xl font-extrabold tracking-tight sm:text-4xl">
            Your customers already know your shop.
            <br />
            Give them a better way to order.
          </h2>

          <p className="mx-auto mt-5 max-w-xl text-sm leading-6 text-white/65 sm:text-base">
            Create your Storedel shop, share your link and start receiving
            orders directly from your customers.
          </p>

          <button className="mt-8 inline-flex items-center gap-2 rounded-xl bg-primary px-7 py-3.5 text-sm font-bold text-white">
            Create My Store
            <ArrowRight size={17} />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-8 text-sm text-secondary sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <div>
            <div className="text-xl font-extrabold text-primary">Storedel</div>
            <p className="mt-1 text-xs">
              Technology for your local store.
            </p>
          </div>

          <div className="flex flex-wrap gap-5">
            <a href="#">Features</a>
            <a href="#">Pricing</a>
            <a href="#">Contact</a>
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
          </div>

          <p className="text-xs">
            © {new Date().getFullYear()} Storedel
          </p>
        </div>
      </footer>
    </main>
  );
}
