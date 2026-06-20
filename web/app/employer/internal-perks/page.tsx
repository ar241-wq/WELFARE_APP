'use client';

import { useEffect, useState } from 'react';
import AppShell from '@/components/AppShell';
import DataTable, { Column } from '@/components/DataTable';
import Modal from '@/components/Modal';
import FormField, { inputClass } from '@/components/FormField';
import AnimatedSection from '@/components/AnimatedSection';
import { useToast } from '@/components/Toast';
import {
  getInternalPerks, createInternalPerk, updateInternalPerk, deleteInternalPerk,
  getHRInternalRequests, resolveInternalRequest,
} from '@/lib/api';
import { Plus, Pencil, Trash2, CheckCircle, XCircle, Gift } from 'lucide-react';

const PERK_ICONS = ['🏖️', '🎓', '🏋️', '💆', '🚗', '🍽️', '💻', '⏰', '⭐', '🎁'];

interface InternalPerk {
  id: number;
  title: string;
  description: string;
  icon: string;
  credit_cost: number;
  is_free: boolean;
  available_slots: number | null;
  slots_remaining: number | null;
  requires_approval: boolean;
  is_active: boolean;
  company_name: string;
  created_at: string;
}

interface Redemption {
  id: number;
  perk_title: string;
  perk_icon: string;
  employee_name: string;
  employee_email: string;
  status: string;
  note: string;
  hr_note: string;
  requested_at: string;
  resolved_at: string | null;
}

const defaultForm = {
  title: '',
  description: '',
  icon: '🎁',
  is_free: true,
  credit_cost: '',
  available_slots: '',
  requires_approval: true,
};

export default function InternalPerksPage() {
  const { toast } = useToast();

  // Perks state
  const [perks, setPerks] = useState<InternalPerk[]>([]);
  const [perksLoading, setPerksLoading] = useState(true);

  // Redemptions state
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [redemptionsLoading, setRedemptionsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPerk, setEditingPerk] = useState<InternalPerk | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [submitting, setSubmitting] = useState(false);

  // Resolve state
  const [resolving, setResolving] = useState<number | null>(null);
  const [hrNoteModal, setHrNoteModal] = useState<{ redemptionId: number; action: 'approve' | 'deny' } | null>(null);
  const [hrNote, setHrNote] = useState('');

  const loadPerks = () => {
    setPerksLoading(true);
    getInternalPerks()
      .then((d) => setPerks(Array.isArray(d) ? d : []))
      .catch(() => setPerks([]))
      .finally(() => setPerksLoading(false));
  };

  const loadRedemptions = () => {
    setRedemptionsLoading(true);
    getHRInternalRequests(statusFilter || undefined)
      .then((d) => setRedemptions(Array.isArray(d) ? d : []))
      .catch(() => setRedemptions([]))
      .finally(() => setRedemptionsLoading(false));
  };

  useEffect(() => { loadPerks(); }, []);
  useEffect(() => { loadRedemptions(); }, [statusFilter]);

  const openCreate = () => {
    setEditingPerk(null);
    setForm(defaultForm);
    setModalOpen(true);
  };

  const openEdit = (perk: InternalPerk) => {
    setEditingPerk(perk);
    setForm({
      title: perk.title,
      description: perk.description,
      icon: perk.icon,
      is_free: perk.is_free,
      credit_cost: perk.credit_cost ? String(perk.credit_cost) : '',
      available_slots: perk.available_slots != null ? String(perk.available_slots) : '',
      requires_approval: perk.requires_approval,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) return;
    setSubmitting(true);
    const payload = {
      title: form.title,
      description: form.description,
      icon: form.icon,
      is_free: form.is_free,
      credit_cost: form.is_free ? 0 : Number(form.credit_cost) || 0,
      available_slots: form.available_slots ? Number(form.available_slots) : null,
      requires_approval: form.requires_approval,
    };
    try {
      if (editingPerk) {
        const updated = await updateInternalPerk(editingPerk.id, payload);
        setPerks((prev) => prev.map((p) => p.id === editingPerk.id ? { ...p, ...updated } : p));
        toast('Perk updated', 'success');
      } else {
        const created = await createInternalPerk(payload);
        setPerks((prev) => [created, ...prev]);
        toast('Perk created', 'success');
      }
      setModalOpen(false);
    } catch {
      toast('Could not save perk', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (perk: InternalPerk) => {
    if (!window.confirm(`Deactivate "${perk.title}"?`)) return;
    try {
      await deleteInternalPerk(perk.id);
      setPerks((prev) => prev.map((p) => p.id === perk.id ? { ...p, is_active: false } : p));
      toast('Perk deactivated', 'success');
    } catch {
      toast('Could not deactivate perk', 'error');
    }
  };

  const openResolve = (redemptionId: number, action: 'approve' | 'deny') => {
    setHrNoteModal({ redemptionId, action });
    setHrNote('');
  };

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hrNoteModal) return;
    const { redemptionId, action } = hrNoteModal;
    setResolving(redemptionId);
    try {
      await resolveInternalRequest(redemptionId, action, hrNote);
      toast(action === 'approve' ? 'Request approved' : 'Request denied', action === 'approve' ? 'success' : 'warn');
      setHrNoteModal(null);
      loadRedemptions();
    } catch {
      toast('Could not resolve request', 'error');
    } finally {
      setResolving(null);
    }
  };

  const pendingCount = redemptions.filter((r) => r.status === 'pending').length;

  const perkColumns: Column<InternalPerk>[] = [
    {
      key: 'title', header: 'Perk',
      render: (r) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-[10px] bg-[#eef2ff] flex items-center justify-center shrink-0 text-xl">
            {r.icon}
          </div>
          <div>
            <p className="font-semibold text-[#15161A] text-sm">{r.title}</p>
            <p className="text-xs text-[#5B5F6B] line-clamp-1">{r.description}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'credit_cost', header: 'Cost',
      render: (r) => r.is_free || r.credit_cost === 0
        ? <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">FREE</span>
        : <span className="text-sm font-semibold text-[#6366f1]">{Number(r.credit_cost).toLocaleString()} cr</span>,
    },
    {
      key: 'available_slots', header: 'Slots',
      render: (r) => r.available_slots == null
        ? <span className="text-xs text-[#5B5F6B]">Unlimited</span>
        : <span className="text-sm font-medium text-[#15161A]">{r.slots_remaining} / {r.available_slots} left</span>,
    },
    {
      key: 'requires_approval', header: 'Approval',
      render: (r) => r.requires_approval
        ? <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold">Required</span>
        : <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">Auto</span>,
    },
    {
      key: 'is_active', header: 'Status',
      render: (r) => r.is_active
        ? <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">Active</span>
        : <span className="px-2 py-0.5 rounded-full bg-[#F7F8FA] text-[#5B5F6B] border border-[#E7E9EE] text-xs font-semibold">Inactive</span>,
    },
    {
      key: 'actions', header: '',
      render: (r) => (
        <div className="flex items-center gap-2 justify-end">
          <button
            onClick={() => openEdit(r)}
            className="flex items-center gap-1 text-xs text-[#3D5AFE] font-medium hover:underline"
          >
            <Pencil size={11} /> Edit
          </button>
          {r.is_active && (
            <button
              onClick={() => handleDelete(r)}
              className="flex items-center gap-1 text-xs text-[#D23B3B] font-medium hover:underline"
            >
              <Trash2 size={11} /> Deactivate
            </button>
          )}
        </div>
      ),
    },
  ];

  const redemptionColumns: Column<Redemption>[] = [
    {
      key: 'employee_name', header: 'Employee',
      render: (r) => (
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-[#3D5AFE]/10 flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-[#3D5AFE]">{r.employee_name?.[0] ?? '?'}</span>
          </div>
          <div>
            <p className="font-semibold text-[#15161A] text-sm">{r.employee_name}</p>
            <p className="text-xs text-[#5B5F6B]">{r.employee_email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'perk_title', header: 'Perk',
      render: (r) => (
        <div className="flex items-center gap-2">
          <span className="text-base">{r.perk_icon}</span>
          <span className="text-sm font-medium text-[#15161A]">{r.perk_title}</span>
        </div>
      ),
    },
    {
      key: 'note', header: 'Note',
      render: (r) => <span className="text-sm text-[#5B5F6B] line-clamp-2">{r.note || '—'}</span>,
    },
    {
      key: 'requested_at', header: 'Requested',
      render: (r) => <span className="text-xs text-[#5B5F6B] tabular">{new Date(r.requested_at).toLocaleDateString()}</span>,
    },
    {
      key: 'status', header: 'Status',
      render: (r) => {
        const map: Record<string, string> = {
          pending: 'px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold',
          approved: 'px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold',
          denied: 'px-2 py-0.5 rounded-full bg-red-50 text-[#D23B3B] border border-red-200 text-xs font-semibold',
        };
        return <span className={map[r.status] ?? map.pending}>{r.status}</span>;
      },
    },
    {
      key: 'actions', header: '',
      render: (r) => {
        if (r.status !== 'pending') return null;
        const busy = resolving === r.id;
        return (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => openResolve(r.id, 'approve')}
              disabled={busy}
              className="flex items-center gap-1 px-3 py-1.5 rounded-[6px] bg-emerald-50 text-[#1F9D6B] border border-emerald-200 text-xs font-semibold hover:bg-emerald-100 transition-colors disabled:opacity-50"
            >
              <CheckCircle size={11} /> Approve
            </button>
            <button
              onClick={() => openResolve(r.id, 'deny')}
              disabled={busy}
              className="flex items-center gap-1 px-3 py-1.5 rounded-[6px] bg-red-50 text-[#D23B3B] border border-red-200 text-xs font-semibold hover:bg-red-100 transition-colors disabled:opacity-50"
            >
              <XCircle size={11} /> Deny
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <AppShell role="employer" pageTitle="Internal Perks">
      <div className="space-y-6">

        {/* Perks section */}
        <AnimatedSection direction="up" className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-[#15161A]">Company Perks</h2>
            <p className="text-xs text-[#5B5F6B] mt-0.5">Create internal perks your employees can request</p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 rounded-[8px] bg-[#3D5AFE] text-white text-sm font-semibold hover:bg-[#2E45C4] transition-colors active:scale-[0.98]"
          >
            <Plus size={14} /> Add Perk
          </button>
        </AnimatedSection>

        {/* Quick stat cards */}
        {!perksLoading && perks.length > 0 && (
          <AnimatedSection direction="up" delay={40} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {perks.filter((p) => p.is_active).slice(0, 4).map((p, i) => (
              <button
                key={p.id}
                onClick={() => openEdit(p)}
                className="bg-white rounded-[12px] border border-[#E7E9EE] p-4 shadow-[0_1px_2px_rgba(21,22,26,.04)] text-left hover:border-[#6366f1]/40 hover:shadow-[0_1px_2px_rgba(99,102,241,.08),0_4px_16px_rgba(99,102,241,.08)] transition-all"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="text-2xl mb-2">{p.icon}</div>
                <p className="text-xs font-semibold text-[#15161A] truncate">{p.title}</p>
                <p className="text-xs text-[#5B5F6B] mt-0.5">
                  {p.is_free || p.credit_cost === 0 ? 'Free' : `${Number(p.credit_cost).toLocaleString()} cr`}
                </p>
              </button>
            ))}
          </AnimatedSection>
        )}

        <AnimatedSection direction="up" delay={80}>
          <DataTable
            columns={perkColumns}
            rows={perks}
            loading={perksLoading}
            keyFn={(r) => r.id}
            emptyTitle="No internal perks yet"
            emptyBody="Create your first company perk — like an extra day off or a team lunch."
          />
        </AnimatedSection>

        {/* HR Requests section */}
        <AnimatedSection direction="up" delay={120}>
          <div className="bg-white rounded-[12px] border border-[#E7E9EE] shadow-[0_1px_2px_rgba(21,22,26,.04)] p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <p className="text-sm font-semibold text-[#15161A]">Employee Requests</p>
                {pendingCount > 0 && statusFilter === 'pending' && (
                  <span className="animate-pulse-soft px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-xs font-semibold text-[#C9821A]">
                    {pendingCount} pending
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                {(['pending', 'approved', 'denied', ''] as const).map((s) => (
                  <button
                    key={s || 'all'}
                    onClick={() => setStatusFilter(s)}
                    className={`px-3 py-1.5 rounded-[6px] text-xs font-semibold transition-colors ${
                      statusFilter === s
                        ? 'bg-[#3D5AFE] text-white'
                        : 'bg-[#F7F8FA] text-[#5B5F6B] hover:bg-[#E7E9EE]'
                    }`}
                  >
                    {s || 'All'}
                  </button>
                ))}
              </div>
            </div>
            <DataTable
              columns={redemptionColumns}
              rows={redemptions}
              loading={redemptionsLoading}
              keyFn={(r) => r.id}
              emptyTitle="No requests"
              emptyBody="Employee perk requests will appear here for your review."
            />
          </div>
        </AnimatedSection>
      </div>

      {/* Create / Edit perk modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingPerk ? 'Edit Perk' : 'New Internal Perk'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Icon picker */}
          <div>
            <p className="text-xs font-semibold text-[#5B5F6B] uppercase tracking-wide mb-2">Icon</p>
            <div className="flex flex-wrap gap-2">
              {PERK_ICONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, icon }))}
                  className={`w-10 h-10 rounded-[8px] text-xl flex items-center justify-center transition-all ${
                    form.icon === icon
                      ? 'bg-[#3D5AFE]/10 border-2 border-[#3D5AFE] scale-110'
                      : 'bg-[#F7F8FA] border border-[#E7E9EE] hover:bg-[#eef2ff]'
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          <FormField label="Title" id="perk-title" required>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Extra Day Off"
              required
              className={inputClass()}
            />
          </FormField>

          <FormField label="Description" id="perk-desc" required>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Describe what employees get..."
              required
              rows={3}
              className={inputClass()}
            />
          </FormField>

          {/* Free toggle */}
          <div className="flex items-center justify-between p-3 rounded-[10px] bg-[#F7F8FA] border border-[#E7E9EE]">
            <div>
              <p className="text-sm font-semibold text-[#15161A]">Free perk</p>
              <p className="text-xs text-[#5B5F6B]">No credits required to request</p>
            </div>
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, is_free: !f.is_free }))}
              className={`w-11 h-6 rounded-full transition-colors relative ${form.is_free ? 'bg-[#3D5AFE]' : 'bg-[#E7E9EE]'}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${form.is_free ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </div>

          {!form.is_free && (
            <FormField label="Credit cost" id="perk-cost">
              <input
                type="number"
                min="0"
                value={form.credit_cost}
                onChange={(e) => setForm((f) => ({ ...f, credit_cost: e.target.value }))}
                placeholder="e.g. 100"
                className={inputClass()}
              />
            </FormField>
          )}

          <FormField label="Available slots" id="perk-slots" hint="Leave empty for unlimited">
            <input
              type="number"
              min="1"
              value={form.available_slots}
              onChange={(e) => setForm((f) => ({ ...f, available_slots: e.target.value }))}
              placeholder="Unlimited"
              className={inputClass()}
            />
          </FormField>

          {/* Requires approval toggle */}
          <div className="flex items-center justify-between p-3 rounded-[10px] bg-[#F7F8FA] border border-[#E7E9EE]">
            <div>
              <p className="text-sm font-semibold text-[#15161A]">Requires approval</p>
              <p className="text-xs text-[#5B5F6B]">You review each request before it's granted</p>
            </div>
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, requires_approval: !f.requires_approval }))}
              className={`w-11 h-6 rounded-full transition-colors relative ${form.requires_approval ? 'bg-[#3D5AFE]' : 'bg-[#E7E9EE]'}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${form.requires_approval ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="flex-1 px-4 py-2.5 rounded-[8px] border border-[#E7E9EE] text-sm font-medium text-[#5B5F6B] hover:bg-[#F7F8FA]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-[8px] bg-[#3D5AFE] text-white text-sm font-semibold hover:bg-[#2E45C4] disabled:opacity-60"
            >
              {submitting && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              <Gift size={13} /> {editingPerk ? 'Save changes' : 'Create Perk'}
            </button>
          </div>
        </form>
      </Modal>

      {/* HR note / resolve modal */}
      <Modal
        open={!!hrNoteModal}
        onClose={() => setHrNoteModal(null)}
        title={hrNoteModal?.action === 'approve' ? 'Approve request' : 'Deny request'}
        size="sm"
      >
        <form onSubmit={handleResolve} className="space-y-4">
          <p className="text-sm text-[#5B5F6B]">
            {hrNoteModal?.action === 'approve'
              ? 'Optionally add a note for the employee.'
              : 'Let the employee know why this was denied.'}
          </p>
          <FormField label="Note to employee (optional)" id="hr-note">
            <textarea
              value={hrNote}
              onChange={(e) => setHrNote(e.target.value)}
              placeholder="Add a message..."
              rows={3}
              className={inputClass()}
            />
          </FormField>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setHrNoteModal(null)}
              className="flex-1 px-4 py-2.5 rounded-[8px] border border-[#E7E9EE] text-sm font-medium text-[#5B5F6B] hover:bg-[#F7F8FA]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={resolving !== null}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-[8px] text-white text-sm font-semibold disabled:opacity-60 transition-colors ${
                hrNoteModal?.action === 'approve'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-[#D23B3B] hover:bg-red-700'
              }`}
            >
              {resolving !== null && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {hrNoteModal?.action === 'approve' ? 'Approve' : 'Deny'}
            </button>
          </div>
        </form>
      </Modal>
    </AppShell>
  );
}
