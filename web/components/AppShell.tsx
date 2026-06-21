'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Users, CheckSquare, Package, Heart, Settings,
  BarChart2, List, PlusCircle, TrendingUp, QrCode, UsersRound,
  LogOut, Menu, X, ChevronRight, Handshake, Building2, Gift, Star,
} from 'lucide-react';
import { logout, getMe } from '@/lib/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
function resolveUrl(src?: string | null) {
  if (!src) return null;
  if (src.startsWith('http') || src.startsWith('data:')) return src;
  return `${API_URL}${src}`;
}
import { useToast } from './Toast';

type Role = 'employer' | 'provider';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  care?: boolean;
}

const employerNav: NavItem[] = [
  { label: 'Dashboard',    href: '/employer/dashboard',    icon: LayoutDashboard },
  { label: 'Employees',    href: '/employer/employees',    icon: Users },
  { label: 'Approvals',    href: '/employer/approvals',    icon: CheckSquare },
  { label: 'Bundles',      href: '/employer/bundles',      icon: Package },
  { label: 'Life Moments',    href: '/employer/life-moments', icon: Heart, care: true },
  { label: 'Teams',           href: '/employer/teams',         icon: UsersRound },
  { label: 'Departments',     href: '/employer/departments',   icon: Building2 },
  { label: 'Internal Perks',  href: '/employer/internal-perks', icon: Building2 },
  { label: 'Secret Santa',    href: '/employer/secret-santa',   icon: Gift },
  { label: 'Package Offers',  href: '/employer/packages',      icon: Handshake },
  { label: 'Settings',        href: '/employer/settings',      icon: Settings },
];

const providerNav: NavItem[] = [
  { label: 'Dashboard',      href: '/provider/dashboard',       icon: LayoutDashboard },
  { label: 'Listings',       href: '/provider/listings',        icon: List },
  { label: 'New Perk',       href: '/provider/listings/new',    icon: PlusCircle },
  { label: 'Collaborations', href: '/provider/collaborations',  icon: Handshake },
  { label: 'Analytics',      href: '/provider/analytics',       icon: TrendingUp },
  { label: 'Reputation',     href: '/provider/reputation',      icon: Star },
  { label: 'Scan QR',        href: '/provider/scan',            icon: QrCode },
];

interface AppShellProps {
  role: Role;
  children: React.ReactNode;
  pageTitle?: string;
}

export default function AppShell({ role, children, pageTitle }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<{ full_name?: string; email?: string; avatar?: string; provider_profile?: { logo?: string; company_name?: string } } | null>(null);

  useEffect(() => {
    getMe().then(setUser).catch(() => {
      setUser({ full_name: 'Demo User', email: 'demo@welfare.app' });
    });
  }, []);

  const nav = role === 'employer' ? employerNav : providerNav;

  const handleLogout = async () => {
    await logout();
    toast('Signed out', 'success');
    router.push('/login');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Brand mark */}
      <div className="px-5 py-5 border-b border-[#E7E9EE]">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-[8px] bg-[#3D5AFE] flex items-center justify-center shrink-0">
            <span className="text-white text-xs font-bold leading-none">W</span>
          </div>
          <span className="text-sm font-semibold text-[#15161A] sidebar-label">Welfare</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto" aria-label="Main navigation">
        <ul className="space-y-0.5" role="list">
          {nav.map((item) => {
            const active = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-[8px] text-sm font-medium transition-colors duration-[120ms] group ${
                    active
                      ? 'bg-[#3D5AFE]/8 text-[#3D5AFE]'
                      : 'text-[#5B5F6B] hover:bg-[#F7F8FA] hover:text-[#15161A]'
                  }`}
                  aria-current={active ? 'page' : undefined}
                >
                  <Icon size={16} className={active ? 'text-[#3D5AFE]' : 'text-[#5B5F6B] group-hover:text-[#15161A]'} />
                  <span className="sidebar-label">{item.label}</span>
                  {item.care && (
                    <span className="sidebar-label ml-auto w-1.5 h-1.5 rounded-full bg-[#E8623D]" aria-hidden="true" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-[#E7E9EE]">
        {user && (
          <div className="flex items-center gap-2.5 px-3 py-2 mb-1">
            {(() => {
              const logoSrc = resolveUrl(role === 'provider' ? user.provider_profile?.logo : user.avatar);
              return logoSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoSrc} alt="logo" className="w-7 h-7 rounded-full object-cover shrink-0 border border-[#E7E9EE]" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-[#3D5AFE]/10 flex items-center justify-center shrink-0">
                  <span className="text-xs font-semibold text-[#3D5AFE]">
                    {user.full_name?.[0]?.toUpperCase() ?? '?'}
                  </span>
                </div>
              );
            })()}
            <div className="sidebar-label min-w-0">
              <p className="text-xs font-semibold text-[#15161A] truncate">
                {role === 'provider' ? (user.provider_profile?.company_name || user.full_name) : user.full_name}
              </p>
              <p className="text-[11px] text-[#5B5F6B] truncate">{role}</p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[8px] text-sm font-medium text-[#5B5F6B] hover:bg-[#F7F8FA] hover:text-[#15161A] transition-colors duration-[120ms]"
        >
          <LogOut size={15} />
          <span className="sidebar-label">Sign out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#F7F8FA] overflow-hidden">
      {/* Sidebar — desktop */}
      <aside className="hidden lg:flex flex-col w-[240px] shrink-0 bg-white border-r border-[#E7E9EE]">
        <SidebarContent />
      </aside>

      {/* Sidebar — mobile overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div
            className="absolute inset-0 bg-[#15161A]/40"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
          <aside className="relative w-64 bg-white h-full shadow-xl z-50">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-14 bg-white border-b border-[#E7E9EE] flex items-center px-4 lg:px-6 gap-4 shrink-0">
          <button
            className="lg:hidden p-1.5 rounded-[8px] text-[#5B5F6B] hover:bg-[#F7F8FA]"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open navigation"
          >
            <Menu size={18} />
          </button>

          <div className="flex items-center gap-1.5 min-w-0">
            {pageTitle && (
              <>
                <span className="text-xs text-[#5B5F6B] capitalize hidden sm:inline">{role}</span>
                <ChevronRight size={12} className="text-[#E7E9EE] hidden sm:inline" />
                <h1 className="text-sm font-semibold text-[#15161A] truncate">{pageTitle}</h1>
              </>
            )}
          </div>

          <div className="ml-auto flex items-center gap-2">
            {user && (
              <div className="hidden sm:flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[#3D5AFE]/10 flex items-center justify-center">
                  <span className="text-xs font-semibold text-[#3D5AFE]">
                    {user.full_name?.[0]?.toUpperCase() ?? '?'}
                  </span>
                </div>
                <span className="text-sm text-[#15161A] font-medium">{user.full_name}</span>
              </div>
            )}
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>

      <style>{`
        @media (max-width: 1023px) {
          .sidebar-label { display: none; }
        }
      `}</style>
    </div>
  );
}
