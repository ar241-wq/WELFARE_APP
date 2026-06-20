'use client';

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  align?: 'left' | 'right' | 'center';
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  loading?: boolean;
  emptyTitle?: string;
  emptyBody?: string;
  onRowClick?: (row: T) => void;
  keyFn: (row: T) => string | number;
}

export default function DataTable<T extends object>({
  columns,
  rows,
  loading,
  emptyTitle = 'Nothing here yet',
  emptyBody,
  onRowClick,
  keyFn,
}: DataTableProps<T>) {
  const alignClass = (a?: string) =>
    a === 'right' ? 'text-right' : a === 'center' ? 'text-center' : 'text-left';

  if (loading) {
    return (
      <div className="bg-white rounded-[12px] shadow-[0_1px_2px_rgba(21,22,26,.04),0_4px_16px_rgba(21,22,26,.06)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E7E9EE]">
                {columns.map((c) => (
                  <th key={c.key} className="px-4 py-3 text-left text-xs font-semibold text-[#5B5F6B] uppercase tracking-wide">
                    {c.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...Array(5)].map((_, i) => (
                <tr key={i} className="border-b border-[#E7E9EE] last:border-0">
                  {columns.map((c) => (
                    <td key={c.key} className="px-4 py-3.5">
                      <div className="h-3.5 bg-[#E7E9EE] rounded animate-pulse" style={{ width: `${60 + (i * 13) % 40}%` }} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div className="bg-white rounded-[12px] shadow-[0_1px_2px_rgba(21,22,26,.04),0_4px_16px_rgba(21,22,26,.06)] flex flex-col items-center justify-center py-16 px-8 text-center">
        <p className="text-base font-semibold text-[#15161A] mb-1">{emptyTitle}</p>
        {emptyBody && <p className="text-sm text-[#5B5F6B]">{emptyBody}</p>}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[12px] shadow-[0_1px_2px_rgba(21,22,26,.04),0_4px_16px_rgba(21,22,26,.06)] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#E7E9EE]">
              {columns.map((c) => (
                <th
                  key={c.key}
                  className={`px-4 py-3 text-xs font-semibold text-[#5B5F6B] uppercase tracking-wide ${alignClass(c.align)}`}
                >
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={keyFn(row)}
                onClick={() => onRowClick?.(row)}
                className={`border-b border-[#E7E9EE] last:border-0 transition-colors duration-[120ms] ${
                  onRowClick ? 'cursor-pointer hover:bg-[#F7F8FA]' : ''
                } fade-up`}
              >
                {columns.map((c) => (
                  <td key={c.key} className={`px-4 py-3.5 text-[#15161A] ${alignClass(c.align)} ${c.align === 'right' ? 'tabular' : ''}`}>
                    {c.render ? c.render(row) : String((row as Record<string, unknown>)[c.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
