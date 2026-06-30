'use client';

import { useProjectStore } from '@/features/project/store';
import { useWorkflowStore } from '@/features/workflow/store';
import { StatusBadge } from '@/shared/ui/status-badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose,
} from '@/components/ui/dialog';
import { Plus, Trash2, Copy, GripVertical, ArrowRight, ChevronDown, ChevronUp, Camera, Timer, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { CAMERA_MOVEMENTS, TRANSITIONS, STYLE_PRESETS } from '@/core/config';
import type { Scene, CameraMovement, Transition, StylePreset } from '@/core/types';
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export function StoryboardView() {
  const { getCurrentProject, setPhase } = useProjectStore();
  const { getScenes, addScene, removeScene, updateScene, reorderScenes, duplicateScene, setSceneStatus } = useWorkflowStore();
  const [expandedScene, setExpandedScene] = useState<string | null>(null);

  const scenes = getScenes();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = scenes.findIndex(s => s.id === active.id);
      const newIndex = scenes.findIndex(s => s.id === over.id);
      const newOrder = scenes.map(s => s.id);
      const [moved] = newOrder.splice(oldIndex, 1);
      newOrder.splice(newIndex, 0, moved);
      reorderScenes(newOrder);
    }
  };

  const handleGenerateWorkflow = () => {
    setPhase('workflow');
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border">
        <div>
          <h2 className="text-lg font-semibold">Storyboard</h2>
          <p className="text-xs text-muted-foreground">{scenes.length} scenes · {scenes.reduce((a, s) => a + s.duration, 0)}s total</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => addScene()} className="gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Add Scene
          </Button>
          <Button size="sm" onClick={handleGenerateWorkflow} className="gap-1.5" disabled={scenes.length === 0}>
            Open Workflow Editor <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Scene List */}
      <ScrollArea className="flex-1">
        <div className="max-w-3xl mx-auto p-6 space-y-3">
          {scenes.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-3">
                <Sparkles className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">No scenes yet. Add scenes manually or generate from the chat.</p>
            </div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={scenes.map(s => s.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-3">
                  {scenes.map((scene) => (
                    <SortableSceneCard
                      key={scene.id}
                      scene={scene}
                      expanded={expandedScene === scene.id}
                      onToggleExpand={() => setExpandedScene(expandedScene === scene.id ? null : scene.id)}
                      onUpdate={(updates) => updateScene(scene.id, updates)}
                      onRemove={() => removeScene(scene.id)}
                      onDuplicate={() => duplicateScene(scene.id)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

function SortableSceneCard({ scene, expanded, onToggleExpand, onUpdate, onRemove, onDuplicate }: {
  scene: Scene;
  expanded: boolean;
  onToggleExpand: () => void;
  onUpdate: (updates: Partial<Scene>) => void;
  onRemove: () => void;
  onDuplicate: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: scene.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const cameraLabel = CAMERA_MOVEMENTS.find(c => c.id === scene.cameraMovement)?.name || scene.cameraMovement;
  const transitionLabel = TRANSITIONS.find(t => t.id === scene.transition)?.name || scene.transition;

  return (
    <Card ref={setNodeRef} style={style} className="border-border/50 hover:border-border transition-colors">
      <CardContent className="p-0">
        {/* Header Row */}
        <div className="flex items-center gap-2 px-4 py-3">
          <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground p-0.5">
            <GripVertical className="w-4 h-4" />
          </button>
          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
            {scene.order + 1}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{scene.title}</div>
            <p className="text-[11px] text-muted-foreground truncate mt-0.5">{scene.prompt || 'No prompt set'}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="outline" className="text-[10px] h-5 gap-1">
              <Camera className="w-2.5 h-2.5" /> {cameraLabel}
            </Badge>
            <Badge variant="outline" className="text-[10px] h-5 gap-1">
              <Timer className="w-2.5 h-2.5" /> {scene.duration}s
            </Badge>
            <StatusBadge status={scene.status} />
          </div>
          <button onClick={onToggleExpand} className="p-1 hover:bg-muted rounded">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {/* Expanded Details */}
        {expanded && (
          <div className="border-t border-border px-4 py-4 space-y-4 bg-muted/10">
            <div>
              <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Scene Title</label>
              <Input className="mt-1 h-8 text-sm" value={scene.title} onChange={e => onUpdate({ title: e.target.value })} />
            </div>
            <div>
              <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Prompt</label>
              <Textarea className="mt-1 text-sm" value={scene.prompt} onChange={e => onUpdate({ prompt: e.target.value })} rows={3} placeholder="Describe the scene..." />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Duration (s)</label>
                <Input type="number" className="mt-1 h-8 text-sm" value={scene.duration} onChange={e => onUpdate({ duration: Number(e.target.value) })} min={1} max={120} />
              </div>
              <div>
                <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Camera</label>
                <Select value={scene.cameraMovement} onValueChange={v => onUpdate({ cameraMovement: v as CameraMovement })}>
                  <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CAMERA_MOVEMENTS.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Transition</label>
                <Select value={scene.transition} onValueChange={v => onUpdate({ transition: v as Transition })}>
                  <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TRANSITIONS.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Style</label>
                <Select value={scene.stylePreset} onValueChange={v => onUpdate({ stylePreset: v as StylePreset })}>
                  <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STYLE_PRESETS.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Mood</label>
                <Input className="mt-1 h-8 text-sm" value={scene.mood || ''} onChange={e => onUpdate({ mood: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Narration</label>
              <Textarea className="mt-1 text-sm" value={scene.narration || ''} onChange={e => onUpdate({ narration: e.target.value })} rows={2} />
            </div>
            <div className="flex gap-2 pt-1">
              <Button variant="outline" size="sm" onClick={onDuplicate} className="gap-1.5 text-xs">
                <Copy className="w-3 h-3" /> Duplicate
              </Button>
              <Button variant="outline" size="sm" onClick={onRemove} className="gap-1.5 text-xs text-red-400 hover:text-red-300">
                <Trash2 className="w-3 h-3" /> Delete
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}