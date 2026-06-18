'use client';

import { useEffect, useState } from 'react';
import AppShell from '@/components/AppShell';
import BarChartCard from '@/components/BarChartCard';
import AnimatedSection from '@/components/AnimatedSection';
import CountUp from '@/components/CountUp';
import { getProviderStats } from '@/lib/api';
import { mockProviderStats } from '@/lib/mock-data';
import { ShoppingBag, CreditCard, BadgeCheck, TrendingUp, Clock } from 'lucide-react';

interface ProviderStats {
  redemptions_this_month: number;
  credits_earned: number;
  is_verified?: boolean;
  redemptions_over_time: { date: string; count: number }[];
  per_perk?: { perk_name: string; redemptions: number; credits: number }[];
  peak_times?: { hour: string; count: number }[];
}

export default function ProviderDashboard() {
  const [stats, setStats] = useState<ProviderStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProviderStats()
      .then(setStats)
      .catch(() => setStats(mockProviderStats))
      .finally(() => setLoading(false));
  }, []);

  const timeData  = stats?.redemptions_over_time?.map((d) => ({ name: d.date, value: d.count })) ?? [];
  const peakData  = stats?.peak_times?.map((p) => ({ name: p.hour, value: p.count })) ?? [];
  const topPerk   = stats?.per_perk?.[0];
  const peakHour  = stats?.peak_times?.sort((a, b) => b.count - a.count)[0];

  return (
    <AppShell role="provider" pageTitle="Dashboard">
      <div className="space-y-6">

        {/* Verified badge */}
        {stats?.is_verified && (
          <AnimatedSection direction="up">
            <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 border border-emerald-200 rounded-[8px] w-fit">
              <BadgeCheck size={15} className="text-[#1F9D6B]" />
              <span className="text-sm font-medium text-[#1F9D6B]">Verified provider</span>
            </div>
          </AnimatedSection>
        )}

        {/* KPI row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Redemptions this month', value: stats?.redemptions_this_month ?? 0, suffix: '', icon: <ShoppingBag size={16} />, accent: '#3D5AFE', bg: '#3D5AFE' },
            { label: 'Credits earned',          value: stats?.credits_earned ?? 0,          suffix: ' cr', icon: <CreditCard size={16} />, accent: '#1F9D6B', bg: '#1F9D6B' },
            { label: 'Top performer',           value: topPerk?.redemptions ?? 0,           suffix: ' redemptions', icon: <TrendingUp size={16} />, accent: '#C9821A', bg: '#C9821A', subLabel: topPerk?.perk_name },
            { label: 'Peak hour',               value: 0, suffix: '', icon: <Clock size={16} />, accent: '#5B5F6B', bg: '#5B5F6B', textOverride: peakHour?.hour ?? '—', subLabel: `${peakHour?.count ?? 0} redemptions` },
          ].map(({ label, value, suffix, icon, accent, bg, subLabel, textOverride }, i) => (
            <div
              key={label}
              className="animate-fade-up bg-white rounded-[12px] shadow-[0_1px_2px_rgba(21,22,26,.04),0_4px_16px_rgba(21,22,26,.06)] p-5 hover-lift"
              style={{ animationDelay: `${i * 70}ms`, animationFillMode: 'both' }}
            >
              {loading ? (
                <div className="space-y-2">
                  <div className="h-3 shimmer rounded w-1/2" />
                  <div className="h-7 shimmer rounded w-3/4" />
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between mb-3">
                    <p className="text-xs font-medium text-[#5B5F6B]">{label}</p>
                    <span style={{ color: bg, opacity: 0.7 }}>{icon}</span>
                  </div>
                  <p className="text-2xl font-bold tabular" style={{ color: accent }}>
                    {textOverride ?? <CountUp to={value} suffix={suffix} />}
                  </p>
                  {subLabel && <p className="text-xs text-[#5B5F6B] mt-1 truncate">{subLabel}</p>}
                </>
              )}
            </div>
          ))}
        </div>

        {/* Charts */}
        <AnimatedSection direction="up" delay={100} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <BarChartCard
              title="Redemptions over time (30 days)"
              data={timeData}
              loading={loading}
              type="line"
              color="#3D5AFE"
              yLabel="Redemptions"
            />
          </div>
          <BarChartCard
            title="Peak usage hours"
            data={peakData}
            loading={loading}
            color="#5B5F6B"
            yLabel="Redemptions"
          />
        </AnimatedSection>

        {/* Per-perk leaderboard */}
        {!loading && stats?.per_perk && stats.per_perk.length > 0 && (
          <AnimatedSection direction="up" delay={180}>
            <div className="bg-white rounded-[12px] shadow-[0_1px_2px_rgba(21,22,26,.04),0_4px_16px_rgba(21,22,26,.06)] p-5">
              <p className="text-sm font-semibold text-[#15161A] mb-4">Perk performance</p>
              <div className="space-y-3">
                {stats.per_perk.map((p, i) => (
                  <div
                    key={p.perk_name}
                    className="flex items-center gap-3 animate-slide-right"
                    style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'both' }}
                  >
                    <span className="w-5 text-xs font-bold tabular text-[#5B5F6B] shrink-0">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm text-[#15161A] truncate font-medium">{p.perk_name}</p>
                        <span className="text-xs tabular font-semibold text-[#5B5F6B] shrink-0 ml-3">{p.redemptions} redeemed</span>
                      </div>
                      <div className="h-1.5 bg-[#F7F8FA] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#3D5AFE] rounded-full transition-all duration-700"
                          style={{ width: `${(p.redemptions / (stats.per_perk![0]?.redemptions || 1)) * 100}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-xs tabular text-[#5B5F6B] shrink-0 w-20 text-right">{Number(p.credits).toLocaleString()} cr</span>
                  </div>
                ))}
              </div>
            </div>
          </AnimatedSection>
        )}
      </div>
    </AppShell>
  );
}
