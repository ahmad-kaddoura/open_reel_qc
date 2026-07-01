import type { Scene } from '@/core/types';

export type TimelineItemType =
  | 'clip'
  | 'audio'
  | 'text'
  | 'caption'
  | 'sticker'
  | 'image'
  | 'shape'
  | 'cta'
  | 'effect';

export interface TimelineClip {
  id: string;
  sceneId?: string;
  title: string;
  /** Total length of the source media, in seconds */
  sourceDuration: number;
  /** Trim point inside the source media, in seconds */
  trimStart: number;
  /** Trim end point inside the source media, in seconds (<= sourceDuration) */
  trimEnd: number;
  videoUrl?: string;
  thumbnailUrl?: string;
  prompt?: string;
  /** Mute the original audio from this clip */
  muted: boolean;
  /** Volume multiplier for the original audio (0..1) */
  volume: number;
  color: string;
  /** Render order on the video track. Computed from clip order. */
}

export type AudioKind = 'music' | 'voiceover' | 'sfx' | 'uploaded';

export interface AudioItem {
  id: string;
  kind: AudioKind;
  name: string;
  /** Timeline position (seconds from project start) */
  start: number;
  /** Trimmed length on the timeline (seconds) */
  duration: number;
  /** Original source length, seconds */
  sourceDuration: number;
  trimStart: number;
  volume: number;
  url?: string;
  /** faked waveform peaks 0..1 */
  waveform?: number[];
  trackIndex: number;
  color: string;
}

export type OverlayKind =
  | 'text'
  | 'caption'
  | 'sticker'
  | 'image'
  | 'shape'
  | 'cta'
  | 'effect';

export interface OverlayElement {
  id: string;
  kind: OverlayKind;
  trackIndex: number;
  /** Timeline start (seconds) */
  start: number;
  /** Timeline end (seconds) */
  end: number;
  // Common
  name: string;
  // Text-ish
  text?: string;
  fontSize?: number;
  fontWeight?: number;
  color?: string;
  backgroundColor?: string;
  position?: { x: number; y: number };
  animation?: 'none' | 'fade' | 'slide' | 'pop' | 'typewriter';
  // Media
  url?: string;
  // Shape / sticker
  shape?: 'rect' | 'circle' | 'underline' | 'pill';
  // Caption
  enabled?: boolean;
}

export type SelectionId =
  | { type: 'clip'; id: string }
  | { type: 'audio'; id: string }
  | { type: 'overlay'; id: string }
  | null;

export type RenderState =
  | { status: 'idle' }
  | { status: 'rendering'; progress: number }
  | { status: 'done'; progress: 100; url?: string }
  | { status: 'failed'; error: string };

export interface TimelineSnapshot {
  clips: TimelineClip[];
  audio: AudioItem[];
  overlays: OverlayElement[];
  captionsEnabled: boolean;
}

export function clipDuration(c: TimelineClip): number {
  return Math.max(0.1, c.trimEnd - c.trimStart);
}

export function overlayDuration(o: OverlayElement): number {
  return Math.max(0.1, o.end - o.start);
}

/** Project total duration = sum of clip durations (clips are sequential on the video track). */
export function totalProjectDuration(clips: TimelineClip[]): number {
  return clips.reduce((acc, c) => acc + clipDuration(c), 0);
}

/** Compute the timeline start time of each clip (sequential). */
export function clipStartTimes(clips: TimelineClip[]): number[] {
  const out: number[] = [];
  let t = 0;
  for (const c of clips) {
    out.push(t);
    t += clipDuration(c);
  }
  return out;
}

export const CLIP_COLORS = [
  'bg-blue-500/25 border-blue-400/50 text-blue-100',
  'bg-violet-500/25 border-violet-400/50 text-violet-100',
  'bg-emerald-500/25 border-emerald-400/50 text-emerald-100',
  'bg-amber-500/25 border-amber-400/50 text-amber-100',
  'bg-rose-500/25 border-rose-400/50 text-rose-100',
  'bg-cyan-500/25 border-cyan-400/50 text-cyan-100',
];

export const AUDIO_COLORS: Record<AudioKind, string> = {
  music: 'bg-emerald-500/30 border-emerald-400/40 text-emerald-100',
  voiceover: 'bg-sky-500/30 border-sky-400/40 text-sky-100',
  sfx: 'bg-fuchsia-500/30 border-fuchsia-400/40 text-fuchsia-100',
  uploaded: 'bg-slate-500/30 border-slate-400/40 text-slate-100',
};

export const OVERLAY_COLORS: Record<OverlayKind, string> = {
  text: 'bg-purple-500/30 border-purple-400/40 text-purple-100',
  caption: 'bg-amber-500/30 border-amber-400/40 text-amber-100',
  sticker: 'bg-pink-500/30 border-pink-400/40 text-pink-100',
  image: 'bg-indigo-500/30 border-indigo-400/40 text-indigo-100',
  shape: 'bg-cyan-500/30 border-cyan-400/40 text-cyan-100',
  cta: 'bg-rose-500/30 border-rose-400/40 text-rose-100',
  effect: 'bg-teal-500/30 border-teal-400/40 text-teal-100',
};

export interface BuildClipsOptions {
  /** Waveform seed for scenes with generated audio */
  generateWaveform?: (seed: string) => number[];
}

/** Build a fresh set of timeline clips from workflow scenes. */
export function buildClipsFromScenes(scenes: Scene[]): TimelineClip[] {
  return scenes.map((scene, idx) => ({
    id: `clip-${scene.id}`,
    sceneId: scene.id,
    title: `#${idx + 1} ${scene.title}`,
    sourceDuration: scene.duration || 5,
    trimStart: 0,
    trimEnd: scene.duration || 5,
    videoUrl: scene.generatedVideoUrl,
    thumbnailUrl: scene.generatedStartFrameUrl || scene.startFrameUrl,
    prompt: scene.enhancedPrompt || scene.prompt,
    muted: false,
    volume: 1,
    color: CLIP_COLORS[idx % CLIP_COLORS.length],
  }));
}

export function fakeWaveform(seed: string, buckets = 48): number[] {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const out: number[] = [];
  let s = h || 1;
  for (let i = 0; i < buckets; i++) {
    // simple LCG
    s = (s * 1664525 + 1013904223) >>> 0;
    out.push(0.18 + ((s >>> 8) % 1000) / 1000 * 0.82);
  }
  return out;
}
