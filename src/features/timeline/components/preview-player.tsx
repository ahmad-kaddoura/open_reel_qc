'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Play, Pause, SkipBack, SkipForward, Repeat, Maximize2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { useTimelineStore } from '../store/timeline-store';
import {
  clipDuration, overlayDuration, type OverlayElement, type TimelineClip,
} from '../lib/types';
import { clipStartTimes, totalProjectDuration } from '../lib/types';
import { formatTime } from '../lib/format';
import { cn } from '@/lib/utils';

interface PreviewPlayerProps {
  /** Aspect ratio from preset, e.g. 9/16 = 0.5625 */
  aspectRatio: number;
}

export function PreviewPlayer({ aspectRatio }: PreviewPlayerProps) {
  const clips = useTimelineStore((s) => s.clips);
  const audio = useTimelineStore((s) => s.audio);
  const overlays = useTimelineStore((s) => s.overlays);
  const captionsEnabled = useTimelineStore((s) => s.captionsEnabled);
  const toggleCaptions = useTimelineStore((s) => s.toggleCaptions);
  const playhead = useTimelineStore((s) => s.playhead);
  const isPlaying = useTimelineStore((s) => s.isPlaying);
  const play = useTimelineStore((s) => s.play);
  const pause = useTimelineStore((s) => s.pause);
  const togglePlay = useTimelineStore((s) => s.togglePlay);
  const restart = useTimelineStore((s) => s.restart);
  const setPlayhead = useTimelineStore((s) => s.setPlayhead);
  const selection = useTimelineStore((s) => s.selection);
  const selectClip = useTimelineStore((s) => s.selectClip);
  const pixelsPerSecond = useTimelineStore((s) => s.pixelsPerSecond);

  const total = useMemo(() => totalProjectDuration(clips), [clips]);
  const starts = useMemo(() => clipStartTimes(clips), [clips]);

  // Find clip at playhead
  const activeClipIndex = useMemo(() => {
    if (clips.length === 0) return -1;
    for (let i = 0; i < clips.length; i++) {
      const s = starts[i];
      const e = s + clipDuration(clips[i]);
      if (playhead >= s && playhead < e) return i;
    }
    if (playhead >= total) return clips.length - 1;
    return 0;
  }, [clips, starts, playhead, total]);

  const activeClip = activeClipIndex >= 0 ? clips[activeClipIndex] : null;
  const clipLocalTime = activeClipIndex >= 0
    ? Math.max(0, playhead - starts[activeClipIndex])
    : 0;

  // If a single clip is selected and we're not playing, preview that clip directly
  const previewClip: TimelineClip | null = useMemo(() => {
    if (selection?.type === 'clip') {
      const c = clips.find((x) => x.id === selection.id);
      if (c) return c;
    }
    return activeClip;
  }, [selection, clips, activeClip]);

  // Reset to start when clips are empty
  useEffect(() => {
    if (clips.length === 0 && playhead !== 0) setPlayhead(0);
  }, [clips.length, playhead, setPlayhead]);

  // Drive playback with rAF
  const lastTickRef = useRef<number | null>(null);
  useEffect(() => {
    if (!isPlaying) {
      lastTickRef.current = null;
      return;
    }
    let raf = 0;
    const tick = (now: number) => {
      if (lastTickRef.current == null) lastTickRef.current = now;
      const dt = (now - lastTickRef.current) / 1000;
      lastTickRef.current = now;
      const cur = useTimelineStore.getState().playhead + dt;
      if (cur >= total) {
        setPlayhead(total);
        pause();
        return;
      }
      setPlayhead(cur);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isPlaying, total, setPlayhead, pause]);

  const activeOverlays = useMemo(
    () => overlays.filter((o) => playhead >= o.start && playhead < o.end),
    [overlays, playhead],
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const previewMode: 'selected' | 'active' =
    selection?.type === 'clip' ? 'selected' : 'active';

  // For the selected-clip preview, show the clip from its trim start.
  const previewClipLocalTime = previewMode === 'selected' && previewClip
    ? Math.min(
        clipDuration(previewClip) - 0.01,
        clipLocalTime > 0 ? 0 : Math.max(0, previewClip.trimStart),
      )
    : clipLocalTime;

  const handleScrub = (val: number[]) => {
    pause();
    setPlayhead(val[0]);
  };

  const skip = (delta: number) => {
    pause();
    setPlayhead(Math.max(0, Math.min(total, playhead + delta)));
  };

  return (
    <div className="flex flex-col h-full bg-neutral-950/60">
      {/* Stage */}
      <div className="flex-1 flex items-center justify-center p-6 min-h-0 relative">
        <div
          ref={containerRef}
          className="relative bg-black rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/5"
          style={{
            aspectRatio: String(aspectRatio),
            height: 'min(100%, 460px)',
            maxHeight: '100%',
          }}
        >
          {previewClip?.videoUrl ? (
            <video
              key={previewClip.id}
              src={previewClip.videoUrl}
              className="absolute inset-0 w-full h-full object-contain"
              muted
              loop
              playsInline
              autoPlay={isPlaying}
              ref={(el) => {
                if (el) {
                  try {
                    el.currentTime = previewClipLocalTime;
                    if (isPlaying) void el.play().catch(() => {});
                    else el.pause();
                  } catch {
                    /* ignore seek errors */
                  }
                }
              }}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-center p-6">
              <div className="space-y-2 text-neutral-500">
                {previewClip?.thumbnailUrl ? (
                  <img
                    src={previewClip.thumbnailUrl}
                    alt={previewClip.title}
                    className="absolute inset-0 w-full h-full object-contain opacity-60"
                  />
                ) : null}
                <div className="relative">
                  <div className="text-sm font-medium text-neutral-300">
                    {clips.length === 0 ? 'No clips on the timeline' : 'No video for this clip yet'}
                  </div>
                  <div className="text-xs text-neutral-500">
                    {clips.length === 0
                      ? 'Generate scenes from the Workflow tab to populate the timeline.'
                      : 'Try Regenerate in the right panel.'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Overlays */}
          {activeOverlays.map((o) => (
            <OverlayRenderer key={o.id} overlay={o} />
          ))}

          {/* Caption label when toggled off */}
          {!captionsEnabled && activeOverlays.some((o) => o.kind === 'caption') && (
            <div className="absolute top-2 left-2 text-[10px] px-2 py-0.5 rounded bg-black/60 text-white/70">
              Captions hidden in preview
            </div>
          )}

          {/* Time badge */}
          <div className="absolute top-2 right-2 text-[10px] px-2 py-0.5 rounded bg-black/60 text-white/80 font-mono">
            {formatTime(playhead, true)} / {formatTime(total, true)}
          </div>
        </div>
      </div>

      {/* Transport */}
      <div className="px-4 pb-3 pt-2 border-t border-white/5 bg-neutral-950/40">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-neutral-300 hover:text-white hover:bg-white/10"
            onClick={() => { restart(); }}
            title="Restart"
          >
            <Repeat className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-neutral-300 hover:text-white hover:bg-white/10"
            onClick={() => skip(-5)}
            title="Back 5s"
          >
            <SkipBack className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            className="h-10 w-10 rounded-full bg-white text-black hover:bg-white/90"
            onClick={togglePlay}
            disabled={clips.length === 0}
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-neutral-300 hover:text-white hover:bg-white/10"
            onClick={() => skip(5)}
            title="Forward 5s"
          >
            <SkipForward className="w-4 h-4" />
          </Button>

          <div className="flex-1">
            <Slider
              value={[Math.min(playhead, total)]}
              min={0}
              max={Math.max(total, 0.1)}
              step={0.05}
              onValueChange={handleScrub}
              className="cursor-pointer"
            />
          </div>

          <div className="text-xs font-mono text-neutral-400 tabular-nums w-24 text-right">
            {formatTime(playhead, true)} / {formatTime(total, true)}
          </div>

          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/5">
            <span className="text-[10px] text-neutral-400">CC</span>
            <Switch
              checked={captionsEnabled}
              onCheckedChange={toggleCaptions}
              className="scale-90"
            />
          </div>
        </div>

        {/* Selected clip preview hint */}
        {selection?.type === 'clip' && (
          <div className="mt-2 flex items-center justify-between text-[11px] text-neutral-400">
            <span>
              Previewing selected clip ·{' '}
              <button
                className="text-white underline decoration-dotted"
                onClick={() => selectClip(null)}
              >
                switch to full video
              </button>
            </span>
            <span className="font-mono">
              zoom {Math.round(pixelsPerSecond)}px/s
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function OverlayRenderer({ overlay }: { overlay: OverlayElement }) {
  if (overlay.kind === 'shape') {
    return (
      <div
        className="absolute pointer-events-none"
        style={{
          left: `${overlay.position?.x ?? 50}%`,
          top: `${overlay.position?.y ?? 50}%`,
          transform: 'translate(-50%, -50%)',
        }}
      >
        <div
          className={cn(
            'border-2',
            overlay.shape === 'circle' && 'rounded-full',
            overlay.shape === 'pill' && 'rounded-full',
            overlay.shape === 'underline' && 'h-1 w-32 rounded-full',
          )}
          style={{
            width: overlay.shape === 'underline' ? undefined : 120,
            height: overlay.shape === 'underline' ? undefined : 60,
            borderColor: overlay.color,
            backgroundColor: overlay.backgroundColor !== 'transparent'
              ? overlay.backgroundColor
              : 'transparent',
            borderRadius: overlay.shape === 'rect' ? 8 : undefined,
          }}
        />
      </div>
    );
  }

  if (overlay.kind === 'image' && overlay.url) {
    return (
      <img
        src={overlay.url}
        alt={overlay.name}
        className="absolute pointer-events-none max-w-[60%] max-h-[40%] object-contain"
        style={{
          left: `${overlay.position?.x ?? 50}%`,
          top: `${overlay.position?.y ?? 50}%`,
          transform: 'translate(-50%, -50%)',
        }}
      />
    );
  }

  if (overlay.kind === 'sticker') {
    return (
      <div
        className="absolute pointer-events-none text-5xl select-none"
        style={{
          left: `${overlay.position?.x ?? 50}%`,
          top: `${overlay.position?.y ?? 50}%`,
          transform: 'translate(-50%, -50%)',
        }}
      >
        {overlay.text || '⭐'}
      </div>
    );
  }

  const isCaption = overlay.kind === 'caption';
  const animation = overlay.animation ?? 'fade';

  return (
    <motion.div
      key={overlay.id + overlay.start}
      initial={animationProps(animation).initial}
      animate={animationProps(animation).animate}
      transition={{ duration: 0.35 }}
      className="absolute pointer-events-none px-3 py-1.5 rounded-md font-semibold whitespace-pre-wrap text-center"
      style={{
        left: `${overlay.position?.x ?? 50}%`,
        top: `${overlay.position?.y ?? 50}%`,
        transform: 'translate(-50%, -50%)',
        fontSize: `${overlay.fontSize ?? 32}px`,
        color: overlay.color,
        fontWeight: overlay.fontWeight ?? 600,
        backgroundColor: overlay.backgroundColor && overlay.backgroundColor !== 'transparent'
          ? overlay.backgroundColor
          : 'rgba(0,0,0,0.35)',
        textShadow: '0 1px 2px rgba(0,0,0,0.6)',
        maxWidth: '85%',
      }}
    >
      {overlay.text || (isCaption ? 'Caption' : 'Text')}
    </motion.div>
  );
}

function animationProps(animation: OverlayElement['animation']) {
  switch (animation) {
    case 'fade': return { initial: { opacity: 0 }, animate: { opacity: 1 } };
    case 'slide': return { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 } };
    case 'pop': return { initial: { opacity: 0, scale: 0.8 }, animate: { opacity: 1, scale: 1 } };
    case 'typewriter': return { initial: { opacity: 0.5 }, animate: { opacity: 1 } };
    default: return { initial: { opacity: 1 }, animate: { opacity: 1 } };
  }
}
