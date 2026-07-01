'use client';

import { useMemo, useState } from 'react';
import {
  Download, Sparkles, Settings2, CheckCircle2,
  AlertTriangle, Loader2, X, RotateCcw,
} from 'lucide-react';import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '@/components/ui/accordion';
import { useTimelineStore } from '../store/timeline-store';
import { useProjectStore } from '@/features/project/store';
import { useSettingsStore } from '@/features/settings/store';
import { useWorkflowStore } from '@/features/workflow';
import { totalProjectDuration } from '../lib/types';
import { formatTime, formatDuration } from '../lib/format';
import type { AspectRatio, OutputFormat } from '@/core/types';

export function ExportSummary() {
  const clips = useTimelineStore((s) => s.clips);
  const audio = useTimelineStore((s) => s.audio);
  const overlays = useTimelineStore((s) => s.overlays);
  const captionsEnabled = useTimelineStore((s) => s.captionsEnabled);
  const render = useTimelineStore((s) => s.render);
  const startRender = useTimelineStore((s) => s.startRender);
  const cancelRender = useTimelineStore((s) => s.cancelRender);
  const resetRender = useTimelineStore((s) => s.resetRender);
  const settings = useSettingsStore((s) => s.settings);
  const project = useProjectStore((s) => s.getCurrentProject());
  const sceneOrder = useWorkflowStore((s) => s.sceneOrder);
  const sceneMap = useWorkflowStore((s) => s.sceneMap);
  const scenesReady = useMemo(
    () => sceneOrder.filter((id) => sceneMap[id]?.status === 'completed').length,
    [sceneOrder, sceneMap],
  );
  const scenesTotal = sceneOrder.length;

  // Project-level preset selection (set earlier in the flow).
  const projectPreset = useMemo(() => {
    if (!project) return settings.exportPresets[0];
    const match = settings.exportPresets.find(
      (p) => p.aspectRatio === project.settings.aspectRatio &&
        p.platform === project.settings.targetPlatform,
    );
    return match ?? settings.exportPresets[0];
  }, [project, settings.exportPresets]);

  const [advancedPreset, setAdvancedPreset] = useState(projectPreset.id);
  const [advancedFormat, setAdvancedFormat] = useState<OutputFormat>(
    project?.settings.outputFormat ?? projectPreset.format,
  );
  const [advancedFps, setAdvancedFps] = useState(
    project?.settings.fps ?? projectPreset.fps,
  );

  const preset = useMemo(
    () => settings.exportPresets.find((p) => p.id === advancedPreset) ?? projectPreset,
    [settings.exportPresets, advancedPreset, projectPreset],
  );

  const total = totalProjectDuration(clips);
  const completedClips = clips.filter((c) => c.videoUrl).length;
  const missingClips = clips.length - completedClips;
  const canExport = clips.length > 0 && missingClips === 0 && render.status !== 'rendering';

  const aspectRatio = preset.aspectRatio;
  const ratioValue = aspectRatioToValue(aspectRatio);

  const captionOverlays = overlays.filter((o) => o.kind === 'caption');
  const captionsIncluded = captionsEnabled && captionOverlays.length > 0;

  const handleExport = () => {
    if (render.status === 'done') resetRender();
    startRender();
  };

  return (
    <div className="rounded-xl border border-white/5 bg-neutral-950/40 overflow-hidden">
      <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2">
        <Sparkles className="w-3.5 h-3.5 text-neutral-300" />
        <h3 className="text-xs font-semibold text-neutral-100">Export</h3>
        <span className="ml-auto text-[10px] text-neutral-500">
          {clips.length} clip{clips.length === 1 ? '' : 's'} · {formatDuration(total)}
        </span>
      </div>

      <div className="p-4 space-y-3">
        {/* Summary */}
        <div className="grid grid-cols-2 gap-2">
          <Field label="Preset" value={preset.name} />
          <Field label="Aspect ratio" value={preset.aspectRatio} />
          <Field label="Resolution" value={preset.resolution} />
          <Field label="FPS" value={`${advancedFps}fps`} />
          <Field label="Format" value={advancedFormat.toUpperCase()} />
          <Field label="Final duration" value={formatTime(total, true)} />
        </div>

        <div className="flex flex-wrap gap-1.5">
          <Tag>{audio.length} audio track{audio.length === 1 ? '' : 's'}</Tag>
          <Tag>{overlays.length} element{overlays.length === 1 ? '' : 's'}</Tag>
          <Tag>{captionsIncluded ? 'Captions on' : 'Captions off'}</Tag>
          <Tag>{preset.quality} quality</Tag>
        </div>

        {/* Readiness */}
        {missingClips > 0 && (
          <div className="flex items-start gap-2 text-[11px] text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-md p-2.5">
            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <div>
              {missingClips} clip{missingClips === 1 ? '' : 's'} missing generated video.
              Regenerate from the right panel or finish scene generation in Workflow.
            </div>
          </div>
        )}
        {render.status === 'done' && (
          <div className="flex items-start gap-2 text-[11px] text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded-md p-2.5">
            <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <div className="flex-1">
              Final video assembled. Ready to download.
              {render.url && (
                <div className="mt-1 font-mono text-[10px] text-emerald-400/80 break-all">{render.url}</div>
              )}
            </div>
          </div>
        )}
        {render.status === 'failed' && (
          <div className="flex items-start gap-2 text-[11px] text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-md p-2.5">
            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <div>{render.error}</div>
          </div>
        )}

        {/* Render progress */}
        {render.status === 'rendering' && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px] text-neutral-400">
              <span className="flex items-center gap-1.5">
                <Loader2 className="w-3 h-3 animate-spin" />
                Assembling final video…
              </span>
              <span className="font-mono">{Math.round(render.progress)}%</span>
            </div>
            <Progress value={render.progress} className="h-1.5" />
            <button
              onClick={cancelRender}
              className="text-[10px] text-neutral-500 hover:text-rose-300 inline-flex items-center gap-1"
            >
              <X className="w-3 h-3" /> Cancel
            </button>
          </div>
        )}

        {/* CTA */}
        <div className="flex gap-2">
          {render.status === 'done' ? (
            <Button
              className="flex-1 h-9 gap-2 bg-emerald-500 text-black hover:bg-emerald-400"
              onClick={() => {
                if (render.url) window.open(render.url, '_blank');
              }}
            >
              <Download className="w-4 h-4" /> Download
            </Button>
          ) : (
            <Button
              className="flex-1 h-9 gap-2"
              onClick={handleExport}
              disabled={!canExport}
            >
              {render.status === 'rendering' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              Export final video
            </Button>
          )}
          {render.status === 'done' && (
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 border-white/10"
              onClick={resetRender}
              title="Export again"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>

        {/* Advanced */}
        <Accordion
          type="single"
          collapsible
          className="border-t border-white/5 pt-2"
        >
          <AccordionItem value="advanced" className="border-0">
            <AccordionTrigger
              className="text-[11px] text-neutral-300 hover:no-underline py-2"
            >
              <span className="flex items-center gap-1.5">
                <Settings2 className="w-3.5 h-3.5" />
                Advanced export settings
              </span>
            </AccordionTrigger>
            <AccordionContent className="space-y-3 pt-1">
              <div>
                <label className="text-[10px] text-neutral-500">Preset override</label>
                <Select value={advancedPreset} onValueChange={setAdvancedPreset}>
                  <SelectTrigger className="mt-1 h-8 bg-white/5 border-white/10 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {settings.exportPresets.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-neutral-500">Format</label>
                  <Select
                    value={advancedFormat}
                    onValueChange={(v) => setAdvancedFormat(v as OutputFormat)}
                  >
                    <SelectTrigger className="mt-1 h-8 bg-white/5 border-white/10 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mp4">MP4</SelectItem>
                      <SelectItem value="webm">WebM</SelectItem>
                      <SelectItem value="mov">MOV</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-[10px] text-neutral-500">FPS</label>
                  <Select
                    value={String(advancedFps)}
                    onValueChange={(v) => setAdvancedFps(Number(v))}
                  >
                    <SelectTrigger className="mt-1 h-8 bg-white/5 border-white/10 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[24, 25, 30, 48, 60].map((f) => (
                        <SelectItem key={f} value={String(f)}>{f}fps</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Scenes ready indicator */}
        <div className="flex items-center justify-between text-[10px] text-neutral-500 pt-1">
          <span>Source scenes: {scenesReady}/{scenesTotal} ready</span>
          <span>Aspect {ratioValue.toFixed(3)} ({aspectRatio})</span>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/5 bg-white/[0.02] px-2.5 py-1.5">
      <div className="text-[9px] text-neutral-500 uppercase tracking-wide">{label}</div>
      <div className="text-[11px] font-medium text-neutral-200 mt-0.5 truncate">{value}</div>
    </div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-neutral-400 border border-white/5">
      {children}
    </span>
  );
}

function aspectRatioToValue(ratio: AspectRatio): number {
  switch (ratio) {
    case '9:16': return 9 / 16;
    case '1:1': return 1;
    case '16:9': return 16 / 9;
    case '4:5': return 4 / 5;
    case 'custom': return 9 / 16;
  }
}
