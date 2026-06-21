'use client';

import { useEffect, useState } from 'react';
import AppShell from '@/components/AppShell';
import { getMe, getProviderReputation, getProviderReviews } from '@/lib/api';
import { Star, TrendingUp, Users, CheckCircle, BarChart2 } from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────────────────────

interface ScoreBreakdown {
  stars?: number;
  volume?: number;
  repeat?: number;
  consistency?: number;
  fulfillment?: number;
}

interface GapToNext {
  tier?: string;
  points_needed?: number;
  actions?: string[];
  message?: string;
}

interface Reputation {
  tier: string;
  composite_score: number | null;
  avg_stars: number | null;
  review_count: number;
  redemption_count: number;
  repeat_rate: number;
  consistency_score: number;
  score_breakdown: ScoreBreakdown;
  gap_to_next: GapToNext;
  reviews_needed?: number;
}

interface Review {
  stars: number;
  comment: string;
  perk_name: string;
  created_at: string;
}

// ─── Helpers ───────────────────────────────────────────────────────────────

const TIER_COLORS: Record<string, string> = {
  unranked: '#6b7280',
  bronze:   '#cd7f32',
  silver:   '#adb5bd',
  gold:     '#ffd700',
  platinum: '#e5e4e2',
};

const TIER_BG: Record<string, string> = {
  unranked: '#f3f4f6',
  bronze:   '#fdf3e7',
  silver:   '#f4f5f6',
  gold:     '#fffde7',
  platinum: '#f5f5f5',
};

function TierBadge({ tier }: { tier: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border"
      style={{
        color: TIER_COLORS[tier] ?? '#6b7280',
        backgroundColor: TIER_BG[tier] ?? '#f3f4f6',
        borderColor: TIER_COLORS[tier] ?? '#e5e7eb',
      }}
    >
      <Star size={11} />
      {tier}
    </span>
  );
}

function ProgressBar({ value, max = 100, color = '#3D5AFE' }: { value: number; max?: number; color?: string }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="w-full h-2 bg-[#E7E9EE] rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
    </div>
  );
}

function StatBox({ label, value, sub, icon: Icon }: { label: string; value: string | number; sub?: string; icon?: React.ElementType }) {
  return (
    <div className="bg-white rounded-[12px] border border-[#E7E9EE] p-4 flex flex-col gap-1">
      <div className="flex items-center gap-2 text-[#5B5F6B] text-xs font-medium">
        {Icon && <Icon size={13} />}
        {label}
      </div>
      <p className="text-2xl font-bold text-[#15161A]">{value}</p>
      {sub && <p className="text-xs text-[#5B5F6B]">{sub}</p>}
    </div>
  );
}

function BreakdownBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-[#5B5F6B] w-24 shrink-0 capitalize">{label}</span>
      <ProgressBar value={value} color="#3D5AFE" />
      <span className="text-sm font-semibold text-[#15161A] w-10 text-right">{Math.round(value)}</span>
    </div>
  );
}

function StarDisplay({ stars }: { stars: number }) {
  return (
    <span className="text-amber-400 font-semibold text-sm">
      {'★'.repeat(stars)}{'☆'.repeat(5 - stars)}
    </span>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default function ReputationPage() {
  const [rep, setRep] = useState<Reputation | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const me = await getMe();
        const providerId: number = me.id;
        const [repData, reviewData] = await Promise.all([
          getProviderReputation(providerId),
          getProviderReviews(providerId),
        ]);
        setRep(repData);
        setReviews(Array.isArray(reviewData) ? reviewData : []);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to load reputation data.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const tierColor = rep ? (TIER_COLORS[rep.tier] ?? '#6b7280') : '#6b7280';

  return (
    <AppShell role="provider" pageTitle="Reputation">
      <div className="max-w-4xl mx-auto space-y-6">

        {loading && (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-[#3D5AFE] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-[12px] p-4 text-sm">
            {error}
          </div>
        )}

        {!loading && rep && (
          <>
            {/* Score Card */}
            <div className="bg-white rounded-[16px] border border-[#E7E9EE] p-6">
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div className="flex flex-col gap-2">
                  <TierBadge tier={rep.tier} />
                  {rep.composite_score !== null ? (
                    <p className="text-4xl font-extrabold text-[#15161A]">
                      {rep.composite_score.toFixed(1)}
                      <span className="text-base font-normal text-[#5B5F6B] ml-1">/ 100</span>
                    </p>
                  ) : (
                    <p className="text-2xl font-bold text-[#5B5F6B]">Building reputation</p>
                  )}
                  {rep.reviews_needed && rep.reviews_needed > 0 && (
                    <p className="text-sm text-[#5B5F6B]">
                      {rep.reviews_needed} more reviews needed to unlock ranking
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-xs text-[#5B5F6B] font-medium mb-1">Overall Score</p>
                  <p className="text-sm font-semibold text-[#15161A]">{rep.review_count} reviews</p>
                </div>
              </div>

              {rep.composite_score !== null && (
                <div className="mt-4">
                  <ProgressBar value={rep.composite_score} color={tierColor} />
                </div>
              )}

              {/* Gap to next tier */}
              {rep.gap_to_next && !rep.gap_to_next.message && rep.gap_to_next.tier && (
                <div className="mt-4 p-4 rounded-[10px] bg-[#F7F8FA] border border-[#E7E9EE]">
                  <p className="text-sm font-semibold text-[#15161A] mb-2">
                    {rep.gap_to_next.points_needed && rep.gap_to_next.points_needed > 0
                      ? `${rep.gap_to_next.points_needed} points to ${rep.gap_to_next.tier?.toUpperCase()}`
                      : `On track for ${rep.gap_to_next.tier?.toUpperCase()}`}
                  </p>
                  <ul className="space-y-1">
                    {(rep.gap_to_next.actions ?? []).map((action, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-[#5B5F6B]">
                        <span className="text-[#3D5AFE] mt-0.5">→</span>
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {rep.gap_to_next?.message && (
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-[10px] text-sm font-medium text-amber-800">
                  {rep.gap_to_next.message}
                </div>
              )}
            </div>

            {/* Stat boxes */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatBox
                label="Avg Rating"
                value={rep.avg_stars != null ? `${rep.avg_stars.toFixed(1)} ★` : '—'}
                sub={rep.review_count >= 10 ? 'Bayesian adjusted' : 'Needs 10+ reviews'}
                icon={Star}
              />
              <StatBox
                label="Reviews"
                value={rep.review_count}
                sub="Verified reviews"
                icon={BarChart2}
              />
              <StatBox
                label="Repeat Rate"
                value={`${Math.round((rep.repeat_rate ?? 0) * 100)}%`}
                sub="Returning employees"
                icon={Users}
              />
              <StatBox
                label="Fulfillment"
                value={
                  rep.score_breakdown?.fulfillment != null
                    ? `${Math.round(rep.score_breakdown.fulfillment)}%`
                    : '—'
                }
                sub="QR scans recorded"
                icon={CheckCircle}
              />
            </div>

            {/* Score Breakdown */}
            {rep.composite_score !== null && Object.keys(rep.score_breakdown ?? {}).length > 0 && (
              <div className="bg-white rounded-[16px] border border-[#E7E9EE] p-6">
                <h2 className="text-sm font-semibold text-[#15161A] mb-4 flex items-center gap-2">
                  <TrendingUp size={15} />
                  Score Breakdown
                </h2>
                <div className="space-y-3">
                  {(['stars', 'volume', 'repeat', 'consistency', 'fulfillment'] as const).map((key) =>
                    rep.score_breakdown?.[key] != null ? (
                      <BreakdownBar key={key} label={key} value={rep.score_breakdown[key] as number} />
                    ) : null
                  )}
                </div>
              </div>
            )}

            {/* Recent Reviews */}
            <div className="bg-white rounded-[16px] border border-[#E7E9EE] overflow-hidden">
              <div className="px-6 py-4 border-b border-[#E7E9EE]">
                <h2 className="text-sm font-semibold text-[#15161A]">Recent Reviews</h2>
              </div>
              {reviews.length === 0 ? (
                <div className="px-6 py-10 text-center text-sm text-[#5B5F6B]">
                  No reviews yet. Once employees redeem your perks and rate their experience, reviews will appear here.
                </div>
              ) : (
                <div className="divide-y divide-[#E7E9EE]">
                  {reviews.slice(0, 20).map((r, i) => (
                    <div key={i} className="px-6 py-4 flex items-start gap-4">
                      <div className="shrink-0">
                        <StarDisplay stars={r.stars} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#15161A] truncate">{r.perk_name}</p>
                        {r.comment && (
                          <p className="text-sm text-[#5B5F6B] mt-0.5 line-clamp-2">{r.comment}</p>
                        )}
                      </div>
                      <div className="shrink-0 text-xs text-[#9ca3af] whitespace-nowrap">
                        {new Date(r.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
