'use client';

import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/shared/ui/status-badge';
import { Camera, Clock, Film } from 'lucide-react';
import type { Scene } from '@/core/types';
import { CAMERA_MOVEMENTS, STYLE_PRESETS } from '@/core/config';
import { cn } from '@/lib/utils';

interface SceneCardProps {
  scene: Scene;
  index: number;
  selected?: boolean;
  onClick?: () => void;
  compact?: boolean;
}

export function SceneCard({ scene, index, selected, onClick, compact }: SceneCardProps) {
  const cameraLabel = CAMERA_MOVEMENTS.find((c) => c.id === scene.cameraMovement)?.name ?? scene.cameraMovement;
  const styleLabel = STYLE_PRESETS.find((s) => s.id === scene.stylePreset)?.name ?? scene.stylePreset;

  return (
    <Card
      className={cn(
        'cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/30',
        selected && 'border-primary shadow-sm ring-1 ring-primary/20',
        compact && 'text-sm',
      )}
      onClick={onClick}
    >
      <CardContent className={cn('p-3', compact && 'p-2')}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
              {index + 1}
            </span>
            <div className="min-w-0">
              <p className="font-medium truncate">{scene.title || `Scene ${index + 1}`}</p>
              {!compact && scene.mood && (
                <p className="text-xs text-muted-foreground truncate">{scene.mood}</p>
              )}
            </div>
          </div>
          <StatusBadge status={scene.status} />
        </div>

        {!compact && (
          <div className="mt-2 space-y-1.5">
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              {scene.prompt || 'No prompt yet'}
            </p>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {scene.duration}s
              </span>
              <span className="flex items-center gap-1">
                <Camera className="h-3 w-3" />
                {cameraLabel}
              </span>
              <span className="flex items-center gap-1">
                <Film className="h-3 w-3" />
                {styleLabel}
              </span>
            </div>
          </div>
        )}

        {compact && (
          <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
            <span>{scene.duration}s</span>
            <span>·</span>
            <span>{cameraLabel}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}