'use client';

import {
  Trash2, Copy, RefreshCw, Replace, Scissors,
  ChevronLeft, ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { useTimelineStore } from '../store/timeline-store';
import type { TimelineClip } from '../lib/types';
import { clipDuration, clipStartTimes } from '../lib/types';
import { formatTime, clamp } from '../lib/format';

interface ClipEditorPanelProps {
  clip: TimelineClip;
  clipIndex: number;
  totalClips: number;
}

export function ClipEditorPanel({ clip, clipIndex, totalClips }: ClipEditorPanelProps) {
  const setClipTitle = useTimelineStore((s) => s.setClipTitle);
  const setClipTrim = useTimelineStore((s) => s.setClipTrim);
  const setClipMute = useTimelineStore((s) => s.setClipMute);
  const setClipVolume = useTimelineStore((s) => s.setClipVolume);
  const deleteClip = useTimelineStore((s) => s.deleteClip);
  const duplicateClip = useTimelineStore((s) => s.duplicateClip);
  const splitClip = useTimelineStore((s) => s.splitClip);
  const replaceClipMedia = useTimelineStore((s) => s.replaceClipMedia);
  const regenerateClip = useTimelineStore((s) => s.regenerateClip);
  const moveClip = useTimelineStore((s) => s.moveClip);
  const selectClip = useTimelineStore((s) => s.selectClip);
  const clips = useTimelineStore((s) => s.clips);
  const setPlayhead = useTimelineStore((s) => s.setPlayhead);
  const pause = useTimelineStore((s) => s.pause);

  const starts = clipStartTimes(clips);
  const start = starts[clipIndex];
  const duration = clipDuration(clip);
  const end = start + duration;

  const replaceInput = (accept: 'video' | 'image') => () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept === 'video' ? 'video/*' : 'image/*';
    input.onchange = () => {
      const f = input.files?.[0];
      if (!f) return;
      const url = URL.createObjectURL(f);
      if (accept === 'image') replaceClipMedia(clip.id, clip.videoUrl ?? url, url);
      else replaceClipMedia(clip.id, url);
    };
    input.click();
  };

  const go = (dir: -1 | 1) => {
    const target = clamp(clipIndex + dir, 0, totalClips - 1);
    const id = clips[target]?.id;
    if (id) selectClip(id);
  };

  return (
    <div className="flex flex-col h-full bg-neutral-950/40 border-l border-white/5 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-white/5 shrink-0">
        <button
          onClick={() => selectClip(null)}
          className="text-neutral-400 hover:text-white"
          title="Deselect"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] text-neutral-500 uppercase tracking-wide">Clip {clipIndex + 1} of {totalClips}</div>
          <div className="text-xs font-semibold text-neutral-100 truncate">{clip.title}</div>
        </div>
        <button
          onClick={() => go(1)}
          disabled={clipIndex >= totalClips - 1}
          className="text-neutral-400 hover:text-white disabled:opacity-30"
          title="Next clip"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-auto p-3 space-y-4 min-h-0">
        {/* Thumbnail */}
        <div className="aspect-video rounded-md overflow-hidden bg-black border border-white/5 relative">
          {clip.thumbnailUrl ? (
            <img src={clip.thumbnailUrl} alt={clip.title} className="w-full h-full object-contain" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-[10px] text-neutral-600">
              No thumbnail yet
            </div>
          )}
          {clip.videoUrl && (
            <video
              src={clip.videoUrl}
              className="absolute inset-0 w-full h-full object-contain opacity-0 hover:opacity-100"
              muted
              controls
              onMouseEnter={(e) => e.currentTarget.play().catch(() => {})}
              onMouseLeave={(e) => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }}
            />
          )}
        </div>

        {/* Title */}
        <div>
          <Label className="text-[10px] text-neutral-500">Clip title</Label>
          <Input
            value={clip.title}
            onChange={(e) => setClipTitle(clip.id, e.target.value)}
            className="h-8 mt-1 bg-white/5 border-white/10 text-xs"
          />
        </div>

        {/* Time */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <TimeStat label="Start" value={formatTime(start, true)} />
          <TimeStat label="End" value={formatTime(end, true)} />
          <TimeStat label="Duration" value={formatTime(duration, true)} />
        </div>

        {/* Trim */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-[10px] text-neutral-500">Trim (source seconds)</Label>
            <span className="text-[10px] font-mono text-neutral-400">
              {clip.trimStart.toFixed(1)} → {clip.trimEnd.toFixed(1)} / {clip.sourceDuration.toFixed(1)}s
            </span>
          </div>
          <div>
            <div className="flex items-center justify-between text-[10px] text-neutral-500">
              <span>Start</span>
              <span className="font-mono">{clip.trimStart.toFixed(2)}s</span>
            </div>
            <Slider
              value={[clip.trimStart]}
              min={0}
              max={Math.max(0, clip.sourceDuration - 0.3)}
              step={0.05}
              onValueChange={(v) => setClipTrim(clip.id, v[0], clip.trimEnd)}
            />
          </div>
          <div>
            <div className="flex items-center justify-between text-[10px] text-neutral-500">
              <span>End</span>
              <span className="font-mono">{clip.trimEnd.toFixed(2)}s</span>
            </div>
            <Slider
              value={[clip.trimEnd]}
              min={0.3}
              max={clip.sourceDuration}
              step={0.05}
              onValueChange={(v) => setClipTrim(clip.id, clip.trimStart, v[0])}
            />
          </div>
        </div>

        {/* Audio */}
        <div className="space-y-2 rounded-md border border-white/5 p-2.5 bg-white/[0.02]">
          <div className="flex items-center justify-between">
            <Label className="text-[10px] text-neutral-500">Original clip audio</Label>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-neutral-400">{clip.muted ? 'Muted' : 'On'}</span>
              <Switch
                checked={!clip.muted}
                onCheckedChange={(v) => setClipMute(clip.id, !v)}
                className="scale-90"
              />
            </div>
          </div>
          <div className={clip.muted ? 'opacity-40 pointer-events-none' : ''}>
            <div className="flex items-center justify-between text-[10px] text-neutral-500">
              <span>Volume</span>
              <span className="font-mono">{Math.round(clip.volume * 100)}%</span>
            </div>
            <Slider
              value={[clip.volume]}
              min={0}
              max={1}
              step={0.05}
              onValueChange={(v) => setClipVolume(clip.id, v[0])}
            />
          </div>
        </div>

        {/* Prompt */}
        {clip.prompt && (
          <div>
            <Label className="text-[10px] text-neutral-500">Prompt used</Label>
            <p className="mt-1 text-[11px] text-neutral-400 leading-relaxed bg-white/[0.02] border border-white/5 rounded-md p-2 max-h-32 overflow-auto">
              {clip.prompt}
            </p>
          </div>
        )}

        {/* Frame previews */}
        <div className="grid grid-cols-2 gap-2">
          <FramePreview label="Start frame" url={clip.thumbnailUrl} />
          <FramePreview label="End frame" url={undefined} />
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-1.5">
          <ActionButton icon={<ChevronLeft className="w-3.5 h-3.5" />} label="Move left" onClick={() => moveClip(clip.id, -1)} disabled={clipIndex === 0} />
          <ActionButton icon={<ChevronRight className="w-3.5 h-3.5" />} label="Move right" onClick={() => moveClip(clip.id, 1)} disabled={clipIndex >= totalClips - 1} />
          <ActionButton icon={<Scissors className="w-3.5 h-3.5" />} label="Split" onClick={() => splitClip(clip.id, clip.trimStart + duration / 2)} />
          <ActionButton icon={<Copy className="w-3.5 h-3.5" />} label="Duplicate" onClick={() => duplicateClip(clip.id)} />
          <ActionButton icon={<Replace className="w-3.5 h-3.5" />} label="Replace media" onClick={replaceInput('video')} />
          <ActionButton icon={<RefreshCw className="w-3.5 h-3.5" />} label="Regenerate" onClick={() => regenerateClip(clip.id)} />
        </div>

        <Button
          variant="outline"
          size="sm"
          className="w-full h-8 border-rose-500/30 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
          onClick={() => deleteClip(clip.id)}
        >
          <Trash2 className="w-3.5 h-3.5" /> Delete clip
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="w-full h-7 text-neutral-400"
          onClick={() => { pause(); setPlayhead(start + 0.01); }}
        >
          Move playhead to clip start
        </Button>
      </div>
    </div>
  );
}

function TimeStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/5 bg-white/[0.02] py-1.5">
      <div className="text-[9px] text-neutral-500 uppercase tracking-wide">{label}</div>
      <div className="text-[11px] font-mono text-neutral-200 mt-0.5">{value}</div>
    </div>
  );
}

function FramePreview({ label, url }: { label: string; url?: string }) {
  return (
    <div className="aspect-video rounded-md overflow-hidden bg-black border border-white/5 relative">
      {url ? (
        <img src={url} alt={label} className="w-full h-full object-contain" />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-[9px] text-neutral-600">
          {label}
        </div>
      )}
      <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-[9px] text-neutral-400 px-1 py-0.5">
        {label}
      </div>
    </div>
  );
}

function ActionButton({
  icon, label, onClick, disabled,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <Button
      variant="outline"
      size="sm"
      className="h-7 text-[11px] gap-1.5 border-white/10 bg-white/[0.02] text-neutral-300 hover:bg-white/10 hover:text-white"
      onClick={onClick}
      disabled={disabled}
    >
      {icon}
      {label}
    </Button>
  );
}
