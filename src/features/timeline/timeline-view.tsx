'use client';

import { useEffect, useMemo } from 'react';
import { MessageSquare, Workflow, Film } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { useWorkflowStore } from '@/features/workflow';
import { useProjectStore } from '@/features/project/store';
import { useSettingsStore } from '@/features/settings/store';
import { useTimelineStore } from './store/timeline-store';
import { TimelineEditor } from './components/timeline-editor';
import { PreviewPlayer } from './components/preview-player';
import { AssetPanel } from './components/asset-panel';
import { ClipEditorPanel } from './components/clip-editor-panel';
import { ElementEditorPanel } from './components/element-editor-panel';
import { ExportSummary } from './components/export-summary';
import { totalProjectDuration, clipStartTimes } from './lib/types';
import { aspectRatioToValue } from './lib/aspect';

export function TimelineView() {
  // Select raw state and derive scenes via memo so the snapshot is stable across renders.
  const sceneOrder = useWorkflowStore((s) => s.sceneOrder);
  const sceneMap = useWorkflowStore((s) => s.sceneMap);
  const scenes = useMemo(
    () => sceneOrder.map((id) => sceneMap[id]).filter(Boolean),
    [sceneOrder, sceneMap],
  );
  const hydrateFromScenes = useTimelineStore((s) => s.hydrateFromScenes);
  const setPhase = useProjectStore((s) => s.setPhase);
  const project = useProjectStore((s) => s.getCurrentProject());
  const settings = useSettingsStore((s) => s.settings);
  const clips = useTimelineStore((s) => s.clips);
  const audio = useTimelineStore((s) => s.audio);
  const overlays = useTimelineStore((s) => s.overlays);
  const selection = useTimelineStore((s) => s.selection);
  const clearSelection = useTimelineStore((s) => s.clearSelection);

  // Sync clips from workflow scenes whenever scenes change.
  useEffect(() => {
    hydrateFromScenes(scenes);
  }, [scenes, hydrateFromScenes]);

  const aspectRatio = project?.settings.aspectRatio ?? settings.defaultAspectRatio;
  const ratioValue = aspectRatioToValue(aspectRatio);

  const starts = useMemo(() => clipStartTimes(clips), [clips]);
  const selectedClip = selection?.type === 'clip'
    ? clips.find((c) => c.id === selection.id) ?? null
    : null;
  const selectedClipIndex = selectedClip ? clips.findIndex((c) => c.id === selectedClip.id) : -1;

  const selectedAudio = selection?.type === 'audio'
    ? audio.find((a) => a.id === selection.id) ?? null
    : null;
  const selectedOverlay = selection?.type === 'overlay'
    ? overlays.find((o) => o.id === selection.id) ?? null
    : null;

  const total = totalProjectDuration(clips);

  return (
    <div className="h-full flex flex-col bg-neutral-900 text-neutral-100">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5 bg-neutral-950/60 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-7 h-7 rounded-md bg-white/5 flex items-center justify-center">
            <Film className="w-4 h-4 text-neutral-300" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold truncate">Timeline</h2>
            <p className="text-[11px] text-neutral-500">
              {clips.length} clip{clips.length === 1 ? '' : 's'} · {total.toFixed(1)}s total · {audio.length} audio · {overlays.length} element{overlays.length === 1 ? '' : 's'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="text-neutral-300 hover:bg-white/10 hover:text-white gap-1.5" onClick={() => setPhase('chat')}>
            <MessageSquare className="w-3.5 h-3.5" /> Plan
          </Button>
          <Button variant="ghost" size="sm" className="text-neutral-300 hover:bg-white/10 hover:text-white gap-1.5" onClick={() => setPhase('workflow')}>
            <Workflow className="w-3.5 h-3.5" /> Workflow
          </Button>
        </div>
      </div>

      {/* Workspace */}
      <div className="flex-1 min-h-0">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* Left: Asset panel */}
          <ResizablePanel defaultSize={18} minSize={14} maxSize={26}>
            <AssetPanel />
          </ResizablePanel>
          <ResizableHandle withHandle className="w-1 bg-white/5 hover:bg-white/15 transition-colors" />

          {/* Center: Preview + Export stacked */}
          <ResizablePanel defaultSize={56} minSize={36}>
            <ResizablePanelGroup direction="vertical" className="h-full">
              <ResizablePanel defaultSize={62} minSize={30}>
                <PreviewPlayer aspectRatio={ratioValue} />
              </ResizablePanel>
              <ResizableHandle withHandle className="h-1 bg-white/5 hover:bg-white/15 transition-colors" />
              <ResizablePanel defaultSize={38} minSize={20}>
                <div className="h-full overflow-auto p-3 bg-neutral-950/30">
                  <ExportSummary />
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
          <ResizableHandle withHandle className="w-1 bg-white/5 hover:bg-white/15 transition-colors" />

          {/* Right: Editor panel */}
          <ResizablePanel defaultSize={26} minSize={20} maxSize={36}>
            {selectedClip ? (
              <ClipEditorPanel
                clip={selectedClip}
                clipIndex={selectedClipIndex}
                totalClips={clips.length}
              />
            ) : selectedAudio ? (
              <ElementEditorPanel selection={{ type: 'audio', item: selectedAudio }} />
            ) : selectedOverlay ? (
              <ElementEditorPanel selection={{ type: 'overlay', item: selectedOverlay }} />
            ) : (
              <EmptyRightPanel />
            )}
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Bottom timeline */}
      <div className="h-[280px] shrink-0 border-t border-white/5" onClick={() => { if (selection) clearSelection(); }}>
        <TimelineEditor />
      </div>
    </div>
  );
}

function EmptyRightPanel() {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center bg-neutral-950/40 border-l border-white/5 p-6">
      <div className="w-10 h-10 rounded-md bg-white/5 flex items-center justify-center mb-3">
        <Film className="w-5 h-5 text-neutral-500" />
      </div>
      <div className="text-xs font-medium text-neutral-300">Nothing selected</div>
      <p className="text-[11px] text-neutral-500 mt-1 max-w-[200px]">
        Click a clip on the timeline to edit trim, audio, prompt, and regeneration.
        Click an audio or overlay block to tweak its settings.
      </p>
    </div>
  );
}
