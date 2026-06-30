'use client';

import { memo, useCallback } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/shared/ui/status-badge';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Play, RotateCcw, Trash2, Sparkles, ImageIcon, Loader2 } from 'lucide-react';
import { AI_ACTIONS } from './workflow-view';
import { useWorkflowStore } from './store';
import type { Scene } from '@/core/types';

function SceneNodeComponent({ data, id }: NodeProps) {
  const storedScene = useWorkflowStore((s) => s.sceneMap[id]);
  const fallback = data as unknown as Scene;
  const scene = storedScene ?? fallback;
  const generateScene = useWorkflowStore((s) => s.generateScene);

  const isGenerating = scene.status === 'generating' || scene.status === 'regenerating';
  const refPreview = scene.referenceImageUrls?.[0];

  const statusColors: Record<string, string> = {
    idle: 'border-border',
    queued: 'border-yellow-500/50',
    generating: 'border-blue-500/50 shadow-blue-500/10',
    completed: 'border-emerald-500/50',
    failed: 'border-red-500/50',
  };

  const handleUpdate = useCallback((updates: Partial<Scene>) => {
    const updater = (window as any).__sceneNodeUpdate;
    if (updater) updater(id, updates);
  }, [id]);

  const handleAIAction = (action: string) => {
    const enhanced = `${scene.prompt}, ${action === 'cinematic' ? 'dramatic cinematic lighting, shallow depth of field, film grain' : action === 'realistic' ? 'photorealistic, natural lighting, 4K quality' : action === 'viral' ? 'high energy, dynamic, attention-grabbing' : action === 'camera' ? 'smooth professional camera work' : 'enhanced visual quality, more detailed'}`;
    handleUpdate({ prompt: enhanced });
  };

  return (
    <div className="relative">
      <Handle type="target" position={Position.Left} id="flow-in" className="!w-3 !h-3 !bg-primary !border-2 !border-background" style={{ top: '18%' }} />
      <Handle type="target" position={Position.Left} id="params-in" className="!w-3 !h-3 !bg-amber-500 !border-2 !border-background" style={{ top: '45%' }} />
      <Handle type="target" position={Position.Left} id="script-in" className="!w-3 !h-3 !bg-violet-500 !border-2 !border-background" style={{ top: '72%' }} />

      <div className={`w-[240px] rounded-xl border-2 ${statusColors[scene.status] || 'border-border'} bg-card shadow-xl overflow-hidden`}>
        <div className="h-[90px] bg-muted/30 relative overflow-hidden">
          {refPreview ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={refPreview} alt="Reference" className="w-full h-full object-cover opacity-80" />
              <div className="absolute bottom-1 left-1.5 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded">Ref</div>
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="w-5 h-5 text-muted-foreground/30" />
            </div>
          )}
          <div className="absolute top-1.5 right-1.5"><StatusBadge status={scene.status} /></div>
          <div className="absolute top-1.5 left-1.5 bg-black/60 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">#{scene.order + 1}</div>
          {isGenerating && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-1.5">
              <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
              <span className="text-[10px] text-blue-400">Generating…</span>
            </div>
          )}
        </div>

        <div className="p-3 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-xs font-semibold leading-tight line-clamp-2">{scene.title}</h3>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-0.5 rounded hover:bg-muted shrink-0"><MoreHorizontal className="w-3.5 h-3.5" /></button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onClick={() => generateScene(id)} className="gap-2">
                  <Play className="w-3.5 h-3.5" /> Generate
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {AI_ACTIONS.map((action) => (
                  <DropdownMenuItem key={action.label} onClick={() => handleAIAction(action.prompt)} className="gap-2">
                    <action.icon className="w-3.5 h-3.5" /> {action.label}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleUpdate({ status: 'idle' })} className="gap-2">
                  <RotateCcw className="w-3.5 h-3.5" /> Reset
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2 text-red-400 focus:text-red-400">
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {scene.status === 'idle' || scene.status === 'failed' ? (
            <Button size="sm" className="w-full h-7 text-xs gap-1.5" onClick={() => generateScene(id)}>
              <Sparkles className="w-3 h-3" /> Generate Scene
            </Button>
          ) : scene.status === 'completed' ? (
            <Button variant="outline" size="sm" className="w-full h-7 text-xs gap-1.5" onClick={() => generateScene(id)}>
              <RotateCcw className="w-3 h-3" /> Regenerate
            </Button>
          ) : isGenerating || scene.status === 'queued' ? (
            <Button variant="outline" size="sm" className="w-full h-7 text-xs" disabled>Generating…</Button>
          ) : null}
        </div>
      </div>

      <Handle type="source" position={Position.Right} id="flow" className="!w-3 !h-3 !bg-primary !border-2 !border-background" style={{ top: '18%' }} />
      <Handle type="source" position={Position.Right} id="generate" className="!w-3 !h-3 !bg-blue-500 !border-2 !border-background" style={{ top: '82%' }} />
    </div>
  );
}

export const SceneNode = memo(SceneNodeComponent);
