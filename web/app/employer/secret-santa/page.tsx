'use client';

import { useEffect, useState } from 'react';
import AppShell from '@/components/AppShell';
import AnimatedSection from '@/components/AnimatedSection';
import {
  getHRSantaEvents, createSantaEvent, updateSantaEvent, deleteSantaEvent,
  assignSantas, revealSantas, getDepartments,
} from '@/lib/api';

interface Participant { id: number; name: string; gift_sent: boolean; }
interface SantaEvent {
  id: number;
  title: string;
  department_name: string;
  credit_budget: number;
  join_deadline: string;
  reveal_date: string;
  status: 'open' | 'assigned' | 'revealed';
  participant_count: number;
  participants: Participant[];
  all_assignments: { giver_name: string; receiver_name: string }[] | null;
}
interface Department { id: number; name: string; }

const STATUS_STYLES: Record<string, string> = {
  open:     'bg-emerald-50 text-emerald-700 border-emerald-200',
  assigned: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  revealed: 'bg-amber-50 text-amber-700 border-amber-200',
};
const STATUS_LABELS: Record<string, string> = {
  open: 'Open', assigned: 'Assigned', revealed: 'Revealed',
};

function toLocal(iso: string) {
  // Convert ISO to datetime-local input value
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

const BLANK_FORM = { department_id: '', title: 'Secret Santa', credit_budget: '50', join_deadline: '', reveal_date: '' };

export default function SecretSantaPage() {
  const [events, setEvents] = useState<SantaEvent[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Create
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState(BLANK_FORM);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  // Edit
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ title: '', credit_budget: '', join_deadline: '', reveal_date: '' });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Expand
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Action loading
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  async function load() {
    try {
      const [evts, depts] = await Promise.all([getHRSantaEvents(), getDepartments()]);
      setEvents(evts);
      setDepartments(depts);
    } catch {
      setError('Could not load events.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function startEdit(ev: SantaEvent) {
    setEditingId(ev.id);
    setEditForm({
      title: ev.title,
      credit_budget: String(ev.credit_budget),
      join_deadline: toLocal(ev.join_deadline),
      reveal_date: toLocal(ev.reveal_date),
    });
    setSaveError('');
  }

  async function handleSave(id: number) {
    setSaving(true);
    setSaveError('');
    try {
      await updateSantaEvent(id, {
        title: editForm.title,
        credit_budget: Number(editForm.credit_budget),
        join_deadline: new Date(editForm.join_deadline).toISOString(),
        reveal_date: new Date(editForm.reveal_date).toISOString(),
      });
      setEditingId(null);
      await load();
    } catch (e: any) {
      setSaveError(e?.response?.data?.detail || 'Failed to save.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      await deleteSantaEvent(id);
      await load();
    } catch {
      alert('Failed to delete.');
    }
  }

  async function handleAssign(id: number) {
    setActionLoading(id);
    try {
      await assignSantas(id);
      await load();
    } catch (e: any) {
      alert(e?.response?.data?.detail || 'Error assigning.');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReveal(id: number) {
    if (!confirm('Reveal all pairings to employees? This cannot be undone.')) return;
    setActionLoading(id);
    try {
      await revealSantas(id);
      await load();
    } catch {
      alert('Error revealing.');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateError('');
    if (!createForm.department_id || !createForm.join_deadline || !createForm.reveal_date) {
      setCreateError('All fields are required.');
      return;
    }
    setCreating(true);
    try {
      await createSantaEvent({
        department_id: Number(createForm.department_id),
        title: createForm.title,
        credit_budget: Number(createForm.credit_budget),
        join_deadline: new Date(createForm.join_deadline).toISOString(),
        reveal_date: new Date(createForm.reveal_date).toISOString(),
      });
      setShowCreate(false);
      setCreateForm(BLANK_FORM);
      await load();
    } catch (err: any) {
      setCreateError(err?.response?.data?.detail || 'Failed to create event.');
    } finally {
      setCreating(false);
    }
  }

  const open = events.filter((e) => e.status === 'open');
  const assigned = events.filter((e) => e.status === 'assigned');
  const revealed = events.filter((e) => e.status === 'revealed');

  const EventCard = ({ ev, i }: { ev: SantaEvent; i: number }) => {
    const isEditing = editingId === ev.id;
    const isExpanded = expandedId === ev.id;

    return (
      <AnimatedSection key={ev.id} direction="up" delay={i * 60}>
        <div className="bg-white border border-[#E7E9EE] rounded-[12px] overflow-hidden">
          {/* Card body */}
          <div className="p-5">
            {isEditing ? (
              /* ── Edit form ── */
              <div className="space-y-3">
                <p className="text-xs font-semibold text-[#5B5F6B] uppercase tracking-wider mb-1">Editing event</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-[#5B5F6B] mb-1">Title</label>
                    <input
                      className="w-full border border-[#E7E9EE] rounded-[8px] px-3 py-2 text-sm focus:outline-none focus:border-[#3D5AFE]"
                      value={editForm.title}
                      onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#5B5F6B] mb-1">Credit budget</label>
                    <input
                      type="number" min={1}
                      className="w-full border border-[#E7E9EE] rounded-[8px] px-3 py-2 text-sm focus:outline-none focus:border-[#3D5AFE]"
                      value={editForm.credit_budget}
                      onChange={(e) => setEditForm((f) => ({ ...f, credit_budget: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#5B5F6B] mb-1">Join deadline</label>
                    <input
                      type="datetime-local"
                      className="w-full border border-[#E7E9EE] rounded-[8px] px-3 py-2 text-sm focus:outline-none focus:border-[#3D5AFE]"
                      value={editForm.join_deadline}
                      onChange={(e) => setEditForm((f) => ({ ...f, join_deadline: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#5B5F6B] mb-1">Reveal date</label>
                    <input
                      type="datetime-local"
                      className="w-full border border-[#E7E9EE] rounded-[8px] px-3 py-2 text-sm focus:outline-none focus:border-[#3D5AFE]"
                      value={editForm.reveal_date}
                      onChange={(e) => setEditForm((f) => ({ ...f, reveal_date: e.target.value }))}
                    />
                  </div>
                </div>
                {saveError && <p className="text-xs text-red-600">{saveError}</p>}
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => handleSave(ev.id)}
                    disabled={saving}
                    className="px-4 py-1.5 rounded-[6px] bg-[#3D5AFE] text-white text-xs font-semibold hover:bg-[#3D5AFE]/90 disabled:opacity-50 transition-colors"
                  >
                    {saving ? 'Saving…' : 'Save changes'}
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="px-4 py-1.5 rounded-[6px] border border-[#E7E9EE] text-xs font-semibold text-[#5B5F6B] hover:bg-[#F7F8FA] transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              /* ── View mode ── */
              <>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-semibold text-[#15161A]">{ev.title}</h3>
                      <span className={`px-2 py-0.5 rounded-full border text-xs font-medium ${STATUS_STYLES[ev.status]}`}>
                        {STATUS_LABELS[ev.status]}
                      </span>
                    </div>
                    <p className="text-xs text-[#3D5AFE] font-medium mt-0.5">{ev.department_name}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {ev.status === 'open' && (
                      <button
                        onClick={() => startEdit(ev)}
                        className="px-2.5 py-1.5 rounded-[6px] border border-[#E7E9EE] text-xs font-semibold text-[#5B5F6B] hover:bg-[#F7F8FA] transition-colors"
                      >
                        Edit
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(ev.id, ev.title)}
                      className="px-2.5 py-1.5 rounded-[6px] border border-red-100 text-xs font-semibold text-red-500 hover:bg-red-50 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 mt-3 text-xs text-[#5B5F6B]">
                  <span>Budget: <strong className="text-[#15161A]">{ev.credit_budget} credits</strong></span>
                  <span>Join by: <strong className="text-[#15161A]">{fmt(ev.join_deadline)}</strong></span>
                  <span>Reveal: <strong className="text-[#15161A]">{fmt(ev.reveal_date)}</strong></span>
                  <span><strong className="text-[#15161A]">{ev.participant_count}</strong> joined</span>
                </div>

                {/* Action buttons */}
                <div className="flex flex-wrap gap-2 mt-4">
                  {ev.status === 'open' && (
                    <button
                      onClick={() => handleAssign(ev.id)}
                      disabled={actionLoading === ev.id || ev.participant_count < 2}
                      title={ev.participant_count < 2 ? 'Need at least 2 participants' : ''}
                      className="px-3 py-1.5 rounded-[6px] bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 disabled:opacity-40 transition-colors"
                    >
                      {actionLoading === ev.id ? 'Shuffling…' : 'Shuffle & Assign'}
                    </button>
                  )}
                  {ev.status === 'assigned' && (
                    <button
                      onClick={() => handleReveal(ev.id)}
                      disabled={actionLoading === ev.id}
                      className="px-3 py-1.5 rounded-[6px] bg-amber-500 text-white text-xs font-semibold hover:bg-amber-600 disabled:opacity-50 transition-colors"
                    >
                      {actionLoading === ev.id ? 'Revealing…' : 'Reveal Pairings'}
                    </button>
                  )}
                  {/* Participants / pairings toggle */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : ev.id)}
                    className="px-3 py-1.5 rounded-[6px] bg-[#F7F8FA] border border-[#E7E9EE] text-xs font-semibold text-[#5B5F6B] hover:bg-[#E7E9EE] transition-colors"
                  >
                    {isExpanded
                      ? 'Hide details'
                      : ev.status === 'revealed'
                        ? `View pairings (${ev.participants.length})`
                        : `Participants (${ev.participant_count})`
                    }
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Expanded panel */}
          {isExpanded && !isEditing && (
            <div className="border-t border-[#E7E9EE]">
              {ev.status === 'revealed' && ev.all_assignments ? (
                <div className="bg-[#FFFBEB] px-5 py-4">
                  <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-3">Gift pairings</p>
                  <div className="space-y-2">
                    {ev.all_assignments.map((a, idx) => (
                      <div key={idx} className="flex items-center gap-3 text-sm">
                        <span className="font-medium text-[#15161A] flex-1">{a.giver_name}</span>
                        <span className="text-[#5B5F6B] text-xs">gave to</span>
                        <span className="font-medium text-indigo-700 flex-1 text-right">{a.receiver_name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="px-5 py-4">
                  <p className="text-xs font-semibold text-[#5B5F6B] uppercase tracking-wider mb-3">
                    Participants{ev.participants.length === 0 ? ' — none yet' : ''}
                  </p>
                  {ev.participants.length === 0 ? (
                    <p className="text-sm text-[#5B5F6B]">No one has joined yet. Employees can join from the mobile app.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {ev.participants.map((p) => (
                        <div key={p.id} className="flex items-center justify-between text-sm">
                          <span className="text-[#15161A] font-medium">{p.name}</span>
                          {ev.status === 'assigned' && (
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${p.gift_sent ? 'bg-emerald-50 text-emerald-700' : 'bg-[#F7F8FA] text-[#5B5F6B]'}`}>
                              {p.gift_sent ? 'Gift sent' : 'Pending'}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </AnimatedSection>
    );
  };

  return (
    <AppShell role="employer" pageTitle="Secret Santa">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-base font-semibold text-[#15161A]">Secret Santa</h2>
          <p className="text-xs text-[#5B5F6B] mt-0.5">Manage gift exchanges across departments.</p>
        </div>
        <button
          onClick={() => { setShowCreate((v) => !v); setCreateError(''); }}
          className="flex items-center gap-2 px-4 py-2 rounded-[8px] bg-[#3D5AFE] text-white text-sm font-semibold hover:bg-[#3D5AFE]/90 transition-colors"
        >
          {showCreate ? 'Cancel' : '+ New Event'}
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <AnimatedSection direction="up">
          <form onSubmit={handleCreate} className="bg-white border border-[#E7E9EE] rounded-[12px] p-6 mb-6 space-y-4">
            <h3 className="text-sm font-semibold text-[#15161A]">New Secret Santa event</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#5B5F6B] mb-1">Title</label>
                <input
                  className="w-full border border-[#E7E9EE] rounded-[8px] px-3 py-2 text-sm focus:outline-none focus:border-[#3D5AFE]"
                  value={createForm.title}
                  onChange={(e) => setCreateForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Secret Santa"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#5B5F6B] mb-1">Department</label>
                <select
                  className="w-full border border-[#E7E9EE] rounded-[8px] px-3 py-2 text-sm focus:outline-none focus:border-[#3D5AFE] bg-white"
                  value={createForm.department_id}
                  onChange={(e) => setCreateForm((f) => ({ ...f, department_id: e.target.value }))}
                >
                  <option value="">Select department…</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#5B5F6B] mb-1">Credit budget per gift</label>
                <input
                  type="number" min={1}
                  className="w-full border border-[#E7E9EE] rounded-[8px] px-3 py-2 text-sm focus:outline-none focus:border-[#3D5AFE]"
                  value={createForm.credit_budget}
                  onChange={(e) => setCreateForm((f) => ({ ...f, credit_budget: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#5B5F6B] mb-1">Join deadline</label>
                <input
                  type="datetime-local"
                  className="w-full border border-[#E7E9EE] rounded-[8px] px-3 py-2 text-sm focus:outline-none focus:border-[#3D5AFE]"
                  value={createForm.join_deadline}
                  onChange={(e) => setCreateForm((f) => ({ ...f, join_deadline: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#5B5F6B] mb-1">Reveal date</label>
                <input
                  type="datetime-local"
                  className="w-full border border-[#E7E9EE] rounded-[8px] px-3 py-2 text-sm focus:outline-none focus:border-[#3D5AFE]"
                  value={createForm.reveal_date}
                  onChange={(e) => setCreateForm((f) => ({ ...f, reveal_date: e.target.value }))}
                />
              </div>
            </div>
            {createError && <p className="text-xs text-red-600">{createError}</p>}
            <button
              type="submit" disabled={creating}
              className="px-5 py-2 rounded-[8px] bg-[#3D5AFE] text-white text-sm font-semibold hover:bg-[#3D5AFE]/90 disabled:opacity-50 transition-colors"
            >
              {creating ? 'Creating…' : 'Create event'}
            </button>
          </form>
        </AnimatedSection>
      )}

      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      {loading ? (
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-white rounded-[12px] border border-[#E7E9EE] p-5 space-y-2">
              <div className="h-4 shimmer rounded w-1/3" />
              <div className="h-3 shimmer rounded w-1/4" />
              <div className="h-3 shimmer rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : events.length === 0 ? (
        <AnimatedSection direction="up">
          <div className="text-center py-20 bg-white rounded-[16px] border border-dashed border-[#E7E9EE]">
            <div className="text-5xl mb-4">🎄</div>
            <p className="font-semibold text-[#15161A] mb-1">No Secret Santa events yet</p>
            <p className="text-sm text-[#5B5F6B]">Create one above to start a gift exchange for a department.</p>
          </div>
        </AnimatedSection>
      ) : (
        <div className="space-y-8">
          {[
            { label: 'Open — collecting participants', items: open, color: 'text-emerald-700' },
            { label: 'Assigned — gifts in progress', items: assigned, color: 'text-indigo-700' },
            { label: 'Revealed', items: revealed, color: 'text-amber-700' },
          ].map(({ label, items, color }) =>
            items.length > 0 ? (
              <div key={label}>
                <p className={`text-xs font-semibold uppercase tracking-wider mb-3 ${color}`}>{label}</p>
                <div className="space-y-3">
                  {items.map((ev, i) => <EventCard key={ev.id} ev={ev} i={i} />)}
                </div>
              </div>
            ) : null
          )}
        </div>
      )}
    </AppShell>
  );
}
