'use client';

import { useEffect, useState } from 'react';
import AppShell from '@/components/AppShell';
import DataTable, { Column } from '@/components/DataTable';
import StatusPill from '@/components/StatusPill';
import AnimatedSection from '@/components/AnimatedSection';
import { useToast } from '@/components/Toast';
import { getPerkRequests, approveRequest } from '@/lib/api';
import { mockPerkRequests } from '@/lib/mock-data';

interface PerkRequest { id: number; employee_name: string; perk_name: string; estimated_credits: number; reason: string; status: string; }

export default function ApprovalsPage() {
  const { toast } = useToast();
  const [requests, setRequests] = useState<PerkRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<number | null>(null);

  useEffect(() => {
    getPerkRequests()
      .then((d) => setRequests(Array.isArray(d) ? d : d.results ?? []))
      .catch(() => setRequests(mockPerkRequests))
      .finally(() => setLoading(false));
  }, []);

  const handleAction = async (id: number, status: 'approved' | 'rejected') => {
    setActing(id);
    try {
      await approveRequest(id, status);
    } catch { /* demo */ }
    setRequests((prev) => prev.map((r) => r.id === id ? { ...r, status } : r));
    toast(status === 'approved' ? 'Request approved' : 'Request rejected', status === 'approved' ? 'success' : 'warn');
    setActing(null);
  };

  const pendingCount = requests.filter((r) => r.status === 'pending').length;

  const columns: Column<PerkRequest>[] = [
    {
      key: 'employee_name', header: 'Employee',
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-[#3D5AFE]/10 flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-[#3D5AFE]">{row.employee_name[0]}</span>
          </div>
          <span className="font-semibold text-[#15161A] text-sm">{row.employee_name}</span>
        </div>
      ),
    },
    { key: 'perk_name', header: 'Perk requested', render: (row) => <span className="text-[#15161A] text-sm">{row.perk_name}</span> },
    {
      key: 'estimated_credits', header: 'Cost', align: 'right',
      render: (row) => <span className="tabular font-semibold text-sm">{Number(row.estimated_credits).toLocaleString()} <span className="text-[#5B5F6B] font-normal">cr</span></span>,
    },
    { key: 'reason', header: 'Reason', render: (row) => <span className="text-[#5B5F6B] text-sm">{row.reason || '—'}</span> },
    { key: 'status', header: 'Status', render: (row) => <StatusPill status={row.status} /> },
    {
      key: 'actions', header: '',
      render: (row) => {
        if (row.status !== 'pending') return null;
        const busy = acting === row.id;
        return (
          <div className="flex items-center gap-1.5">
            <button onClick={() => handleAction(row.id, 'approved')} disabled={busy}
              className="px-3 py-1.5 rounded-[6px] bg-emerald-50 text-[#1F9D6B] border border-emerald-200 text-xs font-semibold hover:bg-emerald-100 transition-colors disabled:opacity-50 active:scale-[0.97]">
              {busy ? '…' : 'Approve'}
            </button>
            <button onClick={() => handleAction(row.id, 'rejected')} disabled={busy}
              className="px-3 py-1.5 rounded-[6px] bg-red-50 text-[#D23B3B] border border-red-200 text-xs font-semibold hover:bg-red-100 transition-colors disabled:opacity-50 active:scale-[0.97]">
              Reject
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <AppShell role="employer" pageTitle="Approvals">
      <div className="space-y-4">
        <AnimatedSection direction="up" className="flex items-center gap-3">
          <h2 className="text-base font-semibold text-[#15161A]">Perk requests</h2>
          {pendingCount > 0 && (
            <span className="animate-pulse-soft px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-xs font-semibold text-[#C9821A]">
              {pendingCount} pending
            </span>
          )}
        </AnimatedSection>
        <AnimatedSection direction="up" delay={80}>
          <DataTable columns={columns} rows={requests} loading={loading} keyFn={(r) => r.id}
            emptyTitle="No requests waiting on you"
            emptyBody="When employees request perks, they'll appear here for your review." />
        </AnimatedSection>
      </div>
    </AppShell>
  );
}
