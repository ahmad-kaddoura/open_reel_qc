'use client';

import { useState } from 'react';
import { useProjectStore } from '@/features/project/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Clapperboard, Save, ArrowRight, ChevronRight } from 'lucide-react';
import { STYLE_PRESETS, CAMERA_MOVEMENTS, TRANSITIONS, TARGET_PLATFORMS, ASPECT_RATIOS, VIDEO_TYPES } from '@/core/config';
import type { VideoBrief, StylePreset, TargetPlatform, AspectRatio, CameraMovement, Transition, VideoType, OutputFormat } from '@/core/types';

export function BriefView() {
  const { getCurrentProject, updateCurrentProject, setPhase } = useProjectStore();
  const project = getCurrentProject();
  const brief = project?.videoBrief;

  const [form, setForm] = useState<Partial<VideoBrief>>(brief || {
    title: project?.name || '',
    description: '',
    videoType: 'ad',
    targetPlatform: 'tiktok',
    aspectRatio: '9:16',
    duration: 30,
    style: 'cinematic',
    mood: '',
    numberOfScenes: 4,
    sceneDuration: 7,
    fps: 30,
    resolution: '1080x1920',
    outputFormat: 'mp4',
    captions: true,
  });

  const update = (key: string, value: any) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    updateCurrentProject({ videoBrief: form as VideoBrief });
  };

  const handleSaveAndNext = () => {
    updateCurrentProject({ videoBrief: form as VideoBrief });
    setPhase('storyboard');
  };

  if (!project) return null;

  return (
    <ScrollableContent>
      <div className="max-w-3xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold">Video Brief</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Define the parameters for your video</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleSave} className="gap-1.5">
              <Save className="w-3.5 h-3.5" /> Save
            </Button>
            <Button size="sm" onClick={handleSaveAndNext} className="gap-1.5">
              Generate Storyboard <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        <Accordion type="multiple" defaultValue={['basic', 'platform', 'visual', 'content', 'audio', 'advanced']} className="space-y-3">
          {/* Basic Info */}
          <AccordionItem value="basic">
            <AccordionTrigger className="text-sm font-semibold px-0">Basic Information</AccordionTrigger>
            <AccordionContent className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label className="text-xs">Video Title</Label>
                  <Input className="mt-1" value={form.title || ''} onChange={e => update('title', e.target.value)} placeholder="My Amazing Video" />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs">Description</Label>
                  <Textarea className="mt-1" value={form.description || ''} onChange={e => update('description', e.target.value)} placeholder="Describe your video concept..." rows={3} />
                </div>
                <div>
                  <Label className="text-xs">Video Type</Label>
                  <Select value={form.videoType || 'ad'} onValueChange={v => update('videoType', v)}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {VIDEO_TYPES.map(v => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Mood</Label>
                  <Input className="mt-1" value={form.mood || ''} onChange={e => update('mood', e.target.value)} placeholder="Energetic, professional..." />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Platform & Format */}
          <AccordionItem value="platform">
            <AccordionTrigger className="text-sm font-semibold px-0">Platform & Format</AccordionTrigger>
            <AccordionContent className="space-y-4 pt-2">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs">Platform</Label>
                  <Select value={form.targetPlatform || 'tiktok'} onValueChange={v => {
                    update('targetPlatform', v);
                    const plat = TARGET_PLATFORMS.find(p => p.id === v);
                    if (plat) {
                      update('aspectRatio', plat.defaultRatio);
                      if (plat.maxDuration < (form.duration || 999)) update('duration', plat.maxDuration);
                    }
                  }}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TARGET_PLATFORMS.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Aspect Ratio</Label>
                  <Select value={form.aspectRatio || '9:16'} onValueChange={v => update('aspectRatio', v)}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ASPECT_RATIOS.map(a => <SelectItem key={a.id} value={a.id}>{a.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Duration (sec)</Label>
                  <Input type="number" className="mt-1" value={form.duration || 30} onChange={e => update('duration', Number(e.target.value))} min={1} max={600} />
                </div>
                <div>
                  <Label className="text-xs">FPS</Label>
                  <Select value={String(form.fps || 30)} onValueChange={v => update('fps', Number(v))}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="24">24 (Cinematic)</SelectItem>
                      <SelectItem value="30">30 (Standard)</SelectItem>
                      <SelectItem value="60">60 (Smooth)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Resolution</Label>
                  <Select value={form.resolution || '1080x1920'} onValueChange={v => update('resolution', v)}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="720x1280">720p</SelectItem>
                      <SelectItem value="1080x1920">1080p</SelectItem>
                      <SelectItem value="1920x1080">Full HD</SelectItem>
                      <SelectItem value="3840x2160">4K</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Format</Label>
                  <Select value={form.outputFormat || 'mp4'} onValueChange={v => update('outputFormat', v)}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mp4">MP4</SelectItem>
                      <SelectItem value="webm">WebM</SelectItem>
                      <SelectItem value="mov">MOV</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Visual Style */}
          <AccordionItem value="visual">
            <AccordionTrigger className="text-sm font-semibold px-0">Visual Style</AccordionTrigger>
            <AccordionContent className="space-y-4 pt-2">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {STYLE_PRESETS.map(style => (
                  <button
                    key={style.id}
                    onClick={() => update('style', style.id)}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      form.style === style.id
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/30'
                    }`}
                  >
                    <div className="text-xs font-medium mb-0.5">{style.name}</div>
                    <div className="text-[10px] text-muted-foreground line-clamp-2">{style.description}</div>
                  </button>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Content Structure */}
          <AccordionItem value="content">
            <AccordionTrigger className="text-sm font-semibold px-0">Content Structure</AccordionTrigger>
            <AccordionContent className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs">Number of Scenes</Label>
                  <Input type="number" className="mt-1" value={form.numberOfScenes || 4} onChange={e => update('numberOfScenes', Number(e.target.value))} min={1} max={20} />
                </div>
                <div>
                  <Label className="text-xs">Scene Duration (sec)</Label>
                  <Input type="number" className="mt-1" value={form.sceneDuration || 7} onChange={e => update('sceneDuration', Number(e.target.value))} min={1} max={60} />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs">CTA (Call to Action)</Label>
                  <Input className="mt-1" value={form.cta || ''} onChange={e => update('cta', e.target.value)} placeholder="Shop Now →" />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs">Negative Prompt</Label>
                  <Textarea className="mt-1" value={form.negativePrompt || ''} onChange={e => update('negativePrompt', e.target.value)} placeholder="What to avoid..." rows={2} />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Audio */}
          <AccordionItem value="audio">
            <AccordionTrigger className="text-sm font-semibold px-0">Audio & Captions</AccordionTrigger>
            <AccordionContent className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label className="text-xs">Voiceover / Narration</Label>
                  <Textarea className="mt-1" value={form.voiceover || ''} onChange={e => update('voiceover', e.target.value)} placeholder="Voiceover script..." rows={3} />
                </div>
                <div>
                  <Label className="text-xs">Music Mood</Label>
                  <Input className="mt-1" value={form.musicMood || ''} onChange={e => update('musicMood', e.target.value)} placeholder="Upbeat, ambient..." />
                </div>
                <div>
                  <Label className="text-xs">Sound Effects Notes</Label>
                  <Input className="mt-1" value={form.soundEffectsNotes || ''} onChange={e => update('soundEffectsNotes', e.target.value)} placeholder="Whoosh, ding..." />
                </div>
                <div className="flex items-center justify-between col-span-2">
                  <Label className="text-xs">Enable Captions</Label>
                  <Switch checked={form.captions || false} onCheckedChange={v => update('captions', v)} />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Advanced */}
          <AccordionItem value="advanced">
            <AccordionTrigger className="text-sm font-semibold px-0">Advanced</AccordionTrigger>
            <AccordionContent className="space-y-4 pt-2">
              <div>
                <Label className="text-xs">Target Audience</Label>
                <Input className="mt-1" value={form.audience || ''} onChange={e => update('audience', e.target.value)} placeholder="Gen Z, professionals..." />
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </ScrollableContent>
  );
}

function ScrollableContent({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-full overflow-y-auto">
      {children}
    </div>
  );
}