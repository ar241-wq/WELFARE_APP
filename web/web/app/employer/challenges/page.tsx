'use client';

import { useEffect, useState } from 'react';
import AppShell from '@/components/AppShell';
import { getChallenges, createChallenge, getChallengeDetail, distributePrize } from '@/lib/api';
import { Trophy, Plus, Users, CheckCircle, Clock, ChevronRight, X, Zap, Target, Rocket, Lightbulb, Star } from 'lucide-react';

interface Department {
  id: number;
  name: string;
  member_count: number;
}

interface Challenge {
  id: number;
  title: string;
  description: string;
  challenge_type: string;
  target_metric: string;
  reward_credits: string;
  status: 'active' | 'completed';
  department_count: number;
  departments: Department[];
  distributed: boolean;
  winner_department: { id: number; name: string } | null;
  deadline: string | null;
  created_at: string;
}

const TYPE_META: Record<string, { label: string; icon: string; color: string; bg: string; border: string }> = {
  kpi:         { label: 'KPI Target',        icon: '📊', color: 'text-blue-700',   bg: 'bg-blue-50',   border: 'border-blue-200' },
  ai_adoption: { label: 'AI Adoption',       icon: '🤖', color: 'text-violet-700', bg: 'bg-violet-50', border: 'border-violet-200' },
  first_to:    { label: 'First to Complete', icon: '⚡', color: 'text-amber-700',  bg: 'bg-amber-50',  border: 'border-amber-200' },
  innovation:  { label: 'Innovation',        icon: '💡', color: 'text-emerald-700',bg: 'bg-emerald-50',border: 'border-emerald-200' },
  custom:      { label: 'Custom',            icon: '🎯', color: 'text-gray-700',   bg: 'bg-gray-100',  border: 'border-gray-200' },
};

const TEMPLATES = [
  {
    type: 'kpi',
    label: 'KPI Target',
    icon: '📊',
    desc: 'Hit a measurable business metric',
    title: 'Hit the Q{Q} KPI Target',
    description: 'First department to hit the quarterly KPI target wins. Submit your department\'s metrics dashboard screenshot or report as proof.',
    target_metric: 'Reach 100% of quarterly KPI target',
  },
  {
    type: 'ai_adoption',
    label: 'AI Adoption Race',
    icon: '🤖',
    desc: 'First team to deploy AI tools wins',
    title: 'AI Adoption Challenge',
    description: 'Which department will integrate AI tools into their workflow first? Submit a short writeup of the AI tool you implemented, how it works, and the measurable impact on your team\'s output.',
    target_metric: 'Deploy at least 1 AI tool that saves 2+ hours/week per person',
  },
  {
    type: 'first_to',
    label: 'First to Complete',
    icon: '⚡',
    desc: 'Race — first one done wins',
    title: 'Sprint Race: First to Finish Wins',
    description: 'A speed race between departments. The first department to complete the defined task and report results wins the full prize, split among all their members.',
    target_metric: 'Complete the defined task first',
  },
  {
    type: 'innovation',
    label: 'Innovation Pitch',
    icon: '💡',
    desc: 'Best idea for improving the business',
    title: 'Innovation Challenge: Best Idea Wins',
    description: 'Submit your best idea for improving a business process, product feature, or team workflow. Ideas will be judged on impact, feasibility, and originality. Winner gets credits + the idea gets greenlit.',
    target_metric: 'Submit a viable innovation proposal',
  },
];

export default function ChallengesPage() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState<Challenge | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [distributing, setDistributing] = useState(false);

  const blankForm = { title: '', description: '', challenge_type: 'kpi', target_metric: '', reward_credits: '', deadline: '' };
  const [form, setForm] = useState(blankForm);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState('');

  async function load() {
    try {
      const data = await getChallenges();
      setChallenges(Array.isArray(data) ? data : []);
    } catch {
      setChallenges([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function applyTemplate(t: typeof TEMPLATES[0]) {
    setForm(f => ({
      ...f,
      challenge_type: t.type,
      title: t.title.replace('{Q}', String(Math.ceil((new Date().getMonth() + 1) / 3))),
      description: t.description,
      target_metric: t.target_metric,
    }));
  }

  async function openDetail(c: Challenge) {
    setDetailLoading(true);
    setSelected(c);
    try {
      const detail = await getChallengeDetail(c.id);
      setSelected(detail);
    } catch {}
    setDetailLoading(false);
  }

  async function handleCreate() {
    setFormError('');
    if (!form.title.trim() || !form.description.trim() || !form.reward_credits) {
      setFormError('Title, description and reward credits are required.');
      return;
    }
    setCreating(true);
    try {
      await createChallenge({
        title: form.title.trim(),
        description: form.description.trim(),
        reward_credits: Number(form.reward_credits),
        deadline: form.deadline || undefined,
        // @ts-ignore
        challenge_type: form.challenge_type,
        target_metric: form.target_metric,
      });
      setForm(blankForm);
      setShowCreate(false);
      load();
    } catch (err: any) {
      setFormError(err?.response?.data?.detail || 'Could not create challenge.');
    } finally {
      setCreating(false);
    }
  }

  async function handleDistribute(challengeId: number, deptId: number) {
    setDistributing(true);
    try {
      const updated = await distributePrize(challengeId, deptId);
      setSelected(updated);
      load();
    } catch {}
    setDistributing(false);
  }

  const active = challenges.filter((c) => c.status === 'active');
  const completed = challenges.filter((c) => c.status === 'completed');

  return (
    <AppShell role="employer" pageTitle="Challenges">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              Work Challenges
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Set KPI races, AI adoption sprints, and innovation challenges — winner earns bonus credits
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Challenge
          </button>
        </div>

        {/* Create modal */}
        {showCreate && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl my-4">
              <div className="flex items-center justify-between p-5 border-b border-gray-100">
                <h3 className="text-lg font-bold text-gray-900">Create Work Challenge</h3>
                <button onClick={() => { setShowCreate(false); setForm(blankForm); setFormError(''); }}>
                  <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                </button>
              </div>

              <div className="p-5 space-y-5">
                {/* Templates */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Quick Templates</p>
                  <div className="grid grid-cols-2 gap-2">
                    {TEMPLATES.map((t) => (
                      <button
                        key={t.type}
                        onClick={() => applyTemplate(t)}
                        className={`text-left p-3 rounded-xl border-2 transition-all hover:border-indigo-400 ${form.challenge_type === t.type ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 bg-white'}`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">{t.icon}</span>
                          <span className="text-sm font-bold text-gray-900">{t.label}</span>
                        </div>
                        <p className="text-xs text-gray-500">{t.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-4 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Title</label>
                    <input
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="e.g. AI Adoption Race — Q2"
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Description & Rules</label>
                    <textarea
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                      rows={4}
                      placeholder="Explain the challenge, how to enter, and how the winner will be judged..."
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Success Metric / Goal</label>
                    <input
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="e.g. Deploy 2 AI tools that save 2+ hrs/week per person"
                      value={form.target_metric}
                      onChange={(e) => setForm({ ...form, target_metric: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Prize Credits</label>
                      <input
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        type="number"
                        min="1"
                        placeholder="1000"
                        value={form.reward_credits}
                        onChange={(e) => setForm({ ...form, reward_credits: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Deadline (optional)</label>
                      <input
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        type="datetime-local"
                        value={form.deadline}
                        onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                      />
                    </div>
                  </div>
                  {formError && <p className="text-sm text-red-600">{formError}</p>}
                </div>
              </div>

              <div className="flex gap-3 p-5 border-t border-gray-100">
                <button
                  onClick={() => { setShowCreate(false); setForm(blankForm); setFormError(''); }}
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={creating}
                  className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  {creating ? 'Launching…' : '🚀 Launch Challenge'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Detail panel */}
        {selected && (
          <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[85vh] overflow-hidden flex flex-col">
              <div className="flex items-center justify-between p-5 border-b border-gray-100">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {TYPE_META[selected.challenge_type] && (
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border ${TYPE_META[selected.challenge_type].bg} ${TYPE_META[selected.challenge_type].color} ${TYPE_META[selected.challenge_type].border}`}>
                        {TYPE_META[selected.challenge_type].icon} {TYPE_META[selected.challenge_type].label}
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">{selected.title}</h3>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {selected.department_count} departments competing
                    {selected.distributed && selected.winner_department && (
                      <span className="ml-2 text-amber-600 font-semibold">• 🏆 {selected.winner_department.name} won</span>
                    )}
                  </p>
                </div>
                <button onClick={() => setSelected(null)}>
                  <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                </button>
              </div>

              <div className="p-5 border-b border-gray-100 space-y-3">
                <p className="text-sm text-gray-700">{selected.description}</p>
                {selected.target_metric && (
                  <div className="flex items-start gap-2 p-3 bg-indigo-50 border border-indigo-200 rounded-xl">
                    <Target className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-indigo-700 uppercase tracking-wide">Success Metric</p>
                      <p className="text-sm text-indigo-900 font-medium mt-0.5">{selected.target_metric}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-bold">
                    <Trophy className="w-3 h-3" />
                    {selected.reward_credits} credits to winner
                  </span>
                  <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold border ${selected.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                    {selected.status === 'active' ? <Clock className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                    {selected.status === 'active' ? 'Active' : 'Completed'}
                  </span>
                  {selected.deadline && (
                    <span className="text-xs text-gray-500">Deadline: {new Date(selected.deadline).toLocaleDateString()}</span>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-5">
                {detailLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : (selected.departments ?? []).length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">No departments found</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Pick the winning department — prize splits among its members
                    </p>
                    {(selected.departments ?? []).map((dept) => {
                      const eachAmount = dept.member_count > 0
                        ? (parseFloat(selected.reward_credits) / dept.member_count).toFixed(2)
                        : '—';
                      const isWinner = selected.winner_department?.id === dept.id;
                      return (
                        <div
                          key={dept.id}
                          className={`border rounded-xl p-4 flex items-center justify-between gap-3 ${isWinner ? 'border-amber-300 bg-amber-50' : 'border-gray-200 bg-white'}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-bold text-indigo-700">
                              {dept.name[0]}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-gray-900">{dept.name}</span>
                                {isWinner && <span className="text-xs font-bold text-amber-600">🏆 Winner</span>}
                              </div>
                              <p className="text-xs text-gray-500">
                                {dept.member_count} members • <span className="font-semibold text-amber-600">{eachAmount} credits each</span> if they win
                              </p>
                            </div>
                          </div>
                          {selected.status === 'active' && (
                            <button
                              onClick={() => handleDistribute(selected.id, dept.id)}
                              disabled={distributing}
                              className="flex-shrink-0 px-4 py-2 bg-amber-500 text-white rounded-lg text-xs font-bold hover:bg-amber-600 disabled:opacity-50 transition-colors"
                            >
                              {distributing ? '…' : '🏆 Award Winner'}
                            </button>
                          )}
                          {isWinner && (
                            <div className="flex items-center gap-1 text-green-600">
                              <CheckCircle className="w-4 h-4" />
                              <span className="text-xs font-bold">Distributed</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Challenge lists */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : challenges.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Trophy className="w-12 h-12 text-gray-300 mb-4" />
            <p className="text-gray-500 font-medium">No challenges yet</p>
            <p className="text-sm text-gray-400 mt-1">Launch a KPI race, AI adoption sprint, or innovation challenge</p>
          </div>
        ) : (
          <>
            {active.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">Active</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  {active.map((c) => <ChallengeCard key={c.id} challenge={c} onClick={() => openDetail(c)} />)}
                </div>
              </div>
            )}
            {completed.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3 mt-2">Completed</h3>
                <div className="grid gap-4 sm:grid-cols-2 opacity-80">
                  {completed.map((c) => <ChallengeCard key={c.id} challenge={c} onClick={() => openDetail(c)} />)}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}

function ChallengeCard({ challenge, onClick }: { challenge: Challenge; onClick: () => void }) {
  const meta = TYPE_META[challenge.challenge_type] ?? TYPE_META.custom;
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white border border-gray-200 rounded-2xl p-5 hover:border-indigo-300 hover:shadow-md transition-all group"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border mb-2 ${meta.bg} ${meta.color} ${meta.border}`}>
            {meta.icon} {meta.label}
          </span>
          <h4 className="font-bold text-gray-900 text-sm mb-1">{challenge.title}</h4>
          {challenge.target_metric && (
            <p className="text-xs text-indigo-600 font-medium">🎯 {challenge.target_metric}</p>
          )}
        </div>
        <div className="flex-shrink-0 bg-amber-50 border border-amber-200 rounded-xl p-2.5 text-center min-w-[60px]">
          <p className="text-lg font-black text-amber-600">{challenge.reward_credits}</p>
          <p className="text-[10px] text-amber-700 font-semibold">credits</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold border ${challenge.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
            {challenge.status === 'active' ? '● Active' : '✓ Done'}
          </span>
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <Users className="w-3 h-3" />
            {challenge.department_count} depts
          </span>
          {challenge.winner_department && (
            <span className="text-xs font-bold text-amber-600">🏆 {challenge.winner_department.name}</span>
          )}
          {challenge.distributed && (
            <span className="text-xs font-bold text-green-600">✓ Distributed</span>
          )}
        </div>
        <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-500 transition-colors" />
      </div>
    </button>
  );
}
