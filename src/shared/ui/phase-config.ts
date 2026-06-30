import type { ProjectPhase } from '@/core/types';

export const PROJECT_PHASES: { id: ProjectPhase; label: string; icon: string }[] = [
  { id: 'chat', label: 'Plan', icon: '💬' },
  { id: 'brief', label: 'Brief', icon: '📋' },
  { id: 'storyboard', label: 'Storyboard', icon: '🎬' },
  { id: 'workflow', label: 'Workflow', icon: '🔗' },
  { id: 'generation', label: 'Generate', icon: '⚡' },
  { id: 'timeline', label: 'Timeline', icon: '🎞️' },
  { id: 'export', label: 'Export', icon: '📤' },
];