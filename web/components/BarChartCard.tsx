'use client';

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, LineChart, Line,
} from 'recharts';

interface BarChartCardProps {
  title: string;
  data: { name: string; value: number }[];
  loading?: boolean;
  type?: 'bar' | 'line';
  color?: string;
  yLabel?: string;
}

function CustomTooltip({ active, payload, label }: Record<string, unknown>) {
  if (active && Array.isArray(payload) && payload.length) {
    return (
      <div className="bg-white border border-[#E7E9EE] rounded-[8px] px-3 py-2 shadow-[0_4px_16px_rgba(21,22,26,.1)]">
        <p className="text-xs font-semibold text-[#5B5F6B] mb-0.5">{String(label)}</p>
        <p className="text-sm font-bold text-[#15161A] tabular">{String((payload as Array<{value: unknown}>)[0].value)}</p>
      </div>
    );
  }
  return null;
}

export default function BarChartCard({
  title, data, loading, type = 'bar', color = '#3D5AFE', yLabel,
}: BarChartCardProps) {
  return (
    <div className="bg-white rounded-[12px] p-6 shadow-[0_1px_2px_rgba(21,22,26,.04),0_4px_16px_rgba(21,22,26,.06)]">
      <p className="text-sm font-semibold text-[#15161A] mb-4">{title}</p>

      {loading ? (
        <div className="h-48 bg-[#F7F8FA] rounded-[8px] animate-pulse flex items-end gap-2 p-4">
          {[40, 70, 50, 90, 65, 80].map((h, i) => (
            <div key={i} className="flex-1 bg-[#E7E9EE] rounded-t" style={{ height: `${h}%` }} />
          ))}
        </div>
      ) : !data.length ? (
        <div className="h-48 flex flex-col items-center justify-center text-[#5B5F6B]">
          <p className="text-sm">No data yet</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          {type === 'line' ? (
            <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: yLabel ? 8 : 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E7E9EE" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#5B5F6B' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#5B5F6B' }} axisLine={false} tickLine={false} label={yLabel ? { value: yLabel, angle: -90, position: 'insideLeft', style: { fontSize: 10, fill: '#5B5F6B' } } : undefined} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} activeDot={{ r: 4, fill: color }} />
            </LineChart>
          ) : (
            <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: yLabel ? 8 : 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E7E9EE" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#5B5F6B' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#5B5F6B' }} axisLine={false} tickLine={false} label={yLabel ? { value: yLabel, angle: -90, position: 'insideLeft', style: { fontSize: 10, fill: '#5B5F6B' } } : undefined} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} maxBarSize={48} />
            </BarChart>
          )}
        </ResponsiveContainer>
      )}
    </div>
  );
}
