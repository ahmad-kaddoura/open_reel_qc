'use client';

import { Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useSettingsStore } from '@/features/settings/store';
import { formatGenerationDuration } from '@/features/workflow/lib/generate-scene';
import type { GenerationEffort, Scene } from '@/core/types';

const EFFORT_LABELS: Record<GenerationEffort, string> = {
  low: 'Low — faster/lower cost',
  medium: 'Medium — balanced',
  high: 'High — best quality',
};

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2 border-b border-border/60 pb-1.5 last:border-0 last:pb-0">
      <span className="w-[72px] shrink-0 text-muted-foreground">{label}</span>
      <span className="min-w-0 flex-1 break-all text-foreground">{value}</span>
    </div>
  );
}

function ModelRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-border/60 bg-muted/30 px-2 py-1.5">
      <div className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-[10px] font-medium">{value}</div>
    </div>
  );
}

export function GenerationInfoPopover({
  scene,
  elapsedMs,
  className,
  iconClassName,
}: {
  scene: Scene;
  elapsedMs?: number;
  className?: string;
  iconClassName?: string;
}) {
  const settingsModels = useSettingsStore((s) => s.settings.generationModels);
  const routing = scene.generationModels ?? settingsModels;
  const progress = scene.generationProgress ?? 0;
  const statusLabel = scene.status === 'queued'
    ? 'Queued'
    : scene.status === 'regenerating'
      ? 'Regenerating'
      : 'Generating';

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={className ?? 'h-5 w-5 shrink-0 text-blue-300 hover:bg-blue-500/10 hover:text-blue-200'}
          onClick={(e) => e.stopPropagation()}
        >
          <Info className={iconClassName ?? 'h-3 w-3'} />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side="right"
        align="start"
        className="w-64 p-3"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-2 text-[11px] font-semibold">Generation Details</div>
        <div className="space-y-2 text-[10px]">
          <DetailRow label="Status" value={statusLabel} />
          <DetailRow label="Effort" value={EFFORT_LABELS[routing.effort]} />
          {scene.status !== 'queued' && (
            <DetailRow label="Progress" value={`${progress}%`} />
          )}
          {elapsedMs != null && scene.generationStartedAt && (
            <DetailRow label="Elapsed" value={formatGenerationDuration(elapsedMs)} />
          )}
          <DetailRow label="Duration" value={`${scene.duration}s scene`} />
          {scene.aspectRatio && <DetailRow label="Aspect" value={scene.aspectRatio} />}
          {scene.generationModel && (
            <DetailRow label="Active model" value={scene.generationModel} />
          )}
          {scene.generationTaskId && (
            <DetailRow label="Task ID" value={scene.generationTaskId} />
          )}
          <div className="grid grid-cols-2 gap-1.5 pt-1">
            <ModelRow label="Frames" value={routing.frameModel} />
            <ModelRow label="Images" value={routing.imageModel} />
            <ModelRow label="Video" value={routing.videoModel} />
            <ModelRow label="Review" value={routing.directorModel} />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
