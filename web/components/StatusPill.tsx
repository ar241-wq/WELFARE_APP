interface StatusPillProps {
  status: string;
}

const map: Record<string, { label: string; className: string }> = {
  pending:          { label: 'Pending',          className: 'bg-amber-50 text-[#C9821A] border border-amber-200' },
  pending_approval: { label: 'Pending Approval', className: 'bg-[#FCEDE7] text-[#E8623D] border border-orange-200' },
  approved:         { label: 'Approved',         className: 'bg-emerald-50 text-[#1F9D6B] border border-emerald-200' },
  rejected:         { label: 'Rejected',         className: 'bg-red-50 text-[#D23B3B] border border-red-200' },
  redeemed:         { label: 'Redeemed',         className: 'bg-emerald-50 text-[#1F9D6B] border border-emerald-200' },
  expired:          { label: 'Expired',          className: 'bg-[#F7F8FA] text-[#5B5F6B] border border-[#E7E9EE]' },
  delivered:        { label: 'Delivered',        className: 'bg-blue-50 text-[#3D5AFE] border border-blue-200' },
  active:           { label: 'Active',           className: 'bg-emerald-50 text-[#1F9D6B] border border-emerald-200' },
  inactive:         { label: 'Inactive',         className: 'bg-[#F7F8FA] text-[#5B5F6B] border border-[#E7E9EE]' },
};

export default function StatusPill({ status }: StatusPillProps) {
  const cfg = map[status] ?? { label: status, className: 'bg-[#F7F8FA] text-[#5B5F6B] border border-[#E7E9EE]' };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}
