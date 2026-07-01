'use client';

import { useEffect, useRef, useState } from 'react';
import { Plus, ZoomIn, ZoomOut, Music2, Type as TypeIcon, Captions } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTimelineStore } from '../store/timeline-store';
import { totalProjectDuration, clipStartTimes } from '../lib/types';
import { TimelineRuler } from './timeline-ruler';
import { TimelineClipView } from './timeline-clip';
import { AudioTrackRow } from './audio-track';
import { OverlayTrackRow } from './overlay-track';
import { formatTime } from '../lib/format';

interface TimelineEditorProps {
  tailPadding?: number;
}

export function TimelineEditor({ tailPadding = 6 }: TimelineEditorProps) {
  const clips = useTimelineStore((s) => s.clips);
  const audio = useTimelineStore((s) => s.audio);
  const overlays = useTimelineStore((s) => s.overlays);
  const audioTrackCount = useTimelineStore((s) => s.audioTrackCount);
  const overlayTrackCount = useTimelineStore((s) => s.overlayTrackCount);
  const addAudioTrack = useTimelineStore((s) => s.addAudioTrack);
  const addOverlayTrack = useTimelineStore((s) => s.addOverlayTrack);
  const pps = useTimelineStore((s) => s.pixelsPerSecond);
  const zoomIn = useTimelineStore((s) => s.zoomIn);
  const zoomOut = useTimelineStore((s) => s.zoomOut);
  const playhead = useTimelineStore((s) => s.playhead);
  const setPlayhead = useTimelineStore((s) => s.setPlayhead);
  const pause = useTimelineStore((s) => s.pause);
  const selection = useTimelineStore((s) => s.selection);
  const addOverlay = useTimelineStore((s) => s.addOverlay);
  const addAudio = useTimelineStore((s) => s.addAudio);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(800);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setContainerWidth(el.clientWidth));
    ro.observe(el);
    setContainerWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  const total = totalProjectDuration(clips) + tailPadding;
  const contentWidth = Math.max(containerWidth, total * pps);
  const starts = clipStartTimes(clips);

  const audioByTrack = Array.from({ length: audioTrackCount }, (_, i) =>
    audio.filter((a) => a.trackIndex === i));
  const overlayByTrack = Array.from({ length: overlayTrackCount }, (_, i) =>
    overlays.filter((o) => o.trackIndex === i));

  const handleScrub = (clientX: number, target: HTMLElement) => {
    const rect = target.getBoundingClientRect();
    pause();
    setPlayhead(Math.max(0, (clientX - rect.left) / pps));
  };

  return (
    <div className="flex flex-col h-full bg-neutral-950/40 border-t border-white/5 min-h-0">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5 shrink-0">
        <div className="text-xs text-neutral-400 font-mono tabular-nums">
          {formatTime(playhead, true)} <span className="text-neutral-600">/</span>{' '}
          {formatTime(totalProjectDuration(clips), true)}
        </div>
        <div className="ml-2 flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-neutral-300 hover:bg-white/10 hover:text-white gap-1.5"
            onClick={() => { const id = addOverlay('text'); useTimelineStore.getState().selectOverlay(id); }}
          >
            <TypeIcon className="w-3.5 h-3.5" /> Text
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-neutral-300 hover:bg-white/10 hover:text-white gap-1.5"
            onClick={() => { const id = addOverlay('caption', { start: playhead, end: playhead + 2 }); useTimelineStore.getState().selectOverlay(id); }}
          >
            <Captions className="w-3.5 h-3.5" /> Caption
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-neutral-300 hover:bg-white/10 hover:text-white gap-1.5"
            onClick={() => { const id = addAudio('music'); useTimelineStore.getState().selectAudio(id); }}
          >
            <Music2 className="w-3.5 h-3.5" /> Music
          </Button>
        </div>
        <div className="ml-auto flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-neutral-300 hover:bg-white/10 hover:text-white"
            onClick={zoomOut}
            title="Zoom out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </Button>
          <span className="text-[10px] text-neutral-500 w-12 text-center font-mono">
            {Math.round(pps)}px/s
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-neutral-300 hover:bg-white/10 hover:text-white"
            onClick={zoomIn}
            title="Zoom in"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Scroll area */}
      <div className="flex-1 overflow-auto min-h-0" ref={scrollRef}>
        <div className="relative min-w-full" style={{ width: contentWidth }}>
          {/* Single playhead spanning the whole track area */}
          <Playhead leftPx={playhead * pps} />

          <div className="grid" style={{ gridTemplateColumns: '120px 1fr' }}>
            {/* Header row */}
            <div className="sticky left-0 top-0 z-40 bg-neutral-950/80 backdrop-blur-sm border-r border-white/5 h-7" />
            <div className="sticky top-0 z-20 bg-neutral-950/80 backdrop-blur-sm">
              <TimelineRuler width={containerWidth - 120} duration={total} />
            </div>

            {/* Video track */}
            <TrackLabel
              icon={<VideoIcon />}
              label="Video"
              badge={`${clips.length} clip${clips.length === 1 ? '' : 's'}`}
            />
            <div
              className="relative h-14 bg-white/[0.02] border-y border-white/5"
              onPointerDown={(e) => handleScrub(e.clientX, e.currentTarget)}
            >
              {clips.map((clip, i) => (
                <TimelineClipView
                  key={clip.id}
                  clip={clip}
                  startSeconds={starts[i]}
                  pixelsPerSecond={pps}
                  isSelected={selection?.type === 'clip' && selection.id === clip.id}
                />
              ))}
              {clips.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center text-[11px] text-neutral-600">
                  Generate scenes from the Workflow tab — they will appear here as clips.
                </div>
              )}
            </div>

            {/* Audio tracks */}
            {audioByTrack.map((items, i) => (
              <div key={`audio-${i}`} className="contents">
                <TrackLabel
                  icon={<Music2 className="w-3.5 h-3.5" />}
                  label={`Audio ${i + 1}`}
                  onAdd={i === audioTrackCount - 1 ? addAudioTrack : undefined}
                />
                <div
                  className="relative"
                  onPointerDown={(e) => handleScrub(e.clientX, e.currentTarget)}
                >
                  <AudioTrackRow trackIndex={i} items={items} pixelsPerSecond={pps} />
                </div>
              </div>
            ))}

            {/* Overlay tracks */}
            {overlayByTrack.map((items, i) => (
              <div key={`ovl-${i}`} className="contents">
                <TrackLabel
                  icon={<TypeIcon className="w-3.5 h-3.5" />}
                  label={`Overlay ${i + 1}`}
                  onAdd={i === overlayTrackCount - 1 ? addOverlayTrack : undefined}
                />
                <div
                  className="relative"
                  onPointerDown={(e) => handleScrub(e.clientX, e.currentTarget)}
                >
                  <OverlayTrackRow trackIndex={i} overlays={items} pixelsPerSecond={pps} />
                </div>
              </div>
            ))}

            {/* Footer spacer row so the last track isn't flush against the bottom */}
            <div className="bg-neutral-950/80 border-r border-white/5" />
            <div className="h-6" />
          </div>
        </div>
      </div>
    </div>
  );
}

function TrackLabel({
  icon, label, badge, onAdd,
}: {
  icon: React.ReactNode;
  label: string;
  badge?: string;
  onAdd?: () => void;
}) {
  return (
    <div className="sticky left-0 z-30 bg-neutral-950/80 backdrop-blur-sm border-r border-white/5 px-2.5 py-2 flex flex-col justify-center gap-1 min-w-0">
      <div className="flex items-center gap-1.5 text-neutral-300">
        <span className="text-neutral-400">{icon}</span>
        <span className="text-[11px] font-medium truncate">{label}</span>
      </div>
      <div className="flex items-center gap-1.5">
        {badge && <span className="text-[9px] text-neutral-500">{badge}</span>}
        {onAdd && (
          <button
            onClick={onAdd}
            className="text-neutral-500 hover:text-white inline-flex items-center gap-0.5 text-[9px]"
          >
            <Plus className="w-3 h-3" /> Track
          </button>
        )}
      </div>
    </div>
  );
}

function Playhead({ leftPx }: { leftPx: number }) {
  return (
    <div
      className="absolute top-0 bottom-0 pointer-events-none"
      style={{ left: leftPx, transform: 'translateX(120px)', zIndex: 25 }}
    >
      <div className="w-px h-full bg-rose-500" />
      <div className="absolute -top-0 -left-1.5 w-3 h-3 bg-rose-500 rounded-sm rotate-45 shadow-md" />
    </div>
  );
}

function VideoIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
      <rect x="2" y="6" width="14" height="12" rx="2" />
      <path d="m16 10 6-3v10l-6-3z" />
    </svg>
  );
}
