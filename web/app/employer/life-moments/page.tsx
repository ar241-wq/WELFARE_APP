'use client';

import { useEffect, useState } from 'react';
import AppShell from '@/components/AppShell';
import CarePackageCard, { LifeEvent } from '@/components/CarePackageCard';
import AnimatedSection from '@/components/AnimatedSection';
import { getPendingLifeEvents } from '@/lib/api';
import { mockLifeEvents } from '@/lib/mock-data';

const EVENT_LABELS: Record<string, { label: string; color: string }> = {
  new_baby:      { label: 'New baby',       color: 'bg-pink-50 text-pink-700 border-pink-200' },
  burnout_leave: { label: 'Burnout leave',  color: 'bg-amber-50 text-amber-700 border-amber-200' },
  relocation:    { label: 'Relocation',     color: 'bg-blue-50 text-blue-700 border-blue-200' },
  bereavement:   { label: 'Bereavement',    color: 'bg-slate-100 text-slate-700 border-slate-200' },
  marriage:      { label: 'Marriage',       color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
};

export default function LifeMomentsPage() {
  const [events, setEvents] = useState<LifeEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPendingLifeEvents()
      .then((d) => setEvents(Array.isArray(d) ? d : d.results ?? []))
      .catch(() => setEvents(mockLifeEvents as LifeEvent[]))
      .finally(() => setLoading(false));
  }, []);

  const pending  = events.filter((e) => e.status === 'pending_approval');
  const approved = events.filter((e) => e.status === 'approved');

  const progressPct = events.length
    ? Math.round((approved.length / events.length) * 100)
    : 0;

  return (
    <AppShell role="employer" pageTitle="Life Moments">
      {/* Care ribbon header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-base font-semibold text-[#15161A]">Care packages</h2>
            <p className="text-xs text-[#5B5F6B] mt-0.5">
              When employees mark a life event, a care package is automatically suggested
            </p>
          </div>
          {pending.length > 0 && (
            <span className="animate-pulse-soft px-3 py-1 rounded-full bg-[#FCEDE7] border border-[#E8623D]/20 text-xs font-semibold text-[#E8623D]">
              {pending.length} need{pending.length === 1 ? 's' : ''} attention
            </span>
          )}
        </div>
        {/* Progress bar */}
        {events.length > 0 && (
          <div className="h-1.5 w-full bg-[#E7E9EE] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#E8623D] rounded-full ribbon-sweep"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        )}
      </div>

      <div className="space-y-6">
        {loading ? (
          <div className="space-y-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="bg-white rounded-[12px] border border-[#E7E9EE] p-6 space-y-4">
                <div className="h-1.5 bg-[#F7F8FA] rounded-full" />
                <div className="h-4 shimmer rounded w-1/3" />
                <div className="h-3 shimmer rounded w-1/2" />
                <div className="flex gap-2">
                  {[...Array(3)].map((_, j) => <div key={j} className="h-6 w-24 shimmer rounded-full" />)}
                </div>
              </div>
            ))}
          </div>
        ) : !events.length ? (
          <AnimatedSection direction="up">
            <div className="text-center py-16 bg-white rounded-[16px] border border-dashed border-[#E7E9EE]">
              <div className="w-12 h-12 rounded-full bg-[#FCEDE7] flex items-center justify-center mx-auto mb-4">
                <span className="text-xl">🤍</span>
              </div>
              <p className="font-semibold text-[#15161A] mb-1">No life events pending</p>
              <p className="text-sm text-[#5B5F6B] max-w-xs mx-auto">
                When employees mark events like a new baby or medical leave, you&apos;ll see them here to send care.
              </p>
            </div>
          </AnimatedSection>
        ) : (
          <>
            {/* Pending section */}
            {pending.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-[#5B5F6B] uppercase tracking-wider mb-3">Pending approval</p>
                <div className="space-y-4">
                  {pending.map((event, i) => (
                    <AnimatedSection key={event.id} direction="up" delay={i * 80}>
                      <div className="flex items-center gap-2 mb-2 pl-1">
                        {EVENT_LABELS[event.event_type] && (
                          <span className={`px-2 py-0.5 rounded-full border text-xs font-medium ${EVENT_LABELS[event.event_type].color}`}>
                            {EVENT_LABELS[event.event_type].label}
                          </span>
                        )}
                      </div>
                      <CarePackageCard
                        event={event}
                        onApproved={(id) => setEvents((prev) => prev.map((e) => e.id === id ? { ...e, status: 'approved' } : e))}
                      />
                    </AnimatedSection>
                  ))}
                </div>
              </div>
            )}

            {/* Approved section */}
            {approved.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-[#5B5F6B] uppercase tracking-wider mb-3">Approved</p>
                <div className="space-y-3">
                  {approved.map((event, i) => (
                    <AnimatedSection key={event.id} direction="up" delay={i * 60}>
                      <CarePackageCard
                        event={event}
                        onApproved={(id) => setEvents((prev) => prev.map((e) => e.id === id ? { ...e, status: 'approved' } : e))}
                      />
                    </AnimatedSection>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
