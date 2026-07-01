'use client';

import { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX, Trash2, Music2, Mic, Wand2, Upload } from 'lucide-react';
import { useTimelineStore } from '../store/timeline-store';
import type { AudioItem, AudioKind } from '../lib/types';
import { formatTime } from '../lib/format';
import { cn } from '@/lib/utils';

interface AudioTrackRowProps {
  trackIndex: number;
  items: AudioItem[];
  pixelsPerSecond: number;
}

const KIND_ICON: Record<AudioKind, React.ComponentType<{ className?: string }>> = {
  music: Music2,
  voiceover: Mic,
  sfx: Wand2,
  uploaded: Upload,
};

type Drag =
  | { kind: 'move'; startX: number }
  | { kind: 'trim'; edge: 'start' | 'end'; startX: number }
  | null;

export function AudioTrackRow({ trackIndex, items, pixelsPerSecond }: AudioTrackRowProps) {
  return (
    <div className="relative h-12 bg-white/[0.02] rounded-md border border-white/5">
      {items.map((item) => (
        <AudioBlock
          key={item.id}
          item={item}
          pixelsPerSecond={pixelsPerSecond}
        />
      ))}
      {items.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-[10px] text-neutral-600">
          Audio track {trackIndex + 1}
        </div>
      )}
    </div>
  );
}

function AudioBlock({ item, pixelsPerSecond }: { item: AudioItem; pixelsPerSecond: number }) {
  const select = useTimelineStore((s) => s.selectAudio);
  const update = useTimelineStore((s) => s.updateAudio);
  const trim = useTimelineStore((s) => s.trimAudio);
  const move = useTimelineStore((s) => s.moveAudio);
  const del = useTimelineStore((s) => s.deleteAudio);
  const isSelected = useTimelineStore((s) =>
    s.selection?.type === 'audio' && s.selection.id === item.id);

  const dragRef = useRef<Drag>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      const dt = (e.clientX - drag.startX) / pixelsPerSecond;
      if (drag.kind === 'move') {
        move(item.id, dt);
        drag.startX = e.clientX;
      } else if (drag.kind === 'trim') {
        trim(item.id, drag.edge, dt);
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
  }, [isDragging, item.id, move, pixelsPerSecond, trim]);

  const start = (kind: 'move' | 'trim', edge?: 'start' | 'end') =>
    (e: React.PointerEvent) => {
      e.stopPropagation();
      e.preventDefault();
      select(item.id);
      dragRef.current = kind === 'trim'
        ? { kind: 'trim', edge: edge!, startX: e.clientX }
        : { kind: 'move', startX: e.clientX };
      setIsDragging(true);
    };

  const widthPx = Math.max(36, item.duration * pixelsPerSecond);
  const leftPx = item.start * pixelsPerSecond;
  const Icon = KIND_ICON[item.kind];

  return (
    <div
      className={cn(
        'group absolute top-1 bottom-1 rounded-md border cursor-grab active:cursor-grabbing overflow-hidden',
        item.color,
        isSelected && 'ring-2 ring-white/80 ring-offset-1 ring-offset-neutral-900 z-20',
      )}
      style={{ left: leftPx, width: widthPx }}
      onPointerDown={start('move')}
    >
      {/* Waveform */}
      <div className="absolute inset-0 flex items-center gap-px px-1.5 opacity-60 pointer-events-none">
        {(item.waveform ?? []).slice(0, Math.max(8, Math.floor(widthPx / 3))).map((v, i) => (
          <div
            key={i}
            className="flex-1 bg-current rounded-full"
            style={{ height: `${Math.max(8, v * 80)}%` }}
          />
        ))}
      </div>

      <div className="relative h-full flex items-center gap-1.5 px-2 min-w-0 pointer-events-none">
        <Icon className="w-3 h-3 shrink-0 opacity-80" />
        <span className="text-[10px] font-medium truncate">{item.name}</span>
        <span className="ml-auto text-[9px] font-mono opacity-70">
          {formatTime(item.duration, true)}
        </span>
      </div>

      {/* Volume / mute / delete controls on selection */}
      {isSelected && (
        <div
          className="absolute -top-9 left-1/2 -translate-x-1/2 flex items-center gap-1 rounded-md bg-neutral-900 border border-white/10 px-1 py-0.5 shadow-xl z-30 pointer-events-auto"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <button
            title={item.volume > 0 ? 'Mute' : 'Unmute'}
            onClick={() => update(item.id, { volume: item.volume > 0 ? 0 : 0.8 })}
            className="p-1 rounded text-neutral-300 hover:bg-white/10"
          >
            {item.volume > 0 ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={item.volume}
            onChange={(e) => update(item.id, { volume: Number(e.target.value) })}
            className="w-16 accent-emerald-400"
          />
          <button
            title="Delete"
            onClick={() => del(item.id)}
            className="p-1 rounded text-neutral-300 hover:bg-white/10 hover:text-rose-400"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Trim handles */}
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
