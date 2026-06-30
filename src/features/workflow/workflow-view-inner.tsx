'use client';

import { useCallback, useMemo, useEffect, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  type Connection,
  type Node,
  type Edge,
  type NodeTypes,
  BackgroundVariant,
  Panel,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useWorkflowStore } from '@/features/workflow/store';
import { useProjectStore } from '@/features/project/store';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Plus, Play, LayoutGrid, Sparkles, Film, Camera, Eye, Zap, Wand2 } from 'lucide-react';
import type { Scene } from '@/core/types';
import { SceneNode } from './scene-node';

const AI_ACTIONS = [
  { label: 'Improve Prompt', icon: Sparkles, prompt: 'improve' },
  { label: 'Make Cinematic', icon: Film, prompt: 'cinematic' },
  { label: 'Make Realistic', icon: Eye, prompt: 'realistic' },
  { label: 'Make More Viral', icon: Zap, prompt: 'viral' },
  { label: 'Improve Camera', icon: Camera, prompt: 'camera' },
  { label: 'Simplify', icon: Wand2, prompt: 'simplify' },
];

const nodeTypes: NodeTypes = {
  scene: SceneNode,
};

export function WorkflowViewInner() {
  const { getScenes, addScene, updateScene, setSceneStatus, getTotalDuration } = useWorkflowStore();
  const { setPhase } = useProjectStore();
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  const scenes = getScenes();

  const initialNodes: Node[] = useMemo(() => {
    const spacing = 320;
    return scenes.map((scene, idx) => ({
      id: scene.id,
      type: 'scene' as const,
      position: { x: 100 + idx * spacing, y: 200 + (idx % 2 === 0 ? 0 : 80) },
      data: scene,
    }));
  }, [scenes]);

  const initialEdges: Edge[] = useMemo(() => {
    return scenes.slice(0, -1).map((scene, idx) => ({
      id: `e-${scene.id}-${scenes[idx + 1]?.id}`,
      source: scene.id,
      target: scenes[idx + 1]?.id || '',
      type: 'smoothstep',
      animated: true,
      style: { stroke: 'hsl(var(--primary))', strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed, color: 'hsl(var(--primary))' },
      label: scene.transition ? `${scene.transition.replace(/_/g, ' ')}` : undefined,
      labelStyle: { fontSize: 10, fill: 'hsl(var(--muted-foreground))' },
      labelBgStyle: { fill: 'hsl(var(--card))', fillOpacity: 0.9 },
      labelBgPadding: [4, 6] as [number, number],
      labelBgBorderRadius: 4,
    }));
  }, [scenes]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const handleNodeDataChange = useCallback((nodeId: string, newData: Partial<Scene>) => {
    updateScene(nodeId, newData);
  }, [updateScene]);

  useEffect(() => {
    (window as any).__sceneNodeUpdate = handleNodeDataChange;
    return () => { delete (window as any).__sceneNodeUpdate; };
  }, [handleNodeDataChange]);

  return (
    <TooltipProvider delayDuration={200}>
      <div className="h-full w-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          onNodeClick={(_, node) => setSelectedNode(node.id)}
          onPaneClick={() => setSelectedNode(null)}
          fitView
          fitViewOptions={{ padding: 0.3 }}
          minZoom={0.2}
          maxZoom={2}
          className="bg-background"
          proOptions={{ hideAttribution: true }}
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="hsl(var(--border))" />
          <Controls className="!bg-card !border-border !shadow-lg [&>button]:!bg-card [&>button]:!border-border [&>button]:!text-foreground [&>button:hover]:!bg-muted" />
          <MiniMap
            nodeStrokeColor="hsl(var(--primary))"
            nodeColor="hsl(var(--primary))"
            nodeBorderRadius={8}
            className="!bg-card !border-border"
          />

          <Panel position="top-left" className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => addScene()} className="gap-1.5 shadow-lg bg-card border-border">
              <Plus className="w-3.5 h-3.5" /> Add Scene
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPhase('timeline')} className="gap-1.5 shadow-lg bg-card border-border">
              <LayoutGrid className="w-3.5 h-3.5" /> Timeline
            </Button>
          </Panel>

          <Panel position="top-right">
            <div className="bg-card border border-border rounded-lg p-3 shadow-lg text-xs space-y-1.5 min-w-[160px]">
              <div className="font-semibold">Workflow Info</div>
              <div className="flex justify-between text-muted-foreground">
                <span>Scenes</span><span className="text-foreground">{scenes.length}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Total Duration</span><span className="text-foreground">{getTotalDuration()}s</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Completed</span><span className="text-foreground">{scenes.filter(s => s.status === 'completed').length}</span>
              </div>
            </div>
          </Panel>

          <Panel position="bottom-center">
            <Button size="lg" className="gap-2 shadow-xl" onClick={() => {
              scenes.forEach(s => { if (s.status === 'idle') setSceneStatus(s.id, 'queued'); });
            }}>
              <Play className="w-4 h-4" />
              Generate All Scenes
            </Button>
          </Panel>
        </ReactFlow>
      </div>
    </TooltipProvider>
  );
}

export { AI_ACTIONS };