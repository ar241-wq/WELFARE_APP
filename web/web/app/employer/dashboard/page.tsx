'use client';

import { useEffect, useState } from 'react';
import AppShell from '@/components/AppShell';
import StatCard from '@/components/StatCard';
import BarChartCard from '@/components/BarChartCard';
import AnimatedSection from '@/components/AnimatedSection';
import CountUp from '@/components/CountUp';
import { getAnalytics, getEmployees } from '@/lib/api';
import { mockAnalytics, mockEmployees } from '@/lib/mock-data';
import { Users, Percent, CreditCard, TrendingUp } from 'lucide-react';

export default function EmployerDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ credits: 0, utilization: 0, employees: 0 });
  const [chartData, setChartData] = useState<{ name: string; value: number }[]>([]);
  const [activity, setActivity] = useState<{ id: number; description: string; timestamp: string }[]>([]);
  const [topPerks, setTopPerks] = useState<{ name: string; count: number }[]>([]);

  useEffect(() => {
    Promise.all([getAnalytics(), getEmployees()])
      .catch(() => [mockAnalytics, mockEmployees])
      .then((results) => {
        const [analytics, employees] = results as [typeof mockAnalytics, typeof mockEmployees];
        const spend = analytics.spend?.by_category ?? [];
        const utilization = analytics.utilization?.rate ?? 0;
        const creditTotal = analytics.spend?.total ?? 0;

        setStats({
          credits: creditTotal,
          utilization: Math.round(utilization),
          employees: Array.isArray(employees) ? employees.length : 0,
        });
        setChartData(spend.map((c: { category: string; amount: number }) => ({ name: c.category, value: c.amount })));
        setTopPerks((analytics.topPerks ?? []).slice(0, 5));
        setActivity(analytics.spend?.recent_activity ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppShell role="employer" pageTitle="Dashboard">
      <div className="space-y-6">
        {/* KPI row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Credits distributed', value: stats.credits, suffix: '', icon: <CreditCard size={16} />, accent: 'brand' as const },
            { label: 'Avg utilization', value: stats.utilization, suffix: '%', icon: <Percent size={16} />, accent: 'ok' as const },
            { label: 'Employees', value: stats.employees, suffix: '', icon: <Users size={16} />, accent: 'brand' as const },
          ].map(({ label, value, suffix, icon, accent }, i) => (
            <div
              key={label}
              className="animate-fade-up"
              style={{ animationDelay: `${i * 80}ms`, animationFillMode: 'both' }}
            >
              {loading ? (
                <StatCard label={label} loading icon={icon} accent={accent} />
              ) : (
                <div className="bg-white rounded-[12px] p-6 shadow-[0_1px_2px_rgba(21,22,26,.04),0_4px_16px_rgba(21,22,26,.06)] hover-lift">
                  <div className="flex items-start justify-between mb-3">
                    <p className="text-sm text-[#5B5F6B] font-medium">{label}</p>
                    <span className="text-[#3D5AFE] opacity-70">{icon}</span>
                  </div>
                  <p className="text-3xl font-semibold text-[#3D5AFE]">
                    <CountUp to={value} suffix={suffix} />
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Charts */}
        <AnimatedSection direction="up" delay={100} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <BarChartCard title="Spend by category" data={chartData} loading={loading} color="#3D5AFE" />
          </div>
          <div className="bg-white rounded-[12px] shadow-[0_1px_2px_rgba(21,22,26,.04),0_4px_16px_rgba(21,22,26,.06)] p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={14} className="text-[#5B5F6B]" />
              <p className="text-sm font-semibold text-[#15161A]">Top perks</p>
            </div>
            {loading ? (
              <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-8 shimmer rounded" />)}</div>
            ) : (
              <ol className="space-y-1">
                {topPerks.map((p, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-3 py-2 border-b border-[#F7F8FA] last:border-0 animate-slide-right"
                    style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'both' }}
                  >
                    <span className="w-5 text-xs font-bold tabular text-[#5B5F6B]">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[#15161A] truncate">{p.name}</p>
                      <div className="h-1 bg-[#F7F8FA] rounded-full mt-1 overflow-hidden">
                        <div
                          className="h-full bg-[#3D5AFE] rounded-full transition-all duration-700"
                          style={{ width: `${(p.count / (topPerks[0]?.count || 1)) * 100}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-xs tabular font-semibold text-[#5B5F6B]">{p.count}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </AnimatedSection>

        {/* Recent activity */}
        <AnimatedSection direction="up" delay={200}>
          <div className="bg-white rounded-[12px] shadow-[0_1px_2px_rgba(21,22,26,.04),0_4px_16px_rgba(21,22,26,.06)] p-5">
            <p className="text-sm font-semibold text-[#15161A] mb-4">Recent activity</p>
            {loading ? (
              <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-4 shimmer rounded" />)}</div>
            ) : (
              <ul className="space-y-0">
                {activity.map((item, i) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between py-3 border-b border-[#F7F8FA] last:border-0 hover:bg-[#F7F8FA] -mx-1 px-1 rounded-[6px] transition-colors duration-[120ms] animate-fade-up"
                    style={{ animationDelay: `${i * 50}ms`, animationFillMode: 'both' }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#3D5AFE] shrink-0" />
                      <span className="text-sm text-[#15161A] truncate">{item.description}</span>
                    </div>
                    <span className="text-xs text-[#5B5F6B] tabular shrink-0 ml-4">{item.timestamp}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </AnimatedSection>
      </div>
    </AppShell>
  );
}
