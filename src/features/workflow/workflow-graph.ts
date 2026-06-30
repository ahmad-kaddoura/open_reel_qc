import type { Scene } from '@/core/types';
import type { Edge, Node } from '@xyflow/react';
import { MarkerType } from '@xyflow/react';
import {
  LAYOUT,
  paramsNodeId,
  scriptNodeId,
  outputNodeId,
  shouldShowOutputNode,
  resolvePosition,
  computeAutoLayout,
  type NodePositions,
} from './workflow-layout';

export { shouldShowOutputNode, LAYOUT, paramsNodeId, scriptNodeId, outputNodeId };

export function buildWorkflowGraph(
  scenes: Scene[],
  savedPositions: NodePositions | null = null,
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const defaults = computeAutoLayout(scenes);
  const pos = (id: string) => resolvePosition(id, savedPositions, defaults);

  scenes.forEach((scene, idx) => {
    const hasOutput = shouldShowOutputNode(scene);

    // Parameters node
    nodes.push({
      id: paramsNodeId(scene.id),
      type: 'params',
      position: pos(paramsNodeId(scene.id)),
      data: { sceneId: scene.id },
    });

    // Script node
    nodes.push({
      id: scriptNodeId(scene.id),
      type: 'script',
      position: pos(scriptNodeId(scene.id)),
      data: { sceneId: scene.id },
    });

    // Scene node
    nodes.push({
      id: scene.id,
      type: 'scene',
      position: pos(scene.id),
      data: scene as unknown as Record<string, unknown>,
    });

    edges.push({
      id: `e-params-${scene.id}`,
      source: paramsNodeId(scene.id),
      sourceHandle: 'params-out',
      target: scene.id,
      targetHandle: 'params-in',
      type: 'smoothstep',
      style: { stroke: 'hsl(45 93% 47%)', strokeWidth: 1.5, opacity: 0.7 },
      markerEnd: { type: MarkerType.ArrowClosed, color: 'hsl(45 93% 47%)' },
    });

    edges.push({
      id: `e-script-${scene.id}`,
      source: scriptNodeId(scene.id),
      sourceHandle: 'script-out',
      target: scene.id,
      targetHandle: 'script-in',
      type: 'smoothstep',
      style: { stroke: 'hsl(270 60% 60%)', strokeWidth: 1.5, opacity: 0.7 },
      markerEnd: { type: MarkerType.ArrowClosed, color: 'hsl(270 60% 60%)' },
    });

    if (hasOutput) {
      nodes.push({
        id: outputNodeId(scene.id),
        type: 'output',
        position: pos(outputNodeId(scene.id)),
        data: { sceneId: scene.id },
      });

      edges.push({
        id: `e-gen-${scene.id}`,
        source: scene.id,
        sourceHandle: 'generate',
        target: outputNodeId(scene.id),
        targetHandle: 'result-in',
        type: 'smoothstep',
        animated: scene.status === 'generating' || scene.status === 'regenerating' || scene.status === 'queued',
        style: {
          stroke: scene.status === 'completed'
            ? 'hsl(142 71% 45%)'
            : scene.status === 'failed'
              ? 'hsl(0 72% 51%)'
              : 'hsl(217 91% 60%)',
          strokeWidth: 2,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: scene.status === 'completed' ? 'hsl(142 71% 45%)' : 'hsl(217 91% 60%)',
        },
      });
    }

    const nextScene = scenes[idx + 1];
    if (nextScene) {
      edges.push({
        id: `e-flow-${scene.id}-${nextScene.id}`,
        source: scene.id,
        sourceHandle: 'flow',
        target: nextScene.id,
        targetHandle: 'flow-in',
        type: 'smoothstep',
        animated: true,
        style: { stroke: 'hsl(var(--primary))', strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: 'hsl(var(--primary))' },
        label: scene.transition ? scene.transition.replace(/_/g, ' ') : undefined,
        labelStyle: { fontSize: 10, fill: 'hsl(var(--muted-foreground))' },
        labelBgStyle: { fill: 'hsl(var(--card))', fillOpacity: 0.9 },
        labelBgPadding: [4, 6] as [number, number],
        labelBgBorderRadius: 4,
      });
    }
  });

  return { nodes, edges };
}
