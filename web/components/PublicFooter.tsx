import Link from 'next/link';

export default function PublicFooter() {
  return (
    <footer className="border-t border-[#E7E9EE] py-8 mt-8">
      <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-[6px] bg-[#3D5AFE] flex items-center justify-center">
            <span className="text-white text-[10px] font-bold">W</span>
          </div>
          <span className="text-sm font-semibold text-[#15161A]">Welfare</span>
        </div>
        <nav className="flex flex-wrap items-center gap-5" aria-label="Footer navigation">
          {[
            ['How it works', '/how-it-works'],
            ['For employers', '/for-employers'],
            ['For providers', '/for-providers'],
            ['Pricing', '/pricing'],
            ['About', '/about'],
          ].map(([label, href]) => (
            <Link key={href} href={href} className="text-xs text-[#5B5F6B] hover:text-[#15161A] transition-colors">
              {label}
            </Link>
          ))}
        </nav>
        <p className="text-xs text-[#5B5F6B]">© {new Date().getFullYear()} Welfare</p>
      </div>
    </footer>
  );
}
