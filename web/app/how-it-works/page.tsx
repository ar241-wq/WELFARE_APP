import Link from 'next/link';
import Image from 'next/image';
import PublicNav from '@/components/PublicNav';
import PublicFooter from '@/components/PublicFooter';

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-white">
      <PublicNav />

      {/* Hero */}
      <section className="relative min-h-[60vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1800&q=85"
            alt=""
            fill
            className="object-cover object-center"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-[#15161A]/72" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 py-24">
          <p className="text-sm font-semibold text-[#3D5AFE] uppercase tracking-[0.2em] mb-6">How It Works</p>
          <h1
            className="text-6xl md:text-7xl font-semibold text-white leading-[0.95] tracking-tight mb-6 max-w-3xl"
            style={{ fontFamily: 'var(--font-geist-sans, Geist, system-ui)', textWrap: 'balance' }}
          >
            Three sides. One seamless loop.
          </h1>
          <p className="text-xl text-white/70 max-w-xl leading-relaxed">
            Employers fund it. Employees spend it. Providers deliver it. Every step has a real person behind it.
          </p>
        </div>
      </section>

      {/* Employees flow */}
      <section className="py-24 max-w-7xl mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-24">
          <div className="relative h-[460px] rounded-[20px] overflow-hidden">
            <Image
              src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=900&q=80"
              alt="Employee browsing perks"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
              loading="lazy"
            />
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#3D5AFE]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#3D5AFE] uppercase tracking-[0.15em] mb-6">For Employees</p>
            <div className="space-y-6">
              {[
                { n: '1', t: 'Receive Monthly Credits', b: 'Your employer sets a monthly budget. On the first of the month, credits land in your wallet automatically. No forms, no requests.' },
                { n: '2', t: 'Browse the Catalogue', b: 'Six categories, hundreds of real perks from real providers. Filter by category, price, or mood. Bookmark what looks good.' },
                { n: '3', t: 'Request or Redeem', b: 'Some perks are instant. Others go to your employer for a quick approval. Either way, you get a QR code — your proof of purchase.' },
                { n: '4', t: 'Show Your QR', b: 'At the gym, at the restaurant, at checkout. The provider scans it. Done. Credits transfer. No receipts. No reimbursements.' },
              ].map(({ n, t, b }) => (
                <div key={n} className="flex gap-5">
                  <div className="w-9 h-9 rounded-full bg-[#3D5AFE] flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-white">{n}</span>
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-[#15161A] mb-1">{t}</h3>
                    <p className="text-sm text-[#5B5F6B] leading-relaxed">{b}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Employers flow */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-24">
          <div>
            <p className="text-sm font-semibold text-[#3D5AFE] uppercase tracking-[0.15em] mb-6">For Employers</p>
            <div className="space-y-6">
              {[
                { n: '1', t: 'Set the Budget', b: 'Monthly credits per employee or team. Decide if unused credits roll over or expire. Done in two settings, zero spreadsheets.' },
                { n: '2', t: 'Build Bundles', b: 'Pre-configure perk packs: Remote Worker Pack, New Hire Pack, Performance Reward Pack. Assign to a team in one click.' },
                { n: '3', t: 'Approve Requests', b: 'A single queue. Each row shows employee, perk, cost, and reason. Approve or reject. No email threads.' },
                { n: '4', t: 'Watch the Data', b: 'Spend by category, utilization per team, top perks. Benefits stop being a black box and become a retention tool.' },
              ].map(({ n, t, b }) => (
                <div key={n} className="flex gap-5">
                  <div className="w-9 h-9 rounded-full bg-[#3D5AFE] flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-white">{n}</span>
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-[#15161A] mb-1">{t}</h3>
                    <p className="text-sm text-[#5B5F6B] leading-relaxed">{b}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative h-[460px] rounded-[20px] overflow-hidden">
            <Image
              src="https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&w=900&q=80"
              alt="Employer reviewing analytics"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
              loading="lazy"
            />
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#3D5AFE]" />
          </div>
        </div>

        {/* Providers flow */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="relative h-[460px] rounded-[20px] overflow-hidden">
            <Image
              src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=900&q=80"
              alt="Provider scanning QR code"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
              loading="lazy"
            />
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#3D5AFE]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#3D5AFE] uppercase tracking-[0.15em] mb-6">For Providers</p>
            <div className="space-y-6">
              {[
                { n: '1', t: 'List Your Service', b: 'Name, category, credit price, description. Go live in the catalogue immediately. No approval delay.' },
                { n: '2', t: 'Set Your Own Pricing', b: 'You decide what your service is worth in credits. No discounting forced on you. No platform commission eating your margin.' },
                { n: '3', t: 'Scan to Redeem', b: 'Employee shows QR. You scan it. Credits transfer. The whole transaction is ten seconds. No invoicing, no delays.' },
                { n: '4', t: 'Grow Without Marketing', b: 'Your analytics show what is working. The verification badge builds trust. Your audience is pre-funded and motivated.' },
              ].map(({ n, t, b }) => (
                <div key={n} className="flex gap-5">
                  <div className="w-9 h-9 rounded-full bg-[#3D5AFE] flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-white">{n}</span>
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-[#15161A] mb-1">{t}</h3>
                    <p className="text-sm text-[#5B5F6B] leading-relaxed">{b}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Life Moments */}
      <section className="relative py-28 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1531983412531-1f49a365ffed?auto=format&fit=crop&w=1800&q=80"
            alt=""
            fill
            className="object-cover object-center"
            sizes="100vw"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-[#15161A]/80" />
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#E8623D]" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-sm font-semibold text-[#E8623D] uppercase tracking-[0.2em] mb-6">Life Moments</p>
              <h2
                className="text-5xl font-semibold text-white leading-tight mb-6"
                style={{ fontFamily: 'var(--font-geist-sans, Geist, system-ui)', textWrap: 'balance' }}
              >
                The moment that changes everything.
              </h2>
              <p className="text-lg text-white/70 leading-relaxed mb-6">
                An employee marks a life event: a new baby, a medical leave, a bereavement, a relocation, or burnout. The system automatically assembles a care package from the catalogue. Teammates can contribute anonymously. The employer reviews and approves it with a credit boost in one click.
              </p>
              <p className="text-base font-semibold text-[#E8623D]">
                &ldquo;We see you as a human being, not a headcount.&rdquo; Life Moments is where that becomes real.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                {['New Baby', 'Medical Leave', 'Relocation', 'Bereavement', 'Burnout Leave'].map((e) => (
                  <span key={e} className="px-3 py-1.5 border border-[#E8623D]/40 text-[#E8623D] text-xs font-semibold rounded-full">
                    {e}
                  </span>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { n: '5', label: 'Event types' },
                { n: '1', label: 'Click to approve' },
                { n: 'Auto', label: 'Package assembly' },
                { n: '100%', label: 'Anonymous contributions' },
              ].map(({ n, label }) => (
                <div key={label} className="border border-white/10 bg-white/5 rounded-[16px] p-6 text-center">
                  <p className="text-4xl font-bold text-white tabular mb-2">{n}</p>
                  <p className="text-sm text-white/50">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 text-center max-w-4xl mx-auto px-6 lg:px-12">
        <h2
          className="text-4xl font-semibold text-[#15161A] mb-4 leading-tight"
          style={{ fontFamily: 'var(--font-geist-sans, Geist, system-ui)', textWrap: 'balance' }}
        >
          Ready to see it in action?
        </h2>
        <p className="text-lg text-[#5B5F6B] mb-8 max-w-md mx-auto">Start free. Your team onboarded in minutes. No credit card required.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/register?role=employer" className="inline-flex items-center justify-center px-8 py-4 rounded-[10px] bg-[#3D5AFE] text-white font-semibold hover:bg-[#2E45C4] transition-colors duration-[120ms] focus-visible:ring-2 focus-visible:ring-[#3D5AFE]">
            Start as Employer
          </Link>
          <Link href="/register?role=provider" className="inline-flex items-center justify-center px-8 py-4 rounded-[10px] border border-[#E7E9EE] text-[#15161A] font-semibold hover:bg-[#F7F8FA] transition-colors duration-[120ms] focus-visible:ring-2 focus-visible:ring-[#3D5AFE]">
            Join as Provider
          </Link>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
