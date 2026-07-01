'use client';

import { useMemo } from 'react';
import { useTimelineStore } from '../store/timeline-store';
import { totalProjectDuration } from '../lib/types';
import { formatTime } from '../lib/format';

interface TimelineRulerProps {
  /** Total visible width in pixels */
  width: number;
  /** Total project duration (seconds) — if omitted, computed from clips */
  duration?: number;
  /** Right padding (seconds) to leave at the end of the timeline */
  tailPadding?: number;
}

export function TimelineRuler({ width, duration, tailPadding = 4 }: TimelineRulerProps) {
  const pps = useTimelineStore((s) => s.pixelsPerSecond);
  const clips = useTimelineStore((s) => s.clips);
  const setPlayhead = useTimelineStore((s) => s.setPlayhead);
  const pause = useTimelineStore((s) => s.pause);

  const total = duration ?? totalProjectDuration(clips) + tailPadding;
  const step = useMemo(() => pickStep(pps), [pps]);

  const ticks: number[] = [];
  for (let t = 0; t <= total; t += step) ticks.push(t);
  // Always include the final marker if it falls between grid lines
  if (ticks[ticks.length - 1] < total - 0.01) ticks.push(total);

  return (
    <div
      className="relative h-7 select-none"
      style={{ width: Math.max(width, total * pps) }}
      onPointerDown={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        pause();
        setPlayhead(Math.max(0, x / pps));
      }}
    >
      {ticks.map((t, i) => {
        const isMajor = i % 5 === 0;
        return (
          <div
            key={i}
            className="absolute top-0 bottom-0"
            style={{ left: t * pps }}
          >
            <div
              className={`w-px ${isMajor ? 'h-3.5 bg-white/20' : 'h-2 bg-white/10'}`}
            />
            {isMajor && (
              <span className="absolute top-3.5 left-1 text-[10px] text-neutral-500 font-mono tabular-nums">
                {formatTime(t)}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function pickStep(pps: number): number {
  // Aim for ~70px between major ticks
  const targetSeconds = 70 / pps;
  const steps = [0.5, 1, 2, 5, 10, 15, 30, 60, 120];
  for (const s of steps) if (s >= targetSeconds) return s;
  return 300;
}
