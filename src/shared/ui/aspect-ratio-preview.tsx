'use client';

import { cn } from '@/lib/utils';
import { ASPECT_RATIOS } from '@/core/config';
import type { AspectRatio } from '@/core/types';

interface AspectRatioPreviewProps {
  ratio: AspectRatio;
  className?: string;
  showLabel?: boolean;
}

export function AspectRatioPreview({ ratio, className, showLabel = true }: AspectRatioPreviewProps) {
  const config = ASPECT_RATIOS.find((r) => r.id === ratio) ?? ASPECT_RATIOS[2];

  // Calculate visual dimensions (max 120px tall)
  const maxHeight = 120;
  const scale = maxHeight / config.height;
  const width = Math.round(config.width * scale);
  const height = maxHeight;

  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <div
        className="relative border-2 border-primary/30 rounded-md bg-muted/30 overflow-hidden"
        style={{ width: `${Math.min(width, 200)}px`, height: `${height}px` }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary/60">{config.id}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {config.width}×{config.height}
            </div>
          </div>
        </div>
        {/* Grid lines */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute left-1/3 top-0 bottom-0 w-px bg-foreground" />
          <div className="absolute left-2/3 top-0 bottom-0 w-px bg-foreground" />
          <div className="absolute top-1/3 left-0 right-0 h-px bg-foreground" />
          <div className="absolute top-2/3 left-0 right-0 h-px bg-foreground" />
        </div>
      </div>
      {showLabel && (
        <span className="text-xs text-muted-foreground font-medium">{config.label}</span>
      )}
    </div>
  );
}