'use client';

import { useWorkflowStore } from '@/features/workflow';
import { useProjectStore } from '@/features/project/store';
import { StatusBadge } from '@/shared/ui/status-badge';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Play, Download, Plus, ArrowLeft, Clock, Film, Volume2, Subtitles, Type } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const TRACK_TYPES = [
  { id: 'video', label: 'Video', color: 'bg-blue-500/20 border-blue-500/40 text-blue-400', icon: Film },
  { id: 'audio', label: 'Audio / Voiceover', color: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400', icon: Volume2 },
  { id: 'caption', label: 'Captions', color: 'bg-amber-500/20 border-amber-500/40 text-amber-400', icon: Subtitles },
  { id: 'overlay', label: 'Text Overlays', color: 'bg-purple-500/20 border-purple-500/40 text-purple-400', icon: Type },
] as const;

export function TimelineView() {
  const { getScenes, getTotalDuration, addScene, setSceneStatus } = useWorkflowStore();
  const { setPhase } = useProjectStore();
  const scenes = getScenes();
  const totalDuration = getTotalDuration();
  const maxDuration = Math.max(totalDuration, 30);

  // Generate time markers
  const timeMarkers = [];
  for (let t = 0; t <= maxDuration; t += 5) {
    timeMarkers.push(t);
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setPhase('workflow')} className="gap-1.5">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Workflow
          </Button>
          <div>
            <h2 className="text-lg font-semibold">Timeline</h2>
            <p className="text-xs text-muted-foreground">{scenes.length} scenes · {totalDuration}s total</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5">
            <Play className="w-3.5 h-3.5" /> Preview
          </Button>
          <Button size="sm" className="gap-1.5" onClick={() => setPhase('export')}>
            <Download className="w-3.5 h-3.5" /> Export
          </Button>
        </div>
      </div>

      {/* Timeline Content */}
      <ScrollArea className="flex-1">
        <div className="min-w-[800px] p-6">
          {/* Time Ruler */}
          <div className="relative mb-1 ml-[140px]">
            <div className="h-6 relative border-b border-border">
              {timeMarkers.map(t => (
                <div
                  key={t}
                  className="absolute text-[10px] text-muted-foreground -translate-x-1/2"
                  style={{ left: `${(t / maxDuration) * 100}%` }}
                >
                  <div className="w-px h-3 bg-border mx-auto" />
                  <span className="mt-0.5 block">{t}s</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tracks */}
          <div className="space-y-2">
            {TRACK_TYPES.map(track => {
              const trackScenes = track.id === 'video' ? scenes : scenes.filter(s => {
                if (track.id === 'audio') return s.narration || s.generatedAudioUrl;
                if (track.id === 'caption') return s.captions;
                if (track.id === 'overlay') return s.textOverlays?.length > 0;
                return false;
              });

              return (
                <div key={track.id} className="flex items-center gap-3">
                  {/* Track Label */}
                  <div className="w-[128px] shrink-0 flex items-center gap-2 px-3 py-2">
                    <track.icon className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-xs font-medium">{track.label}</span>
                  </div>

                  {/* Track Content */}
                  <div className="flex-1 h-[44px] bg-muted/20 rounded-lg border border-border/50 relative overflow-hidden">
                    {track.id === 'video' ? (
                      <>
                        {scenes.map(scene => (
                          <div
                            key={scene.id}
                            className="absolute top-1 bottom-1 rounded-md border border-border/80 cursor-pointer hover:z-10 hover:shadow-lg transition-shadow group"
                            style={{
                              left: `${(scene.startTime / maxDuration) * 100}%`,
                              width: `${(scene.duration / maxDuration) * 100}%`,
                              minWidth: '40px',
                            }}
                          >
                            <div className={`h-full rounded-md px-2 flex items-center justify-between gap-1 ${track.color} border`}>
                              <span className="text-[10px] font-medium truncate">{scene.title}</span>
                              <div className="flex items-center gap-1 shrink-0">
                                <StatusBadge status={scene.status} size="sm" />
                              </div>
                            </div>
                            {/* Transition indicator */}
                            {scene.transition !== 'cut' && scene.order < scenes.length - 1 && (
                              <div className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-primary/50 border border-primary flex items-center justify-center z-20">
                                <span className="text-[6px]">→</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </>
                    ) : (
                      trackScenes.map(scene => (
                        <div
                          key={scene.id}
                          className="absolute top-1 bottom-1 rounded-md cursor-pointer hover:z-10 transition-shadow"
                          style={{
                            left: `${(scene.startTime / maxDuration) * 100}%`,
                            width: `${(scene.duration / maxDuration) * 100}%`,
                            minWidth: '40px',
                          }}
                        >
                          <div className={`h-full rounded-md px-2 flex items-center ${track.color} border`}>
                            <span className="text-[10px] truncate">
                              {track.id === 'audio' ? '🎤 ' : track.id === 'caption' ? '💬 ' : '📝 '}
                              {scene.title}
                            </span>
                          </div>
                        </div>
                      ))
                    )}

                    {/* Playhead */}
                    <div className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-30 pointer-events-none" style={{ left: '0%' }}>
                      <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-red-500 rounded-full" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Scene Details Below Timeline */}
          <div className="mt-6">
            <h3 className="text-sm font-semibold mb-3">Scene Breakdown</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {scenes.map(scene => (
                <div key={scene.id} className="bg-card border border-border rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold">#{scene.order + 1} {scene.title}</span>
                    <StatusBadge status={scene.status} />
                  </div>
                  <p className="text-[11px] text-muted-foreground line-clamp-2">{scene.prompt}</p>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>{scene.startTime}s → {scene.endTime}s</span>
                    <Badge variant="outline" className="text-[9px] h-4">{scene.transition?.replace(/_/g,' ')}</Badge>
                  </div>
                  {scene.narration && (
                    <p className="text-[10px] text-muted-foreground italic line-clamp-1">🎤 {scene.narration}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}