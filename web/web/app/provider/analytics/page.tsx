'use client';

import { useEffect, useState } from 'react';
import AppShell from '@/components/AppShell';
import BarChartCard from '@/components/BarChartCard';
import DataTable, { Column } from '@/components/DataTable';
import AnimatedSection from '@/components/AnimatedSection';
import CountUp from '@/components/CountUp';
import { getProviderStats } from '@/lib/api';
import { mockProviderStats } from '@/lib/mock-data';
import { TrendingUp, Award, Clock, CreditCard } from 'lucide-react';

interface PerkStat { perk_name: string; redemptions: number; credits: number; }
interface PeakTime  { hour: string; count: number; }
interface Stats {
  per_perk?:  PerkStat[];
  peak_times?: PeakTime[];
  redemptions_this_month?: number;
  credits_earned?: number;
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProviderStats()
      .then(setStats)
      .catch(() => setStats(mockProviderStats))
      .finally(() => setLoading(false));
  }, []);

  const peakData   = stats?.peak_times?.map((p) => ({ name: p.hour, value: p.count })) ?? [];
  const perPerkData = stats?.per_perk?.map((p) => ({ name: p.perk_name.replace(/\s*\([^)]*\)/, ''), value: p.redemptions })) ?? [];

  const bestHour = stats?.peak_times?.sort((a, b) => b.count - a.count)[0];
  const totalCr  = stats?.per_perk?.reduce((s, p) => s + p.credits, 0) ?? 0;

  const perkCols: Column<PerkStat>[] = [
    {
      key: 'perk_name', header: 'Perk',
      render: (r) => <span className="font-medium text-[#15161A] text-sm">{r.perk_name}</span>,
    },
    {
      key: 'redemptions', header: 'Redemptions', align: 'right',
      render: (r) => (
        <div className="flex items-center justify-end gap-2">
          <div className="h-1 w-16 bg-[#F7F8FA] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#3D5AFE] rounded-full"
              style={{ width: `${(r.redemptions / ((stats?.per_perk?.[0]?.redemptions) || 1)) * 100}%` }}
            />
          </div>
          <span className="tabular font-semibold text-sm w-6 text-right">{r.redemptions}</span>
        </div>
      ),
    },
    {
      key: 'credits', header: 'Credits earned', align: 'right',
      render: (r) => <span className="tabular text-sm">{Number(r.credits).toLocaleString()} cr</span>,
    },
  ];

  return (
    <AppShell role="provider" pageTitle="Analytics">
      <div className="space-y-6">
        <AnimatedSection direction="up">
          <h2 className="text-base font-semibold text-[#15161A]">Performance analytics</h2>
          <p className="text-xs text-[#5B5F6B] mt-0.5">Track your perk redemptions, peak hours, and earnings</p>
        </AnimatedSection>

        {/* Summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Total redemptions', value: stats?.redemptions_this_month ?? 0, suffix: '', icon: <TrendingUp size={14} />, color: '#3D5AFE' },
            { label: 'Credits earned',    value: totalCr,                            suffix: ' cr', icon: <CreditCard size={14} />, color: '#1F9D6B' },
            { label: 'Top perk',          value: stats?.per_perk?.[0]?.redemptions ?? 0, suffix: ' redeemed', icon: <Award size={14} />, color: '#C9821A', sub: stats?.per_perk?.[0]?.perk_name },
            { label: 'Peak hour',         value: 0, suffix: '', icon: <Clock size={14} />, color: '#5B5F6B', textOverride: bestHour?.hour ?? '—', sub: `${bestHour?.count ?? 0} at peak` },
          ].map(({ label, value, suffix, icon, color, sub, textOverride }, i) => (
            <div
              key={label}
              className="bg-white rounded-[12px] border border-[#E7E9EE] shadow-[0_1px_2px_rgba(21,22,26,.04)] p-4 animate-fade-up"
              style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'both' }}
            >
              {loading ? (
                <div className="space-y-2">
                  <div className="h-3 shimmer rounded w-3/4" />
                  <div className="h-6 shimmer rounded w-1/2" />
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-1.5 mb-2" style={{ color }}>
                    {icon}
                    <p className="text-xs font-medium text-[#5B5F6B]">{label}</p>
                  </div>
                  <p className="text-xl font-bold tabular" style={{ color }}>
                    {textOverride ?? <CountUp to={value} suffix={suffix} />}
                  </p>
                  {sub && <p className="text-xs text-[#5B5F6B] mt-0.5 truncate">{sub}</p>}
                </>
              )}
            </div>
          ))}
        </div>

        {/* Charts */}
        <AnimatedSection direction="up" delay={100} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <BarChartCard title="Redemptions by perk" data={perPerkData} loading={loading} color="#3D5AFE" />
          <BarChartCard title="Peak usage times" data={peakData} loading={loading} color="#5B5F6B" yLabel="Redemptions" />
        </AnimatedSection>

        {/* Per-perk table */}
        <AnimatedSection direction="up" delay={160}>
          <div className="bg-white rounded-[12px] border border-[#E7E9EE] shadow-[0_1px_2px_rgba(21,22,26,.04),0_4px_16px_rgba(21,22,26,.06)] p-5">
            <p className="text-sm font-semibold text-[#15161A] mb-4">Per-perk breakdown</p>
            <DataTable
              columns={perkCols}
              rows={stats?.per_perk ?? []}
              loading={loading}
              keyFn={(r) => r.perk_name}
              emptyTitle="No redemptions yet"
              emptyBody="Your analytics will appear here once employees start redeeming your perks."
            />
          </div>
        </AnimatedSection>
      </div>
    </AppShell>
  );
}
