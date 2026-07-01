'use client';

import { useEffect, useRef, useState } from 'react';
import { Scissors, Copy, Trash2, Sparkles, GripVertical } from 'lucide-react';
import { useTimelineStore } from '../store/timeline-store';
import type { TimelineClip } from '../lib/types';
import { clipDuration } from '../lib/types';
import { formatTime } from '../lib/format';
import { cn } from '@/lib/utils';

interface TimelineClipProps {
  clip: TimelineClip;
  startSeconds: number;
  pixelsPerSecond: number;
  isSelected: boolean;
}

type DragState =
  | { kind: 'move'; startX: number; parent: HTMLElement }
  | { kind: 'trim'; edge: 'start' | 'end'; startX: number }
  | null;

export function TimelineClipView({
  clip, startSeconds, pixelsPerSecond, isSelected,
}: TimelineClipProps) {
  const selectClip = useTimelineStore((s) => s.selectClip);
  const trimClip = useTimelineStore((s) => s.trimClip);
  const reorderClips = useTimelineStore((s) => s.reorderClips);
  const splitClip = useTimelineStore((s) => s.splitClip);
  const duplicateClip = useTimelineStore((s) => s.duplicateClip);
  const deleteClip = useTimelineStore((s) => s.deleteClip);
  const setPlayhead = useTimelineStore((s) => s.setPlayhead);
  const pause = useTimelineStore((s) => s.pause);
  const play = useTimelineStore((s) => s.play);

  const duration = clipDuration(clip);
  const widthPx = Math.max(48, duration * pixelsPerSecond);
  const leftPx = startSeconds * pixelsPerSecond;

  const dragRef = useRef<DragState>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      if (drag.kind === 'trim') {
        const dt = (e.clientX - drag.startX) / pixelsPerSecond;
        trimClip(clip.id, drag.edge, dt);
        drag.startX = e.clientX;
      } else if (drag.kind === 'move') {
        const siblings = Array.from(
          drag.parent.querySelectorAll('[data-clip-id]'),
        ) as HTMLElement[];
        const myIdx = siblings.findIndex((el) => el.dataset.clipId === clip.id);
        if (myIdx < 0) return;
        let targetIdx = myIdx;
        for (let i = 0; i < siblings.length; i++) {
          const r = siblings[i].getBoundingClientRect();
          if (e.clientX < r.left + r.width / 2) { targetIdx = i; break; }
          if (i === siblings.length - 1) targetIdx = i;
        }
        if (targetIdx !== myIdx && targetIdx >= 0) {
          const targetId = siblings[targetIdx]?.dataset.clipId;
          if (targetId && targetId !== clip.id) {
            reorderClips(clip.id, targetId);
            drag.startX = e.clientX;
          }
        }
      }
    };
    const onUp = () => {
      dragRef.current = null;
      setIsDragging(false);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [isDragging, clip.id, pixelsPerSecond, trimClip, reorderClips]);

  const startDrag = (kind: 'move' | 'trim', edge?: 'start' | 'end') =>
    (e: React.PointerEvent) => {
      e.stopPropagation();
      e.preventDefault();
      selectClip(clip.id);
      const parent = containerRef.current?.parentElement ?? null;
      if (kind === 'trim') {
        dragRef.current = { kind: 'trim', edge: edge!, startX: e.clientX };
      } else if (parent) {
        dragRef.current = { kind: 'move', startX: e.clientX, parent };
      }
      setIsDragging(true);
    };

  return (
    <div
      ref={containerRef}
      data-clip-id={clip.id}
      className={cn(
        'group absolute top-1 bottom-1 rounded-md border transition-shadow cursor-grab active:cursor-grabbing select-none',
        clip.color,
        isSelected && 'ring-2 ring-white/80 ring-offset-1 ring-offset-neutral-900 shadow-lg z-20',
        !isSelected && 'hover:ring-1 hover:ring-white/30',
      )}
      style={{ left: leftPx, width: widthPx }}
      onPointerDown={startDrag('move')}
      onDoubleClick={() => {
        pause();
        setPlayhead(startSeconds + 0.01);
        play();
      }}
    >
      {/* Thumbnail */}
      {clip.thumbnailUrl && widthPx > 80 && (
        <img
          src={clip.thumbnailUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-40 rounded-md pointer-events-none"
        />
      )}

      <div className="relative h-full flex flex-col justify-between px-2 py-1 min-w-0">
        <div className="flex items-center gap-1 min-w-0">
          <GripVertical className="w-3 h-3 opacity-50 shrink-0" />
          <span className="text-[11px] font-medium truncate drop-shadow">
            {clip.title}
          </span>
        </div>
        <div className="flex items-center justify-between gap-1">
          <span className="text-[9px] font-mono opacity-80">
            {formatTime(duration, true)}
          </span>
          {clip.muted && (
            <span className="text-[9px] px-1 rounded bg-black/40">muted</span>
          )}
        </div>
      </div>

      {/* Trim handles */}
      <div
        className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/40"
        onPointerDown={startDrag('trim', 'start')}
      >
        <div className="absolute top-1/2 -translate-y-1/2 left-0 w-0.5 h-6 bg-white/60" />
      </div>
      <div
        className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/40"
        onPointerDown={startDrag('trim', 'end')}
      >
        <div className="absolute top-1/2 -translate-y-1/2 right-0 w-0.5 h-6 bg-white/60" />
      </div>

      {/* Quick actions */}
      {isSelected && (
        <div
          className="absolute -top-9 left-1/2 -translate-x-1/2 flex items-center gap-1 rounded-md bg-neutral-900 border border-white/10 px-1 py-0.5 shadow-xl z-30"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <ClipAction
            label="Split"
            icon={<Scissors className="w-3 h-3" />}
            onClick={() => splitClip(clip.id, clip.trimStart + duration / 2)}
          />
          <ClipAction
            label="Duplicate"
            icon={<Copy className="w-3 h-3" />}
            onClick={() => duplicateClip(clip.id)}
          />
          <ClipAction
            label="Delete"
            icon={<Trash2 className="w-3 h-3" />}
            onClick={() => deleteClip(clip.id)}
            danger
          />
        </div>
      )}

      {/* Regenerate hint */}
      {!clip.videoUrl && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Sparkles className="w-3.5 h-3.5 opacity-60" />
        </div>
      )}
    </div>
  );
}

function ClipAction({
  label, icon, onClick, danger,
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      title={label}
      onClick={onClick}
      className={cn(
        'flex items-center gap-1 px-1.5 py-1 rounded text-[10px] text-neutral-300 hover:bg-white/10',
        danger && 'hover:text-rose-400',
      )}
    >
      {icon}
    </button>
  );
}
