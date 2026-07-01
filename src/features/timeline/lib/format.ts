export function formatTime(seconds: number, withMs = false): string {
  if (!Number.isFinite(seconds) || seconds < 0) seconds = 0;
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  const base = `${m}:${s.toString().padStart(2, '0')}`;
  if (!withMs) return base;
  const ms = Math.floor((seconds - Math.floor(seconds)) * 100);
  return `${base}.${ms.toString().padStart(2, '0')}`;
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}m ${s}s`;
}

export function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}
