'use client';

import { memo, useState, useCallback } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { StatusBadge } from '@/shared/ui/status-badge';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Play, RotateCcw, Copy, Trash2, Sparkles, Film, Camera, Eye, Palette, Zap, Wand2, ImageIcon, Volume2, Subtitles } from 'lucide-react';
import { AI_ACTIONS } from './workflow-view';
import { CAMERA_MOVEMENTS } from '@/core/config';
import type { Scene } from '@/core/types';

const ICON_MAP: Record<string, any> = {
  Sparkles, Film, Camera, Eye, Palette, Zap, Wand2,
};

function SceneNodeComponent({ data, id }: NodeProps) {
  const scene = data as Scene;
  const [isEditing, setIsEditing] = useState(false);
  const [editPrompt, setEditPrompt] = useState(scene.prompt);

  const cameraLabel = CAMERA_MOVEMENTS.find(c => c.id === scene.cameraMovement)?.name || scene.cameraMovement?.replace(/_/g, ' ');
  const styleLabel = scene.stylePreset?.replace(/_/g, ' ');

  const handleUpdate = useCallback((updates: Partial<Scene>) => {
    const updater = (window as any).__sceneNodeUpdate;
    if (updater) updater(id, updates);
  }, [id]);

  const handlePromptSave = () => {
    handleUpdate({ prompt: editPrompt });
    setIsEditing(false);
  };

  const handleAIAction = (action: string) => {
    // In production, this would call the AI API
    const enhanced = `${editPrompt || scene.prompt}, ${action === 'cinematic' ? 'dramatic cinematic lighting, shallow depth of field, film grain' : action === 'realistic' ? 'photorealistic, natural lighting, 4K quality' : action === 'viral' ? 'high energy, dynamic, attention-grabbing' : action === 'camera' ? 'smooth professional camera work' : 'enhanced visual quality, more detailed'}`;
    handleUpdate({ prompt: enhanced });
    setEditPrompt(enhanced);
  };

  const handleGenerate = () => {
    handleUpdate({ status: 'generating' });
    // Mock generation - in production this calls the real API
    setTimeout(() => {
      handleUpdate({ status: 'completed' });
    }, 2000 + Math.random() * 3000);
  };

  const statusColors: Record<string, string> = {
    idle: 'border-border',
    queued: 'border-yellow-500/50',
    generating: 'border-blue-500/50 shadow-blue-500/10',
    completed: 'border-emerald-500/50',
    failed: 'border-red-500/50',
  };

  return (
    <div className="relative">
      {/* Source Handle */}
      <Handle type="target" position={Position.Left} className="!w-3 !h-3 !bg-primary !border-2 !border-background" />

      <Card className={`w-[280px] shadow-xl border-2 ${statusColors[scene.status] || 'border-border'} bg-card overflow-hidden`}>
        {/* Preview Area */}
        <div className="h-[120px] bg-muted/30 relative overflow-hidden">
          {scene.generatedVideoUrl || scene.generatedStartFrameUrl ? (
            <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
              <div className="text-center">
                <Play className="w-8 h-8 mx-auto text-primary mb-1" />
                <span className="text-[10px] text-muted-foreground">Preview</span>
              </div>
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center p-3">
                <ImageIcon className="w-6 h-6 mx-auto text-muted-foreground/30 mb-1.5" />
                <span className="text-[10px] text-muted-foreground/60">
                  {scene.status === 'generating' ? 'Generating...' : scene.status === 'completed' ? 'Generated ✓' : 'No preview yet'}
                </span>
              </div>
            </div>
          )}

          {/* Status Badge */}
          <div className="absolute top-2 right-2">
            <StatusBadge status={scene.status} />
          </div>

          {/* Scene Number */}
          <div className="absolute top-2 left-2 bg-black/60 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
            #{scene.order + 1}
          </div>

          {/* Progress bar for generating */}
          {scene.status === 'generating' && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted">
              <div className="h-full bg-blue-500 animate-pulse" style={{ width: '60%' }} />
            </div>
          )}
        </div>

        {/* Content */}
        <CardContent className="p-3 space-y-2.5">
          {/* Title & Menu */}
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-xs font-semibold leading-tight line-clamp-1">{scene.title}</h3>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-0.5 rounded hover:bg-muted shrink-0">
                  <MoreHorizontal className="w-3.5 h-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={handleGenerate} className="gap-2">
                  <Play className="w-3.5 h-3.5" /> Generate
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {AI_ACTIONS.map(action => {
                  const Icon = ICON_MAP[action.icon] || Sparkles;
                  return (
                    <DropdownMenuItem key={action.label} onClick={() => handleAIAction(action.prompt)} className="gap-2">
                      <Icon className="w-3.5 h-3.5" /> {action.label}
                    </DropdownMenuItem>
                  );
                })}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleUpdate({ status: 'idle' })} className="gap-2">
                  <RotateCcw className="w-3.5 h-3.5" /> Reset Status
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2 text-red-400 focus:text-red-400">
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Prompt */}
          {isEditing ? (
            <div>
              <Textarea
                value={editPrompt}
                onChange={e => setEditPrompt(e.target.value)}
                onBlur={handlePromptSave}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handlePromptSave()}
                className="text-[11px] min-h-[60px] resize-none"
                autoFocus
              />
            </div>
          ) : (
            <p
              onClick={() => { setIsEditing(true); setEditPrompt(scene.prompt); }}
              className="text-[11px] text-muted-foreground leading-relaxed line-clamp-3 cursor-pointer hover:text-foreground transition-colors"
            >
              {scene.prompt || 'Click to add prompt...'}
            </p>
          )}

          {/* Meta badges */}
          <div className="flex items-center flex-wrap gap-1.5">
            <Badge variant="outline" className="text-[10px] h-5 gap-1">
              <Camera className="w-2.5 h-2.5" /> {cameraLabel}
            </Badge>
            <Badge variant="secondary" className="text-[10px] h-5">
              {scene.duration}s
            </Badge>
            <Badge variant="outline" className="text-[10px] h-5">
              {styleLabel}
            </Badge>
          </div>

          {/* Audio indicators */}
          {(scene.narration || scene.captions) && (
            <div className="flex gap-2">
              {scene.narration && <Volume2 className="w-3 h-3 text-muted-foreground" title="Has narration" />}
              {scene.captions && <Subtitles className="w-3 h-3 text-muted-foreground" title="Has captions" />}
            </div>
          )}

          {/* Generate Button */}
          {scene.status === 'idle' || scene.status === 'failed' ? (
            <Button size="sm" className="w-full h-7 text-xs gap-1.5" onClick={handleGenerate}>
              <Sparkles className="w-3 h-3" /> Generate Scene
            </Button>
          ) : scene.status === 'completed' ? (
            <Button variant="outline" size="sm" className="w-full h-7 text-xs gap-1.5" onClick={() => handleUpdate({ status: 'idle' })}>
              <RotateCcw className="w-3 h-3" /> Regenerate
            </Button>
          ) : scene.status === 'generating' ? (
            <Button variant="outline" size="sm" className="w-full h-7 text-xs" disabled>
              Generating...
            </Button>
          ) : null}
        </CardContent>
      </Card>

      {/* Target Handle */}
      <Handle type="source" position={Position.Right} className="!w-3 !h-3 !bg-primary !border-2 !border-background" />
    </div>
  );
}

export const SceneNode = memo(SceneNodeComponent);