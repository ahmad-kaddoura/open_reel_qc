'use client';

import { useRef, useState } from 'react';
import {
  Music2, Mic, Wand2, Upload, Type as TypeIcon, Captions, Sticker,
  Image as ImageIcon, Square, Sparkles, Plus, ChevronRight,
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useTimelineStore } from '../store/timeline-store';
import type { AudioKind, OverlayKind, OverlayElement } from '../lib/types';
import { fakeWaveform } from '../lib/types';
import { cn } from '@/lib/utils';

const AUDIO_PRESETS: { kind: AudioKind; label: string; desc: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { kind: 'music', label: 'Background music', desc: 'Loopable beds, lo-fi, upbeat, etc.', icon: Music2 },
  { kind: 'voiceover', label: 'Voiceover', desc: 'Add a narration line.', icon: Mic },
  { kind: 'sfx', label: 'Sound effect', desc: 'Whoosh, impact, pop, ding.', icon: Wand2 },
  { kind: 'uploaded', label: 'Upload audio', desc: 'Use your own file.', icon: Upload },
];

const ELEMENT_PRESETS: { kind: OverlayKind; label: string; desc: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { kind: 'text', label: 'Text', desc: 'Headlines, titles, subtitles.', icon: TypeIcon },
  { kind: 'caption', label: 'Caption', desc: 'Auto-style caption block.', icon: Captions },
  { kind: 'cta', label: 'CTA label', desc: '“Shop now”, “Subscribe”, etc.', icon: Sparkles },
  { kind: 'sticker', label: 'Sticker', desc: 'Emoji & decorative stickers.', icon: Sticker },
  { kind: 'image', label: 'Image / Logo', desc: 'PNG/JPG overlay.', icon: ImageIcon },
  { kind: 'shape', label: 'Shape', desc: 'Rectangles, circles, dividers.', icon: Square },
  { kind: 'effect', label: 'Effect / Overlay', desc: 'Light leaks, vignettes, glows.', icon: Sparkles },
];

const STICKER_PALETTE = ['⭐', '🔥', '✨', '❤️', '👍', '🎉', '💯', '👉', '⚡', '🏷️', '🛒', '💥'];

export function AssetPanel() {
  const playhead = useTimelineStore((s) => s.playhead);

  return (
    <div className="flex flex-col h-full bg-neutral-950/40 border-r border-white/5">
      <div className="px-3 py-2.5 border-b border-white/5 shrink-0">
        <h3 className="text-xs font-semibold text-neutral-200">Add to timeline</h3>
        <p className="text-[10px] text-neutral-500 mt-0.5">
          Drop new media at the playhead ({playhead.toFixed(1)}s)
        </p>
      </div>
      <Tabs defaultValue="audio" className="flex-1 flex flex-col min-h-0">
        <TabsList className="grid grid-cols-2 mx-2 mt-2 bg-white/5">
          <TabsTrigger value="audio" className="text-[11px] data-[state=active]:bg-white/10 gap-1.5">
            <Music2 className="w-3 h-3" /> Audio
          </TabsTrigger>
          <TabsTrigger value="elements" className="text-[11px] data-[state=active]:bg-white/10 gap-1.5">
            <TypeIcon className="w-3 h-3" /> Elements
          </TabsTrigger>
        </TabsList>
        <TabsContent value="audio" className="flex-1 overflow-auto p-3 pt-2 mt-0 min-h-0">
          <AudioTab />
        </TabsContent>
        <TabsContent value="elements" className="flex-1 overflow-auto p-3 pt-2 mt-0 min-h-0">
          <ElementsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AudioTab() {
  const addAudio = useTimelineStore((s) => s.addAudio);
  const selectAudio = useTimelineStore((s) => s.selectAudio);
  const fileRef = useRef<HTMLInputElement>(null);
  const [musicName, setMusicName] = useState('Upbeat bed');
  const [musicDuration, setMusicDuration] = useState(12);

  const add = (kind: AudioKind, opts?: Parameters<typeof addAudio>[1]) => {
    const id = addAudio(kind, opts);
    selectAudio(id);
  };

  const onUpload = (file: File) => {
    const url = URL.createObjectURL(file);
    add('uploaded', {
      name: file.name.replace(/\.[^.]+$/, ''),
      url,
      sourceDuration: 20,
      duration: Math.min(20, 8),
      waveform: fakeWaveform(file.name),
    });
  };

  return (
    <div className="space-y-2.5">
      {AUDIO_PRESETS.slice(0, 3).map((p) => (
        <AssetCard
          key={p.kind}
          icon={<p.icon className="w-4 h-4" />}
          label={p.label}
          desc={p.desc}
          onClick={() => add(p.kind, { name: p.label, duration: 8, sourceDuration: 16 })}
        />
      ))}

      <div className="rounded-lg border border-white/5 bg-white/[0.02] p-2.5 space-y-2">
        <div className="flex items-center gap-2 text-[11px] text-neutral-300">
          <Music2 className="w-3.5 h-3.5" /> Quick music
        </div>
        <div>
          <Label className="text-[10px] text-neutral-500">Name</Label>
          <Input
            value={musicName}
            onChange={(e) => setMusicName(e.target.value)}
            className="h-7 mt-0.5 bg-white/5 border-white/10 text-xs"
          />
        </div>
        <div>
          <div className="flex items-center justify-between text-[10px] text-neutral-500">
            <Label>Duration</Label>
            <span className="font-mono">{musicDuration}s</span>
          </div>
          <Slider
            value={[musicDuration]}
            min={2}
            max={60}
            step={1}
            onValueChange={(v) => setMusicDuration(v[0])}
            className="mt-1"
          />
        </div>
        <Button
          size="sm"
          className="w-full h-7 bg-white text-black hover:bg-white/90"
          onClick={() => add('music', { name: musicName || 'Background music', duration: musicDuration, sourceDuration: musicDuration })}
        >
          <Plus className="w-3 h-3" /> Add music
        </Button>
      </div>

      <AssetCard
        icon={<Upload className="w-4 h-4" />}
        label="Upload audio file"
        desc="MP3, WAV, M4A — uses an object URL."
        onClick={() => fileRef.current?.click()}
      />
      <input
        ref={fileRef}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onUpload(f);
          e.target.value = '';
        }}
      />
    </div>
  );
}

function ElementsTab() {
  const addOverlay = useTimelineStore((s) => s.addOverlay);
  const selectOverlay = useTimelineStore((s) => s.selectOverlay);
  const regenerateCaptions = useTimelineStore((s) => s.regenerateCaptions);
  const fileRef = useRef<HTMLInputElement>(null);

  const add = (kind: OverlayKind, opts?: Parameters<typeof addOverlay>[1]) => {
    const id = addOverlay(kind, opts);
    selectOverlay(id);
  };

  return (
    <div className="space-y-2.5">
      {ELEMENT_PRESETS.map((p) => (
        <AssetCard
          key={p.kind}
          icon={<p.icon className="w-4 h-4" />}
          label={p.label}
          desc={p.desc}
          onClick={() => add(p.kind, defaultOverlayOpts(p.kind))}
        />
      ))}

      <div className="rounded-lg border border-white/5 bg-white/[0.02] p-2.5 space-y-2">
        <div className="flex items-center gap-2 text-[11px] text-neutral-300">
          <Sticker className="w-3.5 h-3.5" /> Stickers
        </div>
        <div className="grid grid-cols-6 gap-1">
          {STICKER_PALETTE.map((s) => (
            <button
              key={s}
              onClick={() => add('sticker', { text: s, name: `Sticker ${s}` })}
              className="aspect-square text-lg rounded-md hover:bg-white/10 flex items-center justify-center"
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <AssetCard
        icon={<ImageIcon className="w-4 h-4" />}
        label="Upload image / logo"
        desc="PNG with transparency works best."
        onClick={() => fileRef.current?.click()}
      />
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          const url = URL.createObjectURL(f);
          add('image', { url, name: f.name.replace(/\.[^.]+$/, '') });
          e.target.value = '';
        }}
      />

      <AssetCard
        icon={<Captions className="w-4 h-4" />}
        label="Regenerate captions"
        desc="Re-run caption text on existing caption clips."
        onClick={regenerateCaptions}
      />
    </div>
  );
}

function defaultOverlayOpts(kind: OverlayKind): Partial<OverlayElement> {
  switch (kind) {
    case 'text': return { text: 'Your text here', name: 'Text overlay' };
    case 'caption': return { text: 'Caption', name: 'Caption' };
    case 'cta': return { text: 'Shop now →', name: 'CTA', fontSize: 28 };
    case 'sticker': return { text: '⭐', name: 'Sticker' };
    case 'shape': return { name: 'Shape', shape: 'rect' };
    case 'image': return { name: 'Image overlay' };
    case 'effect': return { name: 'Effect', text: 'Effect' };
  }
}

function AssetCard({
  icon, label, desc, onClick,
}: {
  icon: React.ReactNode;
  label: string;
  desc: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full group flex items-center gap-2.5 rounded-lg border border-white/5 bg-white/[0.02]',
        'px-2.5 py-2 text-left transition-colors hover:border-white/15 hover:bg-white/[0.05]',
      )}
    >
      <div className="w-7 h-7 rounded-md bg-white/5 flex items-center justify-center text-neutral-300 group-hover:text-white">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[11px] font-medium text-neutral-200 truncate">{label}</div>
        <div className="text-[10px] text-neutral-500 truncate">{desc}</div>
      </div>
      <ChevronRight className="w-3.5 h-3.5 text-neutral-600 group-hover:text-neutral-300" />
    </button>
  );
}
