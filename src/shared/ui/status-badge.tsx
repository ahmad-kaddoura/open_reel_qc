'use client';

import type { SceneStatus } from '@/core/types';

const STATUS_CONFIG: Record<SceneStatus, { label: string; color: string; dotColor: string }> = {
  idle: { label: 'Idle', color: 'bg-muted text-muted-foreground', dotColor: 'bg-muted-foreground' },
  queued: { label: 'Queued', color: 'bg-yellow-500/10 text-yellow-500', dotColor: 'bg-yellow-500' },
  generating: { label: 'Generating', color: 'bg-blue-500/10 text-blue-400', dotColor: 'bg-blue-400 animate-pulse' },
  completed: { label: 'Completed', color: 'bg-emerald-500/10 text-emerald-400', dotColor: 'bg-emerald-400' },
  failed: { label: 'Failed', color: 'bg-red-500/10 text-red-400', dotColor: 'bg-red-400' },
  cancelled: { label: 'Cancelled', color: 'bg-orange-500/10 text-orange-400', dotColor: 'bg-orange-400' },
  regenerating: { label: 'Regenerating', color: 'bg-purple-500/10 text-purple-400', dotColor: 'bg-purple-400 animate-pulse' },
};

interface StatusBadgeProps {
  status: SceneStatus;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-medium ${config.color} ${size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dotColor}`} />
      {config.label}
    </span>
  );
}