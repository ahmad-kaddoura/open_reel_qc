'use client';

import { useEffect, useRef, useState } from 'react';
import { Trash2, Copy, Type as TypeIcon, Captions, Sticker, Image as ImageIcon, Square, Sparkles } from 'lucide-react';
import { useTimelineStore } from '../store/timeline-store';
import type { OverlayElement, OverlayKind } from '../lib/types';
import { overlayDuration } from '../lib/types';
import { formatTime } from '../lib/format';
import { cn } from '@/lib/utils';

interface OverlayTrackRowProps {
  trackIndex: number;
  overlays: OverlayElement[];
  pixelsPerSecond: number;
}

const KIND_ICON: Record<OverlayKind, React.ComponentType<{ className?: string }>> = {
  text: TypeIcon,
  caption: Captions,
  sticker: Sticker,
  image: ImageIcon,
  shape: Square,
  cta: Sparkles,
  effect: Sparkles,
};

const KIND_LABEL: Record<OverlayKind, string> = {
  text: 'Text', caption: 'Caption', sticker: 'Sticker', image: 'Image',
  shape: 'Shape', cta: 'CTA', effect: 'Effect',
};

type Drag =
  | { kind: 'move'; startX: number }
  | { kind: 'trim'; edge: 'start' | 'end'; startX: number }
  | null;

export function OverlayTrackRow({ trackIndex, overlays, pixelsPerSecond }: OverlayTrackRowProps) {
  return (
    <div className="relative h-9 bg-white/[0.02] rounded-md border border-white/5">
      {overlays.map((o) => (
        <OverlayBlock key={o.id} overlay={o} pixelsPerSecond={pixelsPerSecond} />
      ))}
      {overlays.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-[10px] text-neutral-600">
          Overlay track {trackIndex + 1}
        </div>
      )}
    </div>
  );
}

function OverlayBlock({ overlay, pixelsPerSecond }: { overlay: OverlayElement; pixelsPerSecond: number }) {
  const select = useTimelineStore((s) => s.selectOverlay);
  const update = useTimelineStore((s) => s.updateOverlay);
  const trim = useTimelineStore((s) => s.trimOverlay);
  const move = useTimelineStore((s) => s.moveOverlay);
  const del = useTimelineStore((s) => s.deleteOverlay);
  const dup = useTimelineStore((s) => s.duplicateOverlay);
  const isSelected = useTimelineStore((s) =>
    s.selection?.type === 'overlay' && s.selection.id === overlay.id);

  const dragRef = useRef<Drag>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      const dt = (e.clientX - drag.startX) / pixelsPerSecond;
      if (drag.kind === 'move') {
        move(overlay.id, dt);
        drag.startX = e.clientX;
      } else if (drag.kind === 'trim') {
        trim(overlay.id, drag.edge, dt);
        drag.startX = e.clientX;
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
  }, [isDragging, overlay.id, move, pixelsPerSecond, trim]);

  const start = (kind: 'move' | 'trim', edge?: 'start' | 'end') =>
    (e: React.PointerEvent) => {
      e.stopPropagation();
      e.preventDefault();
      select(overlay.id);
      dragRef.current = kind === 'trim'
        ? { kind: 'trim', edge: edge!, startX: e.clientX }
        : { kind: 'move', startX: e.clientX };
      setIsDragging(true);
    };

  const duration = overlayDuration(overlay);
  const widthPx = Math.max(40, duration * pixelsPerSecond);
  const leftPx = overlay.start * pixelsPerSecond;
  const Icon = KIND_ICON[overlay.kind];

  return (
    <div
      className={cn(
        'group absolute top-1 bottom-1 rounded-md border cursor-grab active:cursor-grabbing overflow-hidden flex items-center px-2 gap-1.5 min-w-0',
        overlay.kind === 'caption'
          ? 'bg-amber-500/25 border-amber-400/40 text-amber-100'
          : overlay.kind === 'cta'
            ? 'bg-rose-500/25 border-rose-400/40 text-rose-100'
            : 'bg-purple-500/25 border-purple-400/40 text-purple-100',
        isSelected && 'ring-2 ring-white/80 ring-offset-1 ring-offset-neutral-900 z-20',
      )}
      style={{ left: leftPx, width: widthPx }}
      onPointerDown={start('move')}
    >
      <Icon className="w-3 h-3 shrink-0 opacity-80" />
      <span className="text-[10px] font-medium truncate">
        {overlay.kind === 'caption' || overlay.kind === 'text' || overlay.kind === 'cta'
          ? (overlay.text || KIND_LABEL[overlay.kind])
          : KIND_LABEL[overlay.kind]}
      </span>
      <span className="ml-auto text-[9px] font-mono opacity-70 shrink-0">
        {formatTime(duration, true)}
      </span>

      {isSelected && (
        <div
          className="absolute -top-9 left-1/2 -translate-x-1/2 flex items-center gap-1 rounded-md bg-neutral-900 border border-white/10 px-1 py-0.5 shadow-xl z-30"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <button
            title="Duplicate"
            onClick={() => dup(overlay.id)}
            className="p-1 rounded text-neutral-300 hover:bg-white/10"
          >
            <Copy className="w-3 h-3" />
          </button>
          <button
            title="Delete"
            onClick={() => del(overlay.id)}
            className="p-1 rounded text-neutral-300 hover:bg-white/10 hover:text-rose-400"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      )}

      <div
        className="absolute left-0 top-0 bottom-0 w-1.5 cursor-ew-resize hover:bg-white/40"
        onPointerDown={start('trim', 'start')}
      />
      <div
        className="absolute right-0 top-0 bottom-0 w-1.5 cursor-ew-resize hover:bg-white/40"
        onPointerDown={start('trim', 'end')}
      />
    </div>
  );
}
