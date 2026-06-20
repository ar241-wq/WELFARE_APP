import Link from 'next/link';
import Image from 'next/image';
import PublicNav from '@/components/PublicNav';
import PublicFooter from '@/components/PublicFooter';

export default function ForProvidersPage() {
  return (
    <div className="min-h-screen bg-white">
      <PublicNav />

      {/* Hero */}
      <section className="relative min-h-[70vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1800&q=85"
            alt=""
            fill
            className="object-cover object-center"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-[#15161A]/72" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#15161A]/85 to-transparent" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 py-28">
          <p className="text-sm font-semibold text-[#3D5AFE] uppercase tracking-[0.2em] mb-6">For Providers</p>
          <h1
            className="text-6xl md:text-7xl font-semibold text-white leading-[0.95] tracking-tight mb-6 max-w-3xl"
            style={{ fontFamily: 'var(--font-geist-sans, Geist, system-ui)', textWrap: 'balance' }}
          >
            Reach an audience that already has budget to spend.
          </h1>
          <p className="text-xl text-white/70 max-w-xl leading-relaxed mb-10">
            List your service, set your credit price, and let employer-funded employees discover you — without cold outreach or traditional marketing.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center justify-center px-8 py-4 rounded-[10px] bg-[#3D5AFE] text-white font-semibold hover:bg-[#2E45C4] transition-colors duration-[120ms] focus-visible:ring-2 focus-visible:ring-white"
          >
            List Your Service
          </Link>
        </div>
      </section>

      {/* Why Welfare */}
      <section className="py-24 max-w-7xl mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-sm font-semibold text-[#5B5F6B] uppercase tracking-[0.15em] mb-4">The Opportunity</p>
            <h2
              className="text-4xl font-semibold text-[#15161A] leading-tight mb-6"
              style={{ fontFamily: 'var(--font-geist-sans, Geist, system-ui)', textWrap: 'balance' }}
            >
              Your next customers already have money set aside for you.
            </h2>
            <p className="text-lg text-[#5B5F6B] leading-relaxed mb-5">
              Welfare connects you to employees who have monthly credit budgets specifically for services like yours. They are not browsing on a whim. They have employer-allocated credits and they need to spend them.
            </p>
            <p className="text-lg text-[#5B5F6B] leading-relaxed">
              You set your own pricing in credits. You control what you offer. And unlike discount platforms, you are not racing to the bottom — you are pricing on value.
            </p>
          </div>
          <div className="relative h-[440px] rounded-[20px] overflow-hidden">
            <Image
              src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=900&q=80"
              alt="Provider serving customers"
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
            <h2
              className="text-4xl font-semibold text-[#15161A] leading-tight max-w-xl"
              style={{ fontFamily: 'var(--font-geist-sans, Geist, system-ui)', textWrap: 'balance' }}
            >
              Everything a provider needs to grow.
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                title: 'List in Minutes',
                body: 'Name, category, credit price, description. Your perk goes live in the catalogue immediately. No approval waiting period.',
                img: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=700&q=80',
              },
              {
                title: 'Your Pricing, Your Rules',
                body: 'You decide what your service costs in credits. No race to the bottom, no platform dictating your margins. Adjust at any time.',
                img: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=700&q=80',
              },
              {
                title: 'QR Redemption',
                body: 'Employee shows their QR code. You scan it with the provider app. Credits transfer instantly. No invoicing. No chasing payments.',
                img: 'https://images.unsplash.com/photo-1556742031-c6961e8560b0?auto=format&fit=crop&w=700&q=80',
              },
              {
                title: 'Redemption Analytics',
                body: 'See which perks perform, at what times, and how much you have earned. Turn your presence on Welfare into a data-driven growth channel.',
                img: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=700&q=80',
              },
              {
                title: 'Verification Badge',
                body: 'Apply for provider verification. The badge builds trust with employers who curate bundles and employees who browse the catalogue.',
                img: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=700&q=80',
              },
              {
                title: 'No Marketing Spend',
                body: 'You are discovered by employees who have specific budget for your category. Your growth here does not require ads, SEO, or cold email.',
                img: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=700&q=80',
              },
            ].map(({ title, body, img }) => (
              <div key={title} className="group bg-white rounded-[16px] overflow-hidden border border-[#E7E9EE] hover:shadow-[0_8px_32px_rgba(21,22,26,.08)] transition-shadow duration-300">
                <div className="relative h-44 overflow-hidden">
                  <Image
                    src={img}
                    alt={title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 33vw"
                    loading="lazy"
                  />
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

      {/* Categories you can list in */}
      <section className="py-24 max-w-7xl mx-auto px-6 lg:px-12">
        <div className="mb-10">
          <h2
            className="text-4xl font-semibold text-[#15161A] leading-tight mb-4"
            style={{ fontFamily: 'var(--font-geist-sans, Geist, system-ui)', textWrap: 'balance' }}
          >
            Six categories. Your service fits one.
          </h2>
          <p className="text-lg text-[#5B5F6B] max-w-xl">
            If you run a gym, a course platform, a meal service, a broadband provider, a travel company, or anything in between — there is a category for you.
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { name: 'Wellness', img: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=400&q=70' },
            { name: 'Food', img: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=70' },
            { name: 'Travel', img: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=400&q=70' },
            { name: 'Learning', img: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=400&q=70' },
            { name: 'Connectivity', img: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=400&q=70' },
            { name: 'Lifestyle', img: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=400&q=70' },
          ].map(({ name, img }) => (
            <div key={name} className="group relative h-40 rounded-[12px] overflow-hidden">
              <Image
                src={img}
                alt={name}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 768px) 50vw, 16vw"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#15161A]/70 to-transparent" />
              <p className="absolute bottom-3 left-3 text-sm font-semibold text-white">{name}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-28 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1800&q=80"
            alt=""
            fill
            className="object-cover object-top"
            sizes="100vw"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-[#3D5AFE]/88" />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto px-6 lg:px-12 text-center">
          <h2
            className="text-5xl font-semibold text-white mb-6 leading-tight"
            style={{ fontFamily: 'var(--font-geist-sans, Geist, system-ui)', textWrap: 'balance' }}
          >
            Start listing today. Free to join.
          </h2>
          <p className="text-xl text-white/70 mb-10 max-w-md mx-auto">
            Add your first perk in under five minutes. Reach employer-funded employees from day one.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center justify-center px-8 py-4 rounded-[10px] bg-white text-[#3D5AFE] font-semibold hover:bg-white/90 transition-colors duration-[120ms] focus-visible:ring-2 focus-visible:ring-white"
          >
            Join as a Provider
          </Link>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
