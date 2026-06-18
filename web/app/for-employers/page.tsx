import Link from 'next/link';
import Image from 'next/image';
import PublicNav from '@/components/PublicNav';
import PublicFooter from '@/components/PublicFooter';

export default function ForEmployersPage() {
  return (
    <div className="min-h-screen bg-white">
      <PublicNav />

      {/* Hero */}
      <section className="relative min-h-[70vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=1800&q=85"
            alt=""
            fill
            className="object-cover object-center"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-[#15161A]/70" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#15161A]/80 to-transparent" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 py-28">
          <p className="text-sm font-semibold text-[#3D5AFE] uppercase tracking-[0.2em] mb-6">For Employers</p>
          <h1
            className="text-6xl md:text-7xl font-semibold text-white leading-[0.95] tracking-tight mb-6 max-w-3xl"
            style={{ fontFamily: 'var(--font-geist-sans, Geist, system-ui)', textWrap: 'balance' }}
          >
            Turn your benefits budget into a retention lever.
          </h1>
          <p className="text-xl text-white/70 max-w-xl leading-relaxed mb-10">
            Stop guessing what employees want. Give them credits to choose for themselves, and see exactly how they use it.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center justify-center px-8 py-4 rounded-[10px] bg-[#3D5AFE] text-white font-semibold hover:bg-[#2E45C4] transition-colors duration-[120ms] focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
          >
            Start for Free
          </Link>
        </div>
      </section>

      {/* Problem */}
      <section className="py-24 max-w-7xl mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-sm font-semibold text-[#5B5F6B] uppercase tracking-[0.15em] mb-4">The Reality</p>
            <h2
              className="text-4xl font-semibold text-[#15161A] leading-tight mb-6"
              style={{ fontFamily: 'var(--font-geist-sans, Geist, system-ui)', textWrap: 'balance' }}
            >
              Benefits packages that nobody asked for.
            </h2>
            <p className="text-lg text-[#5B5F6B] leading-relaxed mb-5">
              Most benefit platforms offer the same thing: a list of discounts employees never use, a health plan they barely understand, and an annual review they dread. You spend the budget. They feel nothing.
            </p>
            <p className="text-lg text-[#5B5F6B] leading-relaxed">
              Welfare changes the model entirely. You set the budget. Employees choose how to spend it. You see exactly where it goes. And when something difficult happens in someone&apos;s life, you can be there in thirty seconds.
            </p>
          </div>
          <div className="relative h-[440px] rounded-[20px] overflow-hidden">
            <Image
              src="https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=900&q=80"
              alt="Modern team workspace"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
              loading="lazy"
            />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-[#F7F8FA] py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="mb-14">
            <p className="text-sm font-semibold text-[#5B5F6B] uppercase tracking-[0.15em] mb-4">What You Get</p>
            <h2
              className="text-4xl font-semibold text-[#15161A] leading-tight max-w-xl"
              style={{ fontFamily: 'var(--font-geist-sans, Geist, system-ui)', textWrap: 'balance' }}
            >
              Everything you need to run benefits properly.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                title: 'Flexible Monthly Budgets',
                body: 'Set a monthly credit budget per employee or per team. Decide whether unused credits roll over or expire at month end. Adjust any time with no notice period.',
                img: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=800&q=80',
              },
              {
                title: 'Pre-Built Perk Bundles',
                body: 'Create "Remote Worker Pack", "New Hire Pack", or "Performance Reward Pack" and assign them to an entire team in one click. Templates, not spreadsheets.',
                img: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
              },
              {
                title: 'Live Spend Analytics',
                body: 'See spend broken down by category, utilization rate per team, and the most-claimed perks across your company. Benefits become a data-driven conversation.',
                img: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80',
              },
              {
                title: 'Life Moments Care',
                body: 'When an employee marks a life event, a care package assembles automatically. You approve it with a credit boost in seconds. They feel seen at the moment it matters most.',
                img: 'https://images.unsplash.com/photo-1531983412531-1f49a365ffed?auto=format&fit=crop&w=800&q=80',
              },
            ].map(({ title, body, img }) => (
              <div key={title} className="group bg-white rounded-[16px] overflow-hidden border border-[#E7E9EE] hover:shadow-[0_8px_40px_rgba(21,22,26,.1)] transition-shadow duration-300">
                <div className="relative h-52 overflow-hidden">
                  <Image
                    src={img}
                    alt={title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 50vw"
                    loading="lazy"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-[#15161A] mb-3">{title}</h3>
                  <p className="text-[#5B5F6B] leading-relaxed">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Approval flow */}
      <section className="py-24 max-w-7xl mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="relative h-[500px] rounded-[20px] overflow-hidden">
            <Image
              src="https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=900&q=80"
              alt="Manager reviewing approvals"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#15161A]/50 to-transparent" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#5B5F6B] uppercase tracking-[0.15em] mb-4">Perk Approvals</p>
            <h2
              className="text-4xl font-semibold text-[#15161A] leading-tight mb-6"
              style={{ fontFamily: 'var(--font-geist-sans, Geist, system-ui)', textWrap: 'balance' }}
            >
              Approve or reject perk requests in one queue.
            </h2>
            <p className="text-lg text-[#5B5F6B] leading-relaxed mb-6">
              When an employee requests a perk, it lands in your approvals queue. You see the employee, the perk, the cost, and their reason. Approve or reject in a single click. No email threads. No Slack chains.
            </p>
            <div className="grid grid-cols-3 gap-5 mb-8">
              {[
                { n: '1', label: 'Queue for all requests' },
                { n: '2', label: 'Clicks to approve' },
                { n: '0', label: 'Email threads' },
              ].map(({ n, label }) => (
                <div key={label} className="text-center border border-[#E7E9EE] rounded-[12px] p-4">
                  <p className="text-4xl font-bold text-[#3D5AFE] tabular">{n}</p>
                  <p className="text-xs text-[#5B5F6B] mt-1.5 leading-tight">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Life moments CTA */}
      <section className="relative py-28 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=1800&q=80"
            alt=""
            fill
            className="object-cover object-top"
            sizes="100vw"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-[#E8623D]/90" />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto px-6 lg:px-12 text-center">
          <p className="text-sm font-semibold text-white/70 uppercase tracking-[0.2em] mb-4">Life Moments</p>
          <h2
            className="text-5xl font-semibold text-white mb-6 leading-tight"
            style={{ fontFamily: 'var(--font-geist-sans, Geist, system-ui)', textWrap: 'balance' }}
          >
            Be there when it counts most.
          </h2>
          <p className="text-xl text-white/80 mb-10 max-w-xl mx-auto leading-relaxed">
            Five life event types. Automatic care package assembly. Anonymous team contributions. One click to approve. The system handles it — you just show up.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center justify-center px-8 py-4 rounded-[10px] bg-white text-[#E8623D] font-semibold hover:bg-white/90 transition-colors duration-[120ms] focus-visible:ring-2 focus-visible:ring-white"
          >
            Start for Free
          </Link>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
