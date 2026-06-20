import Link from 'next/link';

export default function PublicNav() {
  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-sm border-b border-[#E7E9EE]">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-[8px] bg-[#3D5AFE] flex items-center justify-center">
            <span className="text-white text-xs font-bold">W</span>
          </div>
          <span className="text-sm font-semibold text-[#15161A]">Welfare</span>
        </Link>
        <nav className="hidden md:flex items-center gap-6" aria-label="Site navigation">
          {[
            ['How it works', '/how-it-works'],
            ['For employers', '/for-employers'],
            ['For providers', '/for-providers'],
            ['About', '/about'],
          ].map(([label, href]) => (
            <Link key={href} href={href} className="text-sm text-[#5B5F6B] hover:text-[#15161A] transition-colors duration-[120ms]">
              {label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm font-medium text-[#5B5F6B] hover:text-[#15161A] transition-colors">Sign in</Link>
          <Link href="/register" className="px-4 py-2 rounded-[8px] bg-[#3D5AFE] text-white text-sm font-semibold hover:bg-[#2E45C4] transition-colors duration-[120ms]">
            Get started
          </Link>
        </div>
      </div>
    </header>
  );
}
