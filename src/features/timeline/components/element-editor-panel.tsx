'use client';

import { Trash2, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useTimelineStore } from '../store/timeline-store';
import type { AudioItem, OverlayElement } from '../lib/types';
import { overlayDuration } from '../lib/types';
import { formatTime } from '../lib/format';

interface ElementEditorPanelProps {
  selection:
    | { type: 'audio'; item: AudioItem }
    | { type: 'overlay'; item: OverlayElement };
}

export function ElementEditorPanel({ selection }: ElementEditorPanelProps) {
  if (selection.type === 'audio') return <AudioEditor item={selection.item} />;
  return <OverlayEditor item={selection.item} />;
}

function AudioEditor({ item }: { item: AudioItem }) {
  const update = useTimelineStore((s) => s.updateAudio);
  const del = useTimelineStore((s) => s.deleteAudio);
  const selectAudio = useTimelineStore((s) => s.selectAudio);

  return (
    <div className="flex flex-col h-full bg-neutral-950/40 border-l border-white/5 overflow-hidden">
      <div className="px-3 py-2.5 border-b border-white/5 shrink-0">
        <div className="text-[10px] text-neutral-500 uppercase tracking-wide">{item.kind} · Track {item.trackIndex + 1}</div>
        <Input
          value={item.name}
          onChange={(e) => update(item.id, { name: e.target.value })}
          className="h-8 mt-1 bg-white/5 border-white/10 text-xs"
        />
      </div>
      <div className="flex-1 overflow-auto p-3 space-y-4 min-h-0">
        <div className="grid grid-cols-3 gap-2 text-center">
          <Stat label="Start" value={formatTime(item.start, true)} />
          <Stat label="Duration" value={formatTime(item.duration, true)} />
          <Stat label="Trim in" value={`${item.trimStart.toFixed(1)}s`} />
        </div>

        <div>
          <div className="flex items-center justify-between text-[10px] text-neutral-500">
            <Label>Volume</Label>
            <span className="font-mono">{Math.round(item.volume * 100)}%</span>
          </div>
          <Slider
            value={[item.volume]}
            min={0}
            max={1}
            step={0.05}
            onValueChange={(v) => update(item.id, { volume: v[0] })}
            className="mt-1"
          />
        </div>

        <div>
          <div className="flex items-center justify-between text-[10px] text-neutral-500">
            <Label>Start time</Label>
            <span className="font-mono">{item.start.toFixed(2)}s</span>
          </div>
          <Slider
            value={[item.start]}
            min={0}
            max={120}
            step={0.1}
            onValueChange={(v) => update(item.id, { start: v[0] })}
          />
        </div>

        <div>
          <div className="flex items-center justify-between text-[10px] text-neutral-500">
            <Label>Duration</Label>
            <span className="font-mono">{item.duration.toFixed(2)}s</span>
          </div>
          <Slider
            value={[item.duration]}
            min={0.3}
            max={Math.max(item.sourceDuration - item.trimStart, 1)}
            step={0.1}
            onValueChange={(v) => update(item.id, { duration: v[0] })}
          />
        </div>

        {item.url && (
          <audio src={item.url} controls className="w-full h-8" />
        )}

        <Button
          variant="outline"
          size="sm"
          className="w-full h-8 border-rose-500/30 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
          onClick={() => del(item.id)}
        >
          <Trash2 className="w-3.5 h-3.5" /> Delete audio
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="w-full h-7 text-neutral-400"
          onClick={() => selectAudio(null)}
        >
          Deselect
        </Button>
      </div>
    </div>
  );
}

function OverlayEditor({ item }: { item: OverlayElement }) {
  const update = useTimelineStore((s) => s.updateOverlay);
  const del = useTimelineStore((s) => s.deleteOverlay);
  const dup = useTimelineStore((s) => s.duplicateOverlay);
  const selectOverlay = useTimelineStore((s) => s.selectOverlay);

  const isText = item.kind === 'text' || item.kind === 'caption' || item.kind === 'cta';
  const dur = overlayDuration(item);

  return (
    <div className="flex flex-col h-full bg-neutral-950/40 border-l border-white/5 overflow-hidden">
      <div className="px-3 py-2.5 border-b border-white/5 shrink-0">
        <div className="text-[10px] text-neutral-500 uppercase tracking-wide">
          {item.kind} · Track {item.trackIndex + 1}
        </div>
        <Input
          value={item.name}
          onChange={(e) => update(item.id, { name: e.target.value })}
          className="h-8 mt-1 bg-white/5 border-white/10 text-xs"
        />
      </div>
      <div className="flex-1 overflow-auto p-3 space-y-4 min-h-0">
        <div className="grid grid-cols-2 gap-2 text-center">
          <Stat label="Start" value={formatTime(item.start, true)} />
          <Stat label="Duration" value={formatTime(dur, true)} />
        </div>

        {isText && (
          <>
            <div>
              <Label className="text-[10px] text-neutral-500">Text content</Label>
              <Textarea
                value={item.text ?? ''}
                onChange={(e) => update(item.id, { text: e.target.value })}
                className="mt-1 bg-white/5 border-white/10 text-xs min-h-[60px]"
              />
            </div>
            <div>
              <div className="flex items-center justify-between text-[10px] text-neutral-500">
                <Label>Font size</Label>
                <span className="font-mono">{item.fontSize}px</span>
              </div>
              <Slider
                value={[item.fontSize ?? 32]}
                min={10}
                max={120}
                step={1}
                onValueChange={(v) => update(item.id, { fontSize: v[0] })}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-[10px] text-neutral-500">Color</Label>
                <Input
                  type="color"
                  value={item.color ?? '#ffffff'}
                  onChange={(e) => update(item.id, { color: e.target.value })}
                  className="h-8 mt-1 bg-white/5 border-white/10 p-1"
                />
              </div>
              <div>
                <Label className="text-[10px] text-neutral-500">Bg</Label>
                <Input
                  type="color"
                  value={item.backgroundColor && item.backgroundColor !== 'transparent'
                    ? rgbaToHex(item.backgroundColor)
                    : '#000000'}
                  onChange={(e) => update(item.id, { backgroundColor: e.target.value + '88' })}
                  className="h-8 mt-1 bg-white/5 border-white/10 p-1"
                />
              </div>
            </div>
            <div>
              <Label className="text-[10px] text-neutral-500">Animation</Label>
              <Select
                value={item.animation ?? 'fade'}
                onValueChange={(v) => update(item.id, { animation: v as OverlayElement['animation'] })}
              >
                <SelectTrigger className="h-8 mt-1 bg-white/5 border-white/10 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="fade">Fade</SelectItem>
                  <SelectItem value="slide">Slide up</SelectItem>
                  <SelectItem value="pop">Pop</SelectItem>
                  <SelectItem value="typewriter">Typewriter</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {item.kind === 'sticker' && (
          <div>
            <Label className="text-[10px] text-neutral-500">Sticker</Label>
            <Input
              value={item.text ?? ''}
              onChange={(e) => update(item.id, { text: e.target.value })}
              className="h-8 mt-1 bg-white/5 border-white/10 text-xs"
            />
          </div>
        )}

        {item.kind === 'shape' && (
          <div>
            <Label className="text-[10px] text-neutral-500">Shape</Label>
            <Select
              value={item.shape ?? 'rect'}
              onValueChange={(v) => update(item.id, { shape: v as OverlayElement['shape'] })}
            >
              <SelectTrigger className="h-8 mt-1 bg-white/5 border-white/10 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rect">Rectangle</SelectItem>
                <SelectItem value="circle">Circle</SelectItem>
                <SelectItem value="pill">Pill</SelectItem>
                <SelectItem value="underline">Underline</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="color"
              value={item.color ?? '#ffffff'}
              onChange={(e) => update(item.id, { color: e.target.value })}
              className="h-8 mt-2 bg-white/5 border-white/10 p-1"
            />
          </div>
        )}

        {/* Position */}
        <div className="space-y-2">
          <Label className="text-[10px] text-neutral-500">Position (% of frame)</Label>
          <div>
            <div className="flex items-center justify-between text-[10px] text-neutral-500">
              <span>X</span>
              <span className="font-mono">{Math.round(item.position?.x ?? 50)}%</span>
            </div>
            <Slider
              value={[item.position?.x ?? 50]}
              min={0}
              max={100}
              step={1}
              onValueChange={(v) => update(item.id, { position: { x: v[0], y: item.position?.y ?? 50 } })}
            />
          </div>
          <div>
            <div className="flex items-center justify-between text-[10px] text-neutral-500">
              <span>Y</span>
              <span className="font-mono">{Math.round(item.position?.y ?? 50)}%</span>
            </div>
            <Slider
              value={[item.position?.y ?? 50]}
              min={0}
              max={100}
              step={1}
              onValueChange={(v) => update(item.id, { position: { x: item.position?.x ?? 50, y: v[0] } })}
            />
          </div>
        </div>

        {/* Timing */}
        <div className="space-y-2">
          <Label className="text-[10px] text-neutral-500">Timing</Label>
          <div>
            <div className="flex items-center justify-between text-[10px] text-neutral-500">
              <span>Start</span>
              <span className="font-mono">{item.start.toFixed(2)}s</span>
            </div>
            <Slider
              value={[item.start]}
              min={0}
              max={120}
              step={0.1}
              onValueChange={(v) => update(item.id, { start: v[0], end: Math.max(v[0] + 0.3, item.end) })}
            />
          </div>
          <div>
            <div className="flex items-center justify-between text-[10px] text-neutral-500">
              <span>End</span>
              <span className="font-mono">{item.end.toFixed(2)}s</span>
            </div>
            <Slider
              value={[item.end]}
              min={item.start + 0.3}
              max={180}
              step={0.1}
              onValueChange={(v) => update(item.id, { end: v[0] })}
            />
          </div>
        </div>

        {/* Visibility toggle for captions */}
        {item.kind === 'caption' && (
          <div className="flex items-center justify-between rounded-md border border-white/5 p-2.5 bg-white/[0.02]">
            <Label className="text-[10px] text-neutral-500">Show in export</Label>
            <Switch
              checked={item.enabled ?? true}
              onCheckedChange={(v) => update(item.id, { enabled: v })}
              className="scale-90"
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-1.5">
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 border-white/10 bg-white/[0.02] text-neutral-300 hover:bg-white/10 hover:text-white"
            onClick={() => dup(item.id)}
          >
            <Copy className="w-3.5 h-3.5" /> Duplicate
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 border-rose-500/30 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
            onClick={() => del(item.id)}
          >
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </Button>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="w-full h-7 text-neutral-400"
          onClick={() => selectOverlay(null)}
        >
          Deselect
        </Button>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/5 bg-white/[0.02] py-1.5">
      <div className="text-[9px] text-neutral-500 uppercase tracking-wide">{label}</div>
      <div className="text-[11px] font-mono text-neutral-200 mt-0.5">{value}</div>
    </div>
  );
}

function rgbaToHex(rgba: string): string {
  const m = rgba.match(/rgba?\(([^)]+)\)/);
  if (!m) return '#000000';
  const parts = m[1].split(',').map((p) => p.trim());
  const toHex = (n: string) => Number(n).toString(16).padStart(2, '0');
  return `#${toHex(parts[0])}${toHex(parts[1])}${toHex(parts[2])}`;
}
