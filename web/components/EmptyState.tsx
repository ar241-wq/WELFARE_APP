import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  body?: string;
  action?: React.ReactNode;
}

export default function EmptyState({ icon: Icon, title, body, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
      {Icon && (
        <div className="w-12 h-12 rounded-[12px] bg-[#F7F8FA] border border-[#E7E9EE] flex items-center justify-center mb-4">
          <Icon size={20} className="text-[#5B5F6B]" />
        </div>
      )}
      <p className="text-[15px] font-semibold text-[#15161A] mb-1">{title}</p>
      {body && <p className="text-sm text-[#5B5F6B] max-w-xs">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
