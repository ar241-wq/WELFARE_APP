import Link from 'next/link';
import Image from 'next/image';
import PublicNav from '@/components/PublicNav';
import PublicFooter from '@/components/PublicFooter';

const PLANS = [
  {
    name: 'Starter',
    price: 'Free',
    sub: 'Up to 10 employees',
    features: ['Monthly credit allocations', 'Up to 3 perk bundles', 'Basic analytics', 'Email support'],
    cta: 'Get Started',
    href: '/register',
    highlight: false,
  },
  {
    name: 'Growth',
    price: '£4',
    sub: 'per employee / month',
    features: ['Everything in Starter', 'Unlimited employees', 'Unlimited bundles', 'Life Moments', 'Full analytics', 'Team management', 'Priority support'],
    cta: 'Start Free Trial',
    href: '/register',
    highlight: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    sub: 'For large organisations',
    features: ['Everything in Growth', 'Custom credit policies', 'SSO & HRIS integrations', 'Dedicated account manager', 'SLA guarantee'],
    cta: 'Contact Us',
    href: '/about',
    highlight: false,
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white">
      <PublicNav />

      {/* Hero */}
      <section className="relative min-h-[50vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=1800&q=85"
            alt=""
            fill
            className="object-cover object-center"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-[#15161A]/78" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 py-24 text-center w-full">
          <p className="text-sm font-semibold text-[#3D5AFE] uppercase tracking-[0.2em] mb-4">Pricing</p>
          <h1
            className="text-6xl font-semibold text-white leading-tight mb-4"
            style={{ fontFamily: 'var(--font-geist-sans, Geist, system-ui)', textWrap: 'balance' }}
          >
            Simple, transparent pricing.
          </h1>
          <p className="text-xl text-white/70 max-w-md mx-auto">Start free. Scale as your team grows. No hidden fees.</p>
        </div>
      </section>

      {/* Plans */}
      <section className="py-20 max-w-7xl mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-[16px] overflow-hidden ${
                plan.highlight
                  ? 'bg-[#3D5AFE] shadow-[0_16px_60px_rgba(61,90,254,.3)]'
                  : 'bg-white border border-[#E7E9EE] shadow-[0_4px_16px_rgba(21,22,26,.06)]'
              }`}
            >
              {plan.highlight && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-white/30" />
              )}
              <div className="p-8">
                {plan.highlight && (
                  <p className="text-xs font-bold uppercase tracking-wider text-white/50 mb-3">Most popular</p>
                )}
                <h3 className={`text-2xl font-semibold mb-2 ${plan.highlight ? 'text-white' : 'text-[#15161A]'}`}>
                  {plan.name}
                </h3>
                <div className="mb-2">
                  <span className={`text-5xl font-bold tabular ${plan.highlight ? 'text-white' : 'text-[#15161A]'}`}>
                    {plan.price}
                  </span>
                </div>
                <p className={`text-sm mb-8 ${plan.highlight ? 'text-white/60' : 'text-[#5B5F6B]'}`}>{plan.sub}</p>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-3">
                      <span className={`w-1.5 h-1.5 rounded-full mt-2 shrink-0 ${plan.highlight ? 'bg-white/50' : 'bg-[#3D5AFE]'}`} />
                      <span className={`text-sm ${plan.highlight ? 'text-white/80' : 'text-[#5B5F6B]'}`}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.href}
                  className={`flex items-center justify-center w-full px-5 py-3 rounded-[10px] font-semibold text-sm transition-colors duration-[120ms] focus-visible:ring-2 ${
                    plan.highlight
                      ? 'bg-white text-[#3D5AFE] hover:bg-white/90 focus-visible:ring-white'
                      : 'bg-[#3D5AFE] text-white hover:bg-[#2E45C4] focus-visible:ring-[#3D5AFE]'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            </div>
          ))}
        </div>
        <p className="text-center text-sm text-[#5B5F6B] mt-8">
          Pricing is illustrative. Contact us for exact figures before committing.
        </p>
      </section>

      {/* FAQ */}
      <section className="bg-[#F7F8FA] py-24">
        <div className="max-w-3xl mx-auto px-6 lg:px-12">
          <h2
            className="text-3xl font-semibold text-[#15161A] mb-12 text-center"
            style={{ fontFamily: 'var(--font-geist-sans, Geist, system-ui)' }}
          >
            Common questions.
          </h2>
          <div className="space-y-6">
            {[
              { q: 'What counts as an employee?', a: 'Any person who has a wallet and receives monthly credit allocations. Admins and HR managers who only manage the platform are not counted.' },
              { q: 'Do unused credits roll over?', a: 'That is your choice. In Settings, you can toggle whether unused credits carry into the next month or expire. You can change this at any time.' },
              { q: 'How do providers get paid?', a: 'Credits are converted to cash on a monthly settlement cycle. Providers set their own credit prices when listing a perk.' },
              { q: 'Is Life Moments available on all plans?', a: 'Life Moments is available on Growth and above. It requires the full analytics stack to track event types and suggested packages.' },
              { q: 'Can I upgrade or downgrade mid-cycle?', a: 'Yes. Upgrades take effect immediately. Downgrades take effect at the start of the next billing cycle.' },
            ].map(({ q, a }) => (
              <div key={q} className="bg-white rounded-[12px] border border-[#E7E9EE] p-6">
                <h3 className="text-base font-semibold text-[#15161A] mb-2">{q}</h3>
                <p className="text-sm text-[#5B5F6B] leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-28 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1800&q=80"
            alt=""
            fill
            className="object-cover"
            sizes="100vw"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-[#3D5AFE]/90" />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto px-6 lg:px-12 text-center">
          <h2
            className="text-5xl font-semibold text-white mb-6"
            style={{ fontFamily: 'var(--font-geist-sans, Geist, system-ui)', textWrap: 'balance' }}
          >
            Start free today. No credit card required.
          </h2>
          <Link
            href="/register"
            className="inline-flex items-center justify-center px-8 py-4 rounded-[10px] bg-white text-[#3D5AFE] font-semibold hover:bg-white/90 transition-colors duration-[120ms] focus-visible:ring-2 focus-visible:ring-white"
          >
            Get Started Free
          </Link>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
