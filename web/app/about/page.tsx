import Link from 'next/link';
import Image from 'next/image';
import PublicNav from '@/components/PublicNav';
import PublicFooter from '@/components/PublicFooter';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <PublicNav />

      {/* Hero */}
      <section className="relative min-h-[65vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1800&q=85"
            alt=""
            fill
            className="object-cover object-top"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-[#15161A]/75" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 py-24">
          <p className="text-sm font-semibold text-[#3D5AFE] uppercase tracking-[0.2em] mb-6">About Welfare</p>
          <h1
            className="text-6xl md:text-7xl font-semibold text-white leading-[0.95] tracking-tight mb-6 max-w-3xl"
            style={{ fontFamily: 'var(--font-geist-sans, Geist, system-ui)', textWrap: 'balance' }}
          >
            People are not headcount.
          </h1>
          <p className="text-xl text-white/70 max-w-xl leading-relaxed">
            That is the thesis. Everything else follows from it.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="py-24 max-w-7xl mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          <div>
            <h2
              className="text-4xl font-semibold text-[#15161A] leading-tight mb-8"
              style={{ fontFamily: 'var(--font-geist-sans, Geist, system-ui)', textWrap: 'balance' }}
            >
              The problem we set out to fix.
            </h2>
            <div className="space-y-5 text-lg text-[#5B5F6B] leading-relaxed">
              <p>
                The standard employee benefits package was designed for a different era. A gym discount, a health plan, maybe a gift card at Christmas. Generic. Impersonal. Forgotten by February.
              </p>
              <p>
                The problem is not the budget. Most companies spend meaningfully on benefits. The problem is that the money goes to things employees do not actually value, chosen by people who do not know what each individual needs.
              </p>
              <p>
                A new parent needs meal delivery, not a gym. A remote worker needs better internet, not a city-centre coffee shop. A person on medical leave needs care, not a wellness newsletter.
              </p>
              <p className="text-[#15161A] font-medium">
                Welfare changes the model entirely. Employees get credits. They choose what they need. Employers see where the money goes. And when something difficult happens in someone&apos;s life — a bereavement, a new baby, burnout — the system responds automatically.
              </p>
            </div>
          </div>
          <div className="space-y-4 lg:pt-12">
            <div className="relative h-72 rounded-[16px] overflow-hidden">
              <Image
                src="https://images.unsplash.com/photo-1491438590914-bc09fcaaf77a?auto=format&fit=crop&w=800&q=80"
                alt="Team members talking"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                loading="lazy"
              />
            </div>
            <div className="relative h-48 rounded-[16px] overflow-hidden">
              <Image
                src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=800&q=80"
                alt="Employee working remotely"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Life Moments origin */}
      <section className="relative py-28 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1531983412531-1f49a365ffed?auto=format&fit=crop&w=1800&q=80"
            alt=""
            fill
            className="object-cover"
            sizes="100vw"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-[#15161A]/82" />
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#E8623D]" />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto px-6 lg:px-12 text-center">
          <p className="text-sm font-semibold text-[#E8623D] uppercase tracking-[0.2em] mb-6">Life Moments</p>
          <h2
            className="text-5xl font-semibold text-white mb-8 leading-tight"
            style={{ fontFamily: 'var(--font-geist-sans, Geist, system-ui)', textWrap: 'balance' }}
          >
            The thing we are most proud of.
          </h2>
          <p className="text-xl text-white/70 leading-relaxed mb-6 max-w-2xl mx-auto">
            When an employee marks a difficult event, a care package assembles automatically. Their colleagues can contribute anonymously. Their employer approves it in a click. It takes thirty seconds and costs nothing extra.
          </p>
          <p className="text-lg font-semibold text-[#E8623D]">
            That is what it means to see someone as a human being, not a headcount. We built a system that does it by default.
          </p>
        </div>
      </section>

      {/* Values */}
      <section className="py-24 bg-[#F7F8FA]">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <h2
            className="text-4xl font-semibold text-[#15161A] mb-12 leading-tight"
            style={{ fontFamily: 'var(--font-geist-sans, Geist, system-ui)', textWrap: 'balance' }}
          >
            What we believe.
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                title: 'Personalization over uniformity',
                body: 'A benefit that fits nobody is not a benefit. Every person on your team has different needs. The system should reflect that.',
                img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=70',
              },
              {
                title: 'Transparency over guesswork',
                body: 'Employers deserve to know exactly where the budget goes. Benefits should be a conversation, not an annual review mystery.',
                img: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=70',
              },
              {
                title: 'Care as infrastructure',
                body: 'Checking in on someone when they are struggling should not require HR to remember. It should happen automatically, by design.',
                img: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=600&q=70',
              },
            ].map(({ title, body, img }) => (
              <div key={title} className="group bg-white rounded-[16px] overflow-hidden border border-[#E7E9EE] hover:shadow-[0_8px_32px_rgba(21,22,26,.08)] transition-shadow duration-300">
                <div className="relative h-48 overflow-hidden">
                  <Image
                    src={img}
                    alt={title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 33vw"
                    loading="lazy"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-base font-semibold text-[#15161A] mb-2">{title}</h3>
                  <p className="text-sm text-[#5B5F6B] leading-relaxed">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 text-center max-w-4xl mx-auto px-6 lg:px-12">
        <h2
          className="text-4xl font-semibold text-[#15161A] mb-4 leading-tight"
          style={{ fontFamily: 'var(--font-geist-sans, Geist, system-ui)', textWrap: 'balance' }}
        >
          Join us in building better benefits.
        </h2>
        <p className="text-lg text-[#5B5F6B] mb-8 max-w-md mx-auto">
          Whether you are an employer, a provider, or just curious — there is a place for you here.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/register" className="inline-flex items-center justify-center px-8 py-4 rounded-[10px] bg-[#3D5AFE] text-white font-semibold hover:bg-[#2E45C4] transition-colors duration-[120ms] focus-visible:ring-2 focus-visible:ring-[#3D5AFE]">
            Get Started
          </Link>
          <Link href="/how-it-works" className="inline-flex items-center justify-center px-8 py-4 rounded-[10px] border border-[#E7E9EE] text-[#15161A] font-semibold hover:bg-[#F7F8FA] transition-colors duration-[120ms] focus-visible:ring-2 focus-visible:ring-[#3D5AFE]">
            See How It Works
          </Link>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
