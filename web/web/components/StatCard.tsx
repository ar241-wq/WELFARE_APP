'use client';

interface StatCardProps {
  label: string;
  value?: string | number;
  sub?: string;
  loading?: boolean;
  icon?: React.ReactNode;
  accent?: 'brand' | 'ok' | 'warn' | 'care';
}

const accentColor = {
  brand: 'text-[#3D5AFE]',
  ok: 'text-[#1F9D6B]',
  warn: 'text-[#C9821A]',
  care: 'text-[#E8623D]',
};

export default function StatCard({ label, value, sub, loading, icon, accent = 'brand' }: StatCardProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-[12px] p-6 shadow-[0_1px_2px_rgba(21,22,26,.04),0_4px_16px_rgba(21,22,26,.06)]">
        <div className="h-3.5 w-24 bg-[#E7E9EE] rounded animate-pulse mb-4" />
        <div className="h-8 w-20 bg-[#E7E9EE] rounded animate-pulse mb-2" />
        <div className="h-3 w-16 bg-[#E7E9EE] rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[12px] p-6 shadow-[0_1px_2px_rgba(21,22,26,.04),0_4px_16px_rgba(21,22,26,.06)] fade-up">
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm text-[#5B5F6B] font-medium">{label}</p>
        {icon && <span className={`${accentColor[accent]} opacity-70`}>{icon}</span>}
      </div>
      <p className={`text-3xl font-semibold tabular ${accentColor[accent]}`}>
        {value ?? '—'}
      </p>
      {sub && <p className="text-xs text-[#5B5F6B] mt-1.5">{sub}</p>}
    </div>
  );
}
