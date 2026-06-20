import Link from 'next/link';
import Image from 'next/image';
import PublicNav from '@/components/PublicNav';
import PublicFooter from '@/components/PublicFooter';

const CATEGORIES = [
  {
    name: 'Wellness',
    desc: 'Gym memberships, mental health apps, meditation, physiotherapy and more.',
    img: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Food',
    desc: 'Weekly meal kits, restaurant vouchers, healthy snack deliveries.',
    img: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Travel',
    desc: 'Flight credits, hotel stays, commuter passes, car rentals.',
    img: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Learning',
    desc: 'Online courses, books, conference tickets, coaching sessions.',
    img: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Connectivity',
    desc: 'Home broadband, mobile data plans, co-working memberships.',
    img: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Lifestyle',
    desc: 'Entertainment subscriptions, hobby supplies, childcare apps.',
    img: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=800&q=80',
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <PublicNav />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Background image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1800&q=85"
            alt=""
            fill
            className="object-cover object-center"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-[#15161A]/65" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#15161A]/80 via-[#15161A]/50 to-transparent" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 py-32">
          <p className="text-sm font-semibold text-[#3D5AFE] uppercase tracking-[0.2em] mb-6">
            Employee Benefits, Rebuilt
          </p>
          <h1
            className="text-6xl md:text-7xl lg:text-8xl font-semibold text-white leading-[0.95] tracking-tight mb-8 max-w-3xl"
            style={{ fontFamily: 'var(--font-geist-sans, Geist, system-ui)', textWrap: 'balance' }}
          >
            Company culture,<br />made tangible.
          </h1>
          <p className="text-xl md:text-2xl text-white/70 leading-relaxed mb-10 max-w-xl">
            Personalized, credit-based benefits that let every employee spend on what actually matters to them — not what HR guessed last quarter.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-3 px-8 py-4 rounded-[10px] bg-[#3D5AFE] text-white text-base font-semibold transition-colors duration-[120ms] hover:bg-[#2E45C4] active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
            >
              Start for Free
            </Link>
            <Link
              href="/how-it-works"
              className="inline-flex items-center justify-center gap-3 px-8 py-4 rounded-[10px] bg-white/10 text-white text-base font-semibold border border-white/20 transition-colors duration-[120ms] hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white"
            >
              See How It Works
            </Link>
          </div>
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 opacity-50">
          <div className="w-px h-12 bg-white animate-pulse" />
        </div>
      </section>

      {/* ── Stats bar ──────────────────────────────────────────────────────── */}
      <section className="bg-[#3D5AFE] py-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { n: '6', label: 'Benefit categories' },
              { n: '3', label: 'Sides of the marketplace' },
              { n: '100%', label: 'Employee choice' },
              { n: '0', label: 'Generic gift cards' },
            ].map(({ n, label }) => (
              <div key={label}>
                <p
                  className="text-5xl md:text-6xl font-bold text-white tabular"
                  style={{ fontFamily: 'var(--font-geist-sans, Geist, system-ui)' }}
                >
                  {n}
                </p>
                <p className="text-sm text-white/60 mt-2 font-medium">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Problem statement ──────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 lg:px-12 py-28">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-sm font-semibold text-[#5B5F6B] uppercase tracking-[0.15em] mb-4">The Problem</p>
            <h2
              className="text-4xl md:text-5xl font-semibold text-[#15161A] leading-tight mb-6"
              style={{ fontFamily: 'var(--font-geist-sans, Geist, system-ui)', textWrap: 'balance' }}
            >
              Benefits packages were designed in a different era.
            </h2>
            <p className="text-lg text-[#5B5F6B] leading-relaxed mb-5">
              A gym discount. A health plan. Maybe a gift card at Christmas. Generic. Impersonal. Forgotten by February. The problem is not the budget — most companies spend meaningfully on benefits.
            </p>
            <p className="text-lg text-[#5B5F6B] leading-relaxed">
              The problem is that the money goes to things employees do not actually value, chosen by people who do not know what each individual needs. A new parent needs meal delivery, not a gym membership. A remote worker needs better internet, not a city-centre coffee shop.
            </p>
          </div>
          <div className="relative h-[480px] rounded-[20px] overflow-hidden">
            <Image
              src="https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=900&q=80"
              alt="Team in a modern office"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
              loading="lazy"
            />
          </div>
        </div>
      </section>

      {/* ── Solution: Three sides alternating ─────────────────────────────── */}
      <section className="bg-[#F7F8FA] py-8">
        {/* Side 1 — Employees */}
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="relative h-[500px] rounded-[20px] overflow-hidden order-2 lg:order-1">
              <Image
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=900&q=80"
                alt="Employees collaborating"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#15161A]/40 to-transparent" />
              <div className="absolute bottom-6 left-6">
                <span className="px-3 py-1.5 bg-white/95 rounded-full text-xs font-semibold text-[#15161A]">For Employees</span>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <p className="text-sm font-semibold text-[#3D5AFE] uppercase tracking-[0.15em] mb-4">Employees</p>
              <h2
                className="text-4xl font-semibold text-[#15161A] leading-tight mb-6"
                style={{ fontFamily: 'var(--font-geist-sans, Geist, system-ui)', textWrap: 'balance' }}
              >
                Spend credits on what you actually want.
              </h2>
              <p className="text-lg text-[#5B5F6B] leading-relaxed mb-6">
                Every month, credits land in your wallet. Browse six benefit categories, pick perks from real providers, and redeem with a QR code — at the gym, at the restaurant, or online.
              </p>
              <ul className="space-y-3">
                {['Monthly credits from your employer', 'Six categories, hundreds of perks', 'Instant QR redemption', 'Life events trigger automatic care packages'].map((f) => (
                  <li key={f} className="flex items-start gap-3 text-[#5B5F6B]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#3D5AFE] mt-2 shrink-0" />
                    <span className="text-base">{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Side 2 — Employers */}
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-20 border-t border-[#E7E9EE]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-sm font-semibold text-[#3D5AFE] uppercase tracking-[0.15em] mb-4">Employers</p>
              <h2
                className="text-4xl font-semibold text-[#15161A] leading-tight mb-6"
                style={{ fontFamily: 'var(--font-geist-sans, Geist, system-ui)', textWrap: 'balance' }}
              >
                Turn benefits from a cost into a culture.
              </h2>
              <p className="text-lg text-[#5B5F6B] leading-relaxed mb-6">
                Set monthly budgets per employee or team. Build pre-configured perk bundles. See exactly where the money goes with live analytics. And when an employee goes through something difficult, be there in seconds.
              </p>
              <ul className="space-y-3 mb-8">
                {['Monthly credit budgets per team', 'Pre-configured perk bundles', 'Live spend analytics and utilization', 'One-click Life Moments care packages'].map((f) => (
                  <li key={f} className="flex items-start gap-3 text-[#5B5F6B]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#3D5AFE] mt-2 shrink-0" />
                    <span className="text-base">{f}</span>
                  </li>
                ))}
              </ul>
              <Link href="/for-employers" className="inline-flex items-center gap-2 text-[#3D5AFE] font-semibold text-sm hover:underline focus-visible:ring-2 focus-visible:ring-[#3D5AFE] rounded">
                Learn more about the employer dashboard →
              </Link>
            </div>
            <div className="relative h-[500px] rounded-[20px] overflow-hidden">
              <Image
                src="https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&w=900&q=80"
                alt="Employer reviewing analytics dashboard"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#15161A]/40 to-transparent" />
              <div className="absolute bottom-6 left-6">
                <span className="px-3 py-1.5 bg-white/95 rounded-full text-xs font-semibold text-[#15161A]">For Employers</span>
              </div>
            </div>
          </div>
        </div>

        {/* Side 3 — Providers */}
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-20 border-t border-[#E7E9EE]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="relative h-[500px] rounded-[20px] overflow-hidden order-2 lg:order-1">
              <Image
                src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=900&q=80"
                alt="Provider running a small business"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#15161A]/40 to-transparent" />
              <div className="absolute bottom-6 left-6">
                <span className="px-3 py-1.5 bg-white/95 rounded-full text-xs font-semibold text-[#15161A]">For Providers</span>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <p className="text-sm font-semibold text-[#3D5AFE] uppercase tracking-[0.15em] mb-4">Providers</p>
              <h2
                className="text-4xl font-semibold text-[#15161A] leading-tight mb-6"
                style={{ fontFamily: 'var(--font-geist-sans, Geist, system-ui)', textWrap: 'balance' }}
              >
                Reach an audience that already has budget.
              </h2>
              <p className="text-lg text-[#5B5F6B] leading-relaxed mb-6">
                List your service, set your credit price, and let employer-funded employees discover you. No cold outreach. No traditional marketing spend. Grow through a verified, motivated audience.
              </p>
              <ul className="space-y-3 mb-8">
                {['List perks in minutes', 'Set your own credit pricing', 'Redemption analytics and peak times', 'Verification badge for trust'].map((f) => (
                  <li key={f} className="flex items-start gap-3 text-[#5B5F6B]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#3D5AFE] mt-2 shrink-0" />
                    <span className="text-base">{f}</span>
                  </li>
                ))}
              </ul>
              <Link href="/for-providers" className="inline-flex items-center gap-2 text-[#3D5AFE] font-semibold text-sm hover:underline focus-visible:ring-2 focus-visible:ring-[#3D5AFE] rounded">
                Learn more about the provider portal →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Category grid ─────────────────────────────────────────────────── */}
      <section className="py-28 max-w-7xl mx-auto px-6 lg:px-12">
        <div className="mb-12">
          <p className="text-sm font-semibold text-[#5B5F6B] uppercase tracking-[0.15em] mb-4">The Catalogue</p>
          <h2
            className="text-4xl md:text-5xl font-semibold text-[#15161A] leading-tight max-w-xl"
            style={{ fontFamily: 'var(--font-geist-sans, Geist, system-ui)', textWrap: 'balance' }}
          >
            Six categories. Hundreds of perks.
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {CATEGORIES.map(({ name, desc, img }) => (
            <div
              key={name}
              className="group relative h-72 rounded-[16px] overflow-hidden cursor-default"
            >
              <Image
                src={img}
                alt={name}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#15161A]/80 via-[#15161A]/20 to-transparent transition-all duration-300 group-hover:from-[#15161A]/90" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <h3 className="text-xl font-semibold text-white mb-1">{name}</h3>
                <p className="text-sm text-white/70 leading-relaxed translate-y-2 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                  {desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Life Moments — full bleed dark coral section ───────────────────── */}
      <section className="relative min-h-[80vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1531983412531-1f49a365ffed?auto=format&fit=crop&w=1800&q=85"
            alt=""
            fill
            className="object-cover object-center"
            sizes="100vw"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-[#15161A]/80" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#E8623D]/20 to-transparent" />
        </div>

        {/* Coral accent bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-[#E8623D] z-10" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 py-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-sm font-semibold text-[#E8623D] uppercase tracking-[0.2em] mb-6">Life Moments</p>
              <h2
                className="text-5xl md:text-6xl font-semibold text-white leading-tight mb-6"
                style={{ fontFamily: 'var(--font-geist-sans, Geist, system-ui)', textWrap: 'balance' }}
              >
                When life happens, be there.
              </h2>
              <p className="text-xl text-white/70 leading-relaxed mb-8">
                An employee marks a new baby. A bereavement. A medical leave. A care package assembles automatically from the catalogue. Their teammates can contribute anonymously. You approve it in one click. They feel it for weeks.
              </p>
              <p className="text-base font-semibold text-[#E8623D]">
                Not a policy. Not a gesture. A real act of care built into the system.
              </p>
              <div className="mt-10 grid grid-cols-2 gap-4">
                {[
                  { n: '5', label: 'Life event types' },
                  { n: '1', label: 'Click to approve' },
                  { n: '∞', label: 'Team contributions' },
                  { n: '100%', label: 'Anonymous donation option' },
                ].map(({ n, label }) => (
                  <div key={label} className="border border-white/10 rounded-[12px] p-4">
                    <p className="text-3xl font-bold text-white tabular">{n}</p>
                    <p className="text-xs text-white/50 mt-1">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Illustrative care card */}
            <div className="bg-white rounded-[20px] overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.4)]">
              <div className="h-2 bg-[#E8623D]" />
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-xs font-bold text-[#E8623D] uppercase tracking-widest mb-1">New Baby</p>
                    <p className="text-xl font-semibold text-[#15161A]">Maria Silva</p>
                    <p className="text-sm text-[#5B5F6B]">Engineering · 3 years</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-[#FCEDE7] flex items-center justify-center">
                    <span className="text-xl">👶</span>
                  </div>
                </div>
                <p className="text-xs font-semibold text-[#5B5F6B] uppercase tracking-wide mb-3">Suggested care package</p>
                <div className="flex flex-wrap gap-2 mb-6">
                  {[{ n: 'Weekly Meal Kit', c: 120 }, { n: 'Childcare App Pro', c: 80 }, { n: 'Sleep Coach', c: 50 }, { n: 'Home Cleaner', c: 90 }].map((p) => (
                    <span key={p.n} className="px-3 py-1.5 bg-[#FCEDE7] border border-[#E8623D]/20 text-[#E8623D] text-xs font-semibold rounded-full">
                      {p.n} · <span className="tabular">{p.c} cr</span>
                    </span>
                  ))}
                </div>
                <div className="bg-[#F7F8FA] rounded-[10px] p-4 mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-[#5B5F6B]">Package total</p>
                    <p className="text-2xl font-bold tabular text-[#15161A]">340 <span className="text-sm font-normal text-[#5B5F6B]">credits</span></p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-[#5B5F6B]">Your boost</p>
                    <p className="text-2xl font-bold tabular text-[#E8623D]">+ 200</p>
                  </div>
                </div>
                <button
                  className="w-full py-3.5 rounded-[10px] bg-[#E8623D] text-white font-semibold text-base transition-colors duration-[120ms] hover:bg-[#D4522E] active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-[#E8623D] focus-visible:ring-offset-2"
                  aria-label="Approve care package for Maria Silva"
                >
                  Approve Care Package
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── How credits work ──────────────────────────────────────────────── */}
      <section className="py-28 max-w-7xl mx-auto px-6 lg:px-12">
        <div className="text-center mb-16">
          <p className="text-sm font-semibold text-[#5B5F6B] uppercase tracking-[0.15em] mb-4">How It Works</p>
          <h2
            className="text-4xl md:text-5xl font-semibold text-[#15161A] leading-tight"
            style={{ fontFamily: 'var(--font-geist-sans, Geist, system-ui)', textWrap: 'balance' }}
          >
            From budget to benefit in three steps.
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              step: '01',
              title: 'Employer sets the budget',
              body: 'Monthly credits per employee or team. Decide if unused credits roll over or expire. Done in two clicks.',
              img: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=700&q=80',
            },
            {
              step: '02',
              title: 'Employee spends freely',
              body: 'Browse the catalogue, pick what matters, request or redeem instantly. A QR code is their proof of purchase.',
              img: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=700&q=80',
            },
            {
              step: '03',
              title: 'Provider scans and earns',
              body: 'Employee shows QR. Provider scans it. Credits transfer. No invoicing, no delays, no middlemen.',
              img: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=700&q=80',
            },
          ].map(({ step, title, body, img }) => (
            <div key={step} className="group rounded-[16px] overflow-hidden border border-[#E7E9EE] bg-white hover:shadow-[0_8px_40px_rgba(21,22,26,.1)] transition-shadow duration-300">
              <div className="relative h-48 overflow-hidden">
                <Image
                  src={img}
                  alt={title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 33vw"
                  loading="lazy"
                />
                <div className="absolute top-4 left-4 w-10 h-10 rounded-full bg-[#3D5AFE] flex items-center justify-center">
                  <span className="text-xs font-bold text-white">{step}</span>
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-[#15161A] mb-2">{title}</h3>
                <p className="text-sm text-[#5B5F6B] leading-relaxed">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Full-bleed quote ──────────────────────────────────────────────── */}
      <section className="relative h-[50vh] min-h-[360px] flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=1800&q=80"
            alt=""
            fill
            className="object-cover object-center"
            sizes="100vw"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-[#15161A]/75" />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto px-6 lg:px-12 text-center">
          <p
            className="text-3xl md:text-4xl lg:text-5xl font-semibold text-white leading-tight"
            style={{ fontFamily: 'var(--font-geist-sans, Geist, system-ui)', textWrap: 'balance' }}
          >
            &ldquo;We see you as a human being,<br className="hidden md:block" /> not a headcount.&rdquo;
          </p>
          <p className="mt-6 text-sm text-white/50 font-medium tracking-wide uppercase">The Welfare Thesis</p>
        </div>
      </section>

      {/* ── Why Welfare ──────────────────────────────────────────────────── */}
      <section className="py-28 bg-[#F7F8FA]">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="mb-14">
            <p className="text-sm font-semibold text-[#5B5F6B] uppercase tracking-[0.15em] mb-4">Why Welfare</p>
            <h2
              className="text-4xl md:text-5xl font-semibold text-[#15161A] leading-tight max-w-xl"
              style={{ fontFamily: 'var(--font-geist-sans, Geist, system-ui)', textWrap: 'balance' }}
            >
              Built for how people actually live.
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                title: 'Radical personalization',
                body: 'Each employee chooses their own perks. No more one-size-fits-all packages that fit nobody.',
                img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=70',
              },
              {
                title: 'Real-time visibility',
                body: 'Employers see exactly where the budget goes — by category, by team, by month. Benefits stop being a black box.',
                img: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=70',
              },
              {
                title: 'Provider network',
                body: 'Every perk is from a real business — gyms, airlines, course platforms, meal kit services. Not a voucher. A relationship.',
                img: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=600&q=70',
              },
              {
                title: 'Life event care',
                body: 'Automatic care packages for the moments that matter most. New baby, medical leave, bereavement — the system responds so you don\'t have to think.',
                img: 'https://images.unsplash.com/photo-1491438590914-bc09fcaaf77a?auto=format&fit=crop&w=600&q=70',
              },
              {
                title: 'Flexible budgets',
                body: 'Monthly allocation per employee, per team, or both. Credits roll over or expire — your call. Adjust any time.',
                img: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=600&q=70',
              },
              {
                title: 'QR redemption',
                body: 'Employee shows a QR code. Provider scans it. The whole transaction takes ten seconds. No receipts, no reimbursements.',
                img: 'https://images.unsplash.com/photo-1556742031-c6961e8560b0?auto=format&fit=crop&w=600&q=70',
              },
            ].map(({ title, body, img }) => (
              <div
                key={title}
                className="group bg-white rounded-[16px] overflow-hidden border border-[#E7E9EE] hover:shadow-[0_8px_32px_rgba(21,22,26,.08)] transition-shadow duration-300"
              >
                <div className="relative h-40 overflow-hidden">
                  <Image
                    src={img}
                    alt={title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-white/10 to-transparent" />
                </div>
                <div className="p-5">
                  <h3 className="text-base font-semibold text-[#15161A] mb-2">{title}</h3>
                  <p className="text-sm text-[#5B5F6B] leading-relaxed">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────────────────── */}
      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1800&q=80"
            alt=""
            fill
            className="object-cover object-top"
            sizes="100vw"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-[#3D5AFE]/90" />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto px-6 lg:px-12 text-center">
          <h2
            className="text-5xl md:text-6xl font-semibold text-white mb-6 leading-tight"
            style={{ fontFamily: 'var(--font-geist-sans, Geist, system-ui)', textWrap: 'balance' }}
          >
            Benefits that see people,<br />not headcount.
          </h2>
          <p className="text-xl text-white/70 mb-10 max-w-lg mx-auto">
            Start free. No credit card required. Your team onboarded in minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center px-8 py-4 rounded-[10px] bg-white text-[#3D5AFE] font-semibold text-base transition-colors duration-[120ms] hover:bg-white/90 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#3D5AFE]"
            >
              Get Started Free
            </Link>
            <Link
              href="/how-it-works"
              className="inline-flex items-center justify-center px-8 py-4 rounded-[10px] border border-white/30 text-white font-semibold text-base transition-colors duration-[120ms] hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white"
            >
              See How It Works
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
