import type { ProjectPhase } from '@/core/types';

export const PROJECT_PHASES: { id: ProjectPhase; label: string; icon: string }[] = [
  { id: 'chat', label: 'Plan', icon: '💬' },
  { id: 'workflow', label: 'Workflow', icon: '🔗' },
  { id: 'timeline', label: 'Timeline', icon: '🎞️' },
];
