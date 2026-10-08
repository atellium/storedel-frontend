
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Check,
  ChevronDown,
  IndianRupee,
  MessageCircle,
  Package,
  Percent,
  Search,
  Settings,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Smartphone,
  Store,
  Truck,
  Users,
} from "lucide-react";

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "";
const WHATSAPP_MESSAGE =
  "Hi Storedel, I am interested in taking my local store online. Please share pricing and setup details.";
const WHATSAPP_URL = WHATSAPP_NUMBER
  ? `https://wa.me/${WHATSAPP_NUMBER.replace(/\D/g, "")}?text=${encodeURIComponent(
      WHATSAPP_MESSAGE,
    )}`
  : "#contact";

const categories = [
  { icon: "🛒", name: "Grocery &\nDaily Needs" },
  { icon: "🥬", name: "Fruits &\nVegetables" },
  { icon: "🥛", name: "Dairy & Bakery\nProducts" },
  { icon: "🥩", name: "Meat, Fish\n& Eggs" },
  { icon: "🧴", name: "Beauty &\nPersonal Care" },
  { icon: "🧽", name: "Home &\nHousehold" },
  { icon: "✏️", name: "Stationery\n& Gifts & Toys" },
  { icon: "📦", name: "And Many\nMore..." },
];

const features = [
  "Add and manage products",
  "Accept pickup, express and scheduled orders",
  "Set delivery range, fees and time slots",
  "Manage customers and order history",
  "Get real-time notifications",
  "No technical knowledge required",
];

const steps = [
  {
    icon: Store,
    title: "Create Your Store",
    description: "Add your store details and basic information.",
  },
  {
    icon: Package,
    title: "Add Products",
    description: "List your products with simple photos and prices.",
  },
  {
    icon: Truck,
    title: "Set Delivery Options",
    description: "Enable pickup, delivery or both within your area.",
  },
  {
    icon: Smartphone,
    title: "Start Receiving Orders",
    description: "Receive orders from your own customers.",
  },
];

const pricingBenefits = [
  {
    icon: Percent,
    title: "No commission on orders",
    description: "Keep 100% of your sales.",
  },
  {
    icon: IndianRupee,
    title: "No hidden charges",
    description: "Know exactly what you pay.",
  },
  {
    icon: ShieldCheck,
    title: "Transparent pricing",
    description: "Clear and detailed information.",
  },
  {
    icon: Store,
    title: "Simple plans for local stores",
    description: "Affordable and easy to understand.",
  },
];

const faqs = [
  {
    question: "Do I need any technical knowledge?",
    answer:
      "No. Storedel is designed to be simple for local store owners. You can add products, manage orders and control delivery settings from your phone.",
  },
  {
    question: "Can I set my own delivery charges?",
    answer:
      "Yes. You can configure your delivery fees, minimum order values, delivery areas and available delivery options.",
  },
  {
    question: "Is there any commission on orders?",
    answer:
      "No. Storedel does not charge a commission on your orders. Contact our team to learn about our subscription pricing.",
  },
  {
    question: "Does Storedel deliver my orders?",
    answer:
      "No. Your store manages its own pickup and delivery services. Storedel provides the technology to accept and manage those orders.",
  },
  {
    question: "How can customers order from my store?",
    answer:
      "You can share your store link directly with your customers. They can open your store, browse products and place orders online.",
  },
];

function Logo() {
  return (
    <a
      href="#home"
      className="relative block h-8 w-40 shrink-0 sm:h-10 sm:w-[222px]"
      aria-label="Storedel Home"
    >
      <Image
        src="/images/storedel-logo.png"
        alt="Storedel"
        fill
        priority
        // sizes="(min-width: 640px) 222px, 178px"
        className="object-contain object-left "
      />
    </a>
  );
}

function PrimaryButton({
  children,
  className = "",
  href = WHATSAPP_URL,
}: {
  children: React.ReactNode;
  className?: string;
  href?: string;
}) {
  const isExternal = href.startsWith("http");

  return (
    <a
      href={href}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noopener noreferrer" : undefined}
      className={`inline-flex items-center justify-center gap-2 rounded-xl bg-green-700 px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-green-800 ${className}`}
    >
      {children}
      <ArrowRight size={17} />
    </a>
  );
}

function FacebookIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-current">
      <path d="M14 8.4V6.6c0-.8.2-1.2 1.3-1.2h1.4V2.2C16 2.1 15.2 2 14.2 2 11.5 2 10 3.6 10 6.4v2H7.3v3.5H10V22h4V11.9h2.7l.4-3.5H14Z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-current">
      <path d="M7.8 2h8.4A5.8 5.8 0 0 1 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8A5.8 5.8 0 0 1 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2Zm0 2A3.8 3.8 0 0 0 4 7.8v8.4A3.8 3.8 0 0 0 7.8 20h8.4a3.8 3.8 0 0 0 3.8-3.8V7.8A3.8 3.8 0 0 0 16.2 4H7.8Zm8.8 1.7a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" />
    </svg>
  );
}

function CustomerPhone() {
  return (
    <div className="relative z-20 w-[205px] shrink-0 rounded-[35px] border-[7px] border-slate-900 bg-white p-2 shadow-2xl sm:w-[245px]">
      <div className="absolute left-1/2 top-2 h-5 w-20 -translate-x-1/2 rounded-full bg-slate-900" />
      <div className="overflow-hidden rounded-[24px] bg-white px-2 pb-3 pt-8">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-base font-extrabold text-green-700">
            S Storedel
          </span>
          <div className="rounded-full bg-slate-100 p-1.5">
            <Users size={13} />
          </div>
        </div>

        <div className="mb-3 flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-[10px] text-slate-500">
          <Search size={12} />
          Search your stores...
        </div>

        <div className="mb-4 rounded-xl bg-gradient-to-br from-green-100 to-emerald-50 p-3">
          <p className="max-w-[140px] text-[11px] font-bold leading-snug text-slate-800">
            Buy everyday essentials from your local store
          </p>
          <div className="mt-2 text-right text-3xl">🛒🥬</div>
        </div>

        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs font-bold">Your Stores</span>
          <span className="text-[10px] font-semibold text-green-700">
            View all
          </span>
        </div>

        {[
          { name: "Fresh Mart Store", type: "Grocery & Daily Needs", emoji: "🏪" },
          { name: "Patel Fresh Store", type: "Fruits & Vegetables", emoji: "🥦" },
        ].map((store) => (
          <div
            key={store.name}
            className="mb-2 flex items-center gap-2 rounded-lg border border-slate-100 p-2"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-2xl">
              {store.emoji}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[10px] font-bold">{store.name}</div>
              <div className="truncate text-[9px] text-slate-500">
                {store.type}
              </div>
              <div className="mt-1 text-[9px] text-green-700">● Open</div>
            </div>
            <div className="rounded bg-green-700 px-1.5 py-1 text-[8px] text-white">
              Order
            </div>
          </div>
        ))}

        <div className="mt-5 flex justify-around border-t pt-3 text-slate-500">
          {[Store, Search, ShoppingBag, Users].map((Icon, index) => (
            <Icon
              key={index}
              size={16}
              className={index === 0 ? "text-green-700" : ""}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function StorePhone() {
  const products = [
    { emoji: "🥬", name: "Vegetables" },
    { emoji: "🥛", name: "Dairy" },
    { emoji: "🍪", name: "Snacks" },
    { emoji: "🍅", name: "Fresh Items" },
    { emoji: "🍌", name: "Fruits" },
    { emoji: "🧴", name: "Household" },
  ];

  return (
    <div className="absolute left-[43%] top-7 w-[190px] rotate-[7deg] rounded-[33px] border-[7px] border-slate-900 bg-white p-2 shadow-2xl sm:left-[45%] sm:w-[225px]">
      <div className="absolute left-1/2 top-2 h-4 w-16 -translate-x-1/2 rounded-full bg-slate-900" />
      <div className="overflow-hidden rounded-[23px] bg-white pb-4 pt-7">
        <div className="flex h-20 items-center justify-center bg-gradient-to-br from-amber-100 to-orange-100 text-6xl">
          🏬
        </div>
        <div className="px-2">
          <h3 className="mt-3 text-sm font-bold">Main Store</h3>
          <p className="text-[10px] text-green-700">● Open Now</p>
          <p className="mt-1 text-[10px] text-slate-500">
            Grocery & Daily Needs
          </p>
          <div className="mt-3 flex justify-between gap-1">
            {[
              ["🛍️", "Pickup"],
              ["🛵", "Express"],
              ["📅", "Scheduled"],
            ].map(([emoji, title]) => (
              <div
                key={title}
                className="flex-1 rounded-lg bg-green-50 py-2 text-center"
              >
                <div className="text-lg">{emoji}</div>
                <p className="text-[9px]">{title}</p>
              </div>
            ))}
          </div>
          <div className="my-3 rounded-lg bg-slate-100 px-2 py-2 text-[10px] text-slate-400">
            Search products...
          </div>
          <div className="grid grid-cols-3 gap-2">
            {products.map((product) => (
              <div key={product.name} className="text-center">
                <div className="rounded-lg bg-slate-50 py-2 text-2xl">
                  {product.emoji}
                </div>
                <p className="mt-1 text-[9px]">{product.name}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardPreview() {
  const dashboardItems = [
    { icon: Package, label: "Products" },
    { icon: ShoppingBag, label: "Orders" },
    { icon: Users, label: "Customers" },
    { icon: Settings, label: "Settings" },
  ];

  return (
    <div className="relative mx-auto w-full max-w-[390px]">
      <div className="absolute inset-6 rounded-full bg-green-200/60 blur-3xl" />
      <div className="relative mx-auto w-[250px] -rotate-[7deg] rounded-[38px] border-[8px] border-slate-900 bg-white p-3 shadow-2xl sm:w-[285px]">
        <div className="absolute left-1/2 top-2 h-5 w-20 -translate-x-1/2 rounded-full bg-slate-900" />
        <div className="pb-5 pt-9">
          <p className="mb-5 text-center text-sm font-bold">My Store</p>
          <div className="mb-5 grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-blue-50 p-3">
              <ShoppingCart size={22} className="mb-3 text-blue-600" />
              <p className="text-lg font-extrabold">72</p>
              <p className="text-[10px] text-slate-500">Total Orders</p>
            </div>
            <div className="rounded-xl bg-green-50 p-3">
              <BarChart3 size={22} className="mb-3 text-green-700" />
              <p className="text-lg font-extrabold">₹12,450</p>
              <p className="text-[10px] text-slate-500">This Month</p>
            </div>
          </div>
          {dashboardItems.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-3 border-b border-slate-100 py-3 text-xs font-semibold"
            >
              <Icon size={17} className="text-slate-700" />
              {label}
            </div>
          ))}
        </div>
      </div>
      <div className="absolute bottom-16 right-0 flex items-center gap-3 rounded-xl border border-slate-100 bg-white px-4 py-3 shadow-xl sm:-right-4">
        <div className="rounded-full bg-green-100 p-2 text-green-700">
          <ShoppingCart size={22} />
        </div>
        <div>
          <p className="text-xs font-bold">New Order</p>
          <p className="text-[10px] text-slate-500">A new order received!</p>
          <p className="text-[10px] text-slate-400">#1234 · 3 items</p>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <div
      id="home"
      className="min-h-screen overflow-x-hidden bg-white font-sans text-slate-900"
    >
      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/95 backdrop-blur-md">
        <nav className="mx-auto flex h-17 max-w-7xl items-center justify-between px-5 py-3 lg:px-8">
          <Logo />

          <div className="hidden items-center gap-8 text-sm font-medium text-slate-700 md:flex">
            {[
              ["Home", "#home"],
              ["For Store Owners", "#features"],
              ["How It Works", "#how-it-works"],
              ["Pricing", "#pricing"],
              ["FAQs", "#faqs"],
            ].map(([label, href]) => (
              <a
                key={label}
                href={href}
                className="transition hover:text-green-700"
              >
                {label}
              </a>
            ))}
          </div>

          <PrimaryButton className="!px-4 !py-2.5">
            Get Started
          </PrimaryButton>
        </nav>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-green-50 via-white to-emerald-100">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 pb-16 pt-14 lg:min-h-[590px] lg:grid-cols-2 lg:px-8 lg:py-20">
          <div className="relative z-10">
            <div className="mb-5 inline-flex rounded-full border border-green-200 bg-white/80 px-4 py-2 text-xs font-semibold text-green-800">
              A Simple App for Local Store Owners
            </div>

            <h1 className="max-w- text-4xl font-extrabold leading-[1.12] tracking-tight text-slate-900 sm:text-5xl lg:text-[62px]">
              Take Your
              <br />
              Local Store
              <br />
              <span className="text-green-700">Online Easily</span>
            </h1>

            <p className="mt-6 max-w-lg text-base leading-relaxed text-slate-600">
              Storedel helps local store owners create an online store and
              receive orders from their own customers. No technical skills
              needed. Just simple tools to run your business online.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <PrimaryButton>Get Started</PrimaryButton>
              <a
                href="#features"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-semibold shadow-sm transition hover:bg-slate-50"
              >
                Explore Features
                <ArrowUpRight size={17} className="text-green-700" />
              </a>
            </div>

            <div className="mt-10 grid max-w-lg grid-cols-4 gap-4">
              {[
                { icon: Package, label: "Manage Products" },
                { icon: ShoppingBag, label: "Receive Orders" },
                { icon: Truck, label: "Pickup & Delivery" },
                { icon: BarChart3, label: "Grow Your Business" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="text-center">
                  <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-white text-green-700 shadow-sm">
                    <Icon size={23} />
                  </div>
                  <p className="text-[11px] font-medium leading-tight sm:text-xs">
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative flex h-[390px] items-center justify-center sm:h-[470px] lg:h-[510px]">
            <div className="absolute h-[320px] w-[320px] rounded-full bg-green-200/70 blur-3xl sm:h-[440px] sm:w-[440px]" />
            <div className="relative h-[370px] w-[370px] scale-[0.88] sm:scale-100">
              <StorePhone />
              <div className="absolute left-0 top-0">
                <CustomerPhone />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STORE CATEGORIES */}
      <section className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl">
            Perfect for All Types of{" "}
            <span className="text-green-700">Local Stores</span>
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
            From grocery stores and kirana shops to fruits, vegetables,
            household essentials and more. Storedel works for physical stores
            selling real products.
          </p>
        </div>

        <div className="grid grid-cols-4 gap-4 md:grid-cols-8">
          {categories.map((category) => (
            <div key={category.name} className="text-center">
              <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 text-4xl transition hover:bg-green-50 sm:h-20 sm:w-20">
                {category.icon}
              </div>
              <p className="whitespace-pre-line text-[11px] font-semibold leading-snug sm:text-xs">
                {category.name}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* STORE OWNER FEATURES */}
      <section id="features" className="scroll-mt-24 px-4 pb-16 lg:px-8">
        <div className="mx-auto grid max-w-7xl items-center gap-10 overflow-hidden rounded-3xl bg-gradient-to-br from-green-50 to-emerald-50 px-5 py-12 md:grid-cols-2 md:px-12">
          <div className="relative flex min-h-[380px] items-center justify-center">
            <DashboardPreview />
          </div>

          <div>
            <h2 className="text-3xl font-extrabold leading-tight tracking-tight md:text-4xl">
              Simple Tools for
              <br />
              <span className="text-green-700">Store Owners</span>
            </h2>

            <p className="mt-4 max-w-lg text-slate-600">
              Run your store your way with powerful yet easy-to-use tools,
              right from your mobile phone.
            </p>

            <ul className="mt-6 space-y-4">
              {features.map((feature) => (
                <li key={feature} className="flex items-start gap-3 text-sm">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-700 text-white">
                    <Check size={13} />
                  </span>
                  <span className="font-medium text-slate-700">{feature}</span>
                </li>
              ))}
            </ul>

            <PrimaryButton className="mt-8">
              Get Started for Your Store
            </PrimaryButton>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section
        id="how-it-works"
        className="scroll-mt-24 px-5 pb-20 pt-3 lg:px-8"
      >
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-green-800 md:text-4xl">
              How It Works
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Get your store online in just a few simple steps.
            </p>
          </div>

          <div className="grid gap-9 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={step.title} className="relative text-center">
                  <div className="relative mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-green-50 text-green-700">
                    <Icon size={34} strokeWidth={1.8} />
                    <span className="absolute -left-3 top-0 flex h-8 w-8 items-center justify-center rounded-full bg-green-700 text-sm font-bold text-white">
                      {index + 1}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold">{step.title}</h3>
                  <p className="mx-auto mt-2 max-w-[215px] text-sm leading-relaxed text-slate-600">
                    {step.description}
                  </p>
                  {index !== steps.length - 1 && (
                    <ArrowRight
                      size={19}
                      className="absolute -right-5 top-8 hidden text-slate-300 lg:block"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FULL WIDTH PRICING */}
      <section id="pricing" className="scroll-mt-24 px-4 pb-16 lg:px-8">
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 overflow-hidden rounded-3xl bg-gradient-to-br from-green-50 via-emerald-50 to-green-100 px-6 py-10 md:grid-cols-[1.1fr_1fr] md:px-12 lg:gap-16 lg:py-14">
          <div className="relative z-10">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-semibold text-green-800 shadow-sm">
              <ShieldCheck size={14} />
              Honest & Transparent Pricing
            </div>

            <h2 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-[43px]">
              Simple & Transparent
              <br />
              Pricing{" "}
              <span className="text-green-700">for Local Stores</span>
            </h2>

            <p className="mt-5 max-w-lg text-base leading-relaxed text-slate-600">
              Get in touch with us for detailed pricing information. No
              commission on orders. No hidden charges. Just simple and
              transparent plans designed for local stores like yours.
            </p>

            <PrimaryButton className="mt-7 w-full text-base sm:w-auto sm:px-9">
              Contact Us for Pricing
            </PrimaryButton>
          </div>

          <div className="relative z-10 grid gap-3 rounded-2xl border border-green-100 bg-white/90 p-5 shadow-sm sm:p-6">
            {pricingBenefits.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="flex items-center gap-4 border-b border-slate-100 pb-3 last:border-0 last:pb-0"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700">
                  <Icon size={23} />
                </div>
                <div>
                  <h3 className="text-sm font-bold sm:text-base">{title}</h3>
                  <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">
                    {description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="pointer-events-none absolute -bottom-14 -right-14 h-48 w-48 rounded-full bg-green-300/30 blur-3xl" />
        </div>
      </section>

      {/* FAQ */}
      <section id="faqs" className="scroll-mt-24 px-5 pb-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-extrabold tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Quick answers to common questions.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.7fr_1fr]">
            <div className="space-y-3">
              {faqs.map((faq) => (
                <details
                  key={faq.question}
                  className="group rounded-xl border border-slate-200 bg-white open:border-green-200 open:bg-green-50/30"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-4 text-sm font-semibold [&::-webkit-details-marker]:hidden">
                    {faq.question}
                    <ChevronDown
                      size={18}
                      className="shrink-0 text-slate-400 transition-transform group-open:rotate-180"
                    />
                  </summary>
                  <p className="px-4 pb-4 text-sm leading-relaxed text-slate-600">
                    {faq.answer}
                  </p>
                </details>
              ))}
            </div>

            <div className="flex flex-col justify-center rounded-2xl bg-gradient-to-br from-green-50 to-emerald-100 p-8">
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-green-700 text-white">
                <MessageCircle size={27} />
              </div>
              <h3 className="text-xl font-bold">Still have questions?</h3>
              <p className="mt-2 text-sm text-slate-600">
                Our team is happy to help! Get in touch for more information
                about Storedel.
              </p>
              <PrimaryButton className="mt-6 self-start">
                Contact Us
              </PrimaryButton>
            </div>
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="scroll-mt-24 px-4 pb-16 lg:px-8">
        <div className="mx-auto max-w-7xl rounded-3xl bg-slate-900 px-6 py-12 text-white md:px-12">
          <div className="grid items-center gap-9 md:grid-cols-[1.25fr_1fr]">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-green-300">
                <MessageCircle size={15} />
                Let&apos;s Talk
              </div>
              <h2 className="text-3xl font-extrabold leading-tight md:text-4xl">
                Ready to Take Your
                <br />
                <span className="text-green-400">Store Online?</span>
              </h2>
              <p className="mt-4 max-w-lg text-sm leading-relaxed text-slate-300">
                Contact our team to learn how Storedel can help you manage
                products, receive orders and run your business online. Ask us
                about our simple pricing plans.
              </p>

              <div className="mt-7 flex flex-wrap gap-3 text-xs text-green-200">
                <span className="inline-flex items-center gap-1.5">
                  <Check size={15} /> No order commission
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Check size={15} /> No hidden charges
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Check size={15} /> Simple setup
                </span>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-6 text-slate-900 sm:p-8">
              <h3 className="text-xl font-extrabold">Contact for Pricing</h3>
              <p className="mt-2 text-sm text-slate-500">
                Have a store? Get in touch and we&apos;ll help you explore Storedel.
              </p>

              <PrimaryButton className="mt-6 w-full px-5">
                Chat on WhatsApp
              </PrimaryButton>

              <p className="mt-4 text-center text-xs text-slate-500">
                We&apos;ll reply with pricing and setup details.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="bg-gradient-to-r from-green-50 to-emerald-50 px-5 py-10 lg:px-8">
        <div className="mx-auto flex max-w-xs flex-col items-center justify-between gap-5 text-center md:flex-row md:text-left">
          <div>
            <h2 className="text-2xl font-extrabold">
              Ready to Take Your Store Online?
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Bring your local store online with simple technology from
              Storedel.
            </p>
          </div>
          <PrimaryButton>Get Started Now</PrimaryButton>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-100 bg-white px-5 py-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6">
          <Logo />

          <div className="flex items-center gap-3">
            <span
              aria-label="Facebook"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#1877F2]/15 bg-[#1877F2]/10 text-[#1877F2] transition hover:bg-[#1877F2] hover:text-white"
            >
              <FacebookIcon />
            </span>
            <span
              aria-label="Instagram"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#E4405F]/15 bg-[#E4405F]/10 text-[#E4405F] transition hover:bg-[#E4405F] hover:text-white"
            >
              <InstagramIcon />
            </span>
          </div>
        </div>

        <div className="mx-auto mt-5 flex max-w-7xl flex-wrap items-center justify-center gap-x-6 gap-y-3 border-t border-slate-100 pt-5 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} Storedel. All rights reserved.</p>
          <div className="flex flex-wrap gap-5 text-slate-500">
            <Link href="/privacy" className="hover:text-green-700">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-green-700">
              Terms of Use
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
