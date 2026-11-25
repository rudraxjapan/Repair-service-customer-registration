import { CheckCircle2, Clock, ThumbsUp, Wrench, XCircle } from 'lucide-react';
import { RepairStatus } from '../types/repair';

const STATUS_STYLES: Record<
  RepairStatus,
  { bg: string; text: string; Icon: typeof Clock }
> = {
  Pending: {
    bg: 'bg-amber-50 border-amber-200',
    text: 'text-amber-800',
    Icon: Clock,
  },
  Accepted: {
    bg: 'bg-blue-50 border-blue-200',
    text: 'text-blue-800',
    Icon: ThumbsUp,
  },
  'In Progress': {
    bg: 'bg-indigo-50 border-indigo-200',
    text: 'text-indigo-800',
    Icon: Wrench,
  },
  Completed: {
    bg: 'bg-emerald-50 border-emerald-200',
    text: 'text-emerald-800',
    Icon: CheckCircle2,
  },
  Cancelled: {
    bg: 'bg-rose-50 border-rose-200',
    text: 'text-rose-800',
    Icon: XCircle,
  },
};

export function StatusIndicator({ status }: { status: RepairStatus }) {
  const config = STATUS_STYLES[status] ?? STATUS_STYLES.Pending;
  const { Icon } = config;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md border whitespace-nowrap shrink-0 ${config.bg} ${config.text}`}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      <span>{status}</span>
    </span>
  );
}
