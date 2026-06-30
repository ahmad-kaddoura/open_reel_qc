import type { Scene, SceneStatus } from '@/core/types';

export const outputNodeId = (sceneId: string) => `output-${sceneId}`;

const ACTIVE_OUTPUT: SceneStatus[] = ['queued', 'generating', 'regenerating', 'completed', 'failed'];

export function shouldShowOutputNode(scene: Scene): boolean {
  return ACTIVE_OUTPUT.includes(scene.status);
}

export const LAYOUT = {
  PARAMS_WIDTH: 180,
  SCRIPT_WIDTH: 220,
  SCENE_WIDTH: 240,
  OUTPUT_WIDTH: 220,
  COL_GAP: 40,
  GROUP_GAP: 80,
} as const;

export type NodePositions = Record<string, { x: number; y: number }>;

export const paramsNodeId = (sceneId: string) => `params-${sceneId}`;
export const scriptNodeId = (sceneId: string) => `script-${sceneId}`;

function layoutStorageKey(projectId: string) {
  return `videoforge-layout-${projectId}`;
}

export function loadLayoutFromStorage(projectId: string): NodePositions | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(layoutStorageKey(projectId));
    return raw ? (JSON.parse(raw) as NodePositions) : null;
  } catch {
    return null;
  }
}

export function saveLayoutToStorage(projectId: string, positions: NodePositions) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(layoutStorageKey(projectId), JSON.stringify(positions));
}

/** Default positions: Params + Script on left, Scene center, Output right. */
export function computeAutoLayout(scenes: Scene[]): NodePositions {
  const positions: NodePositions = {};
  let x = 80;
  const baseY = 100;

  scenes.forEach((scene, idx) => {
    const y = baseY + (idx % 2) * 60;
    const hasOutput = shouldShowOutputNode(scene);

    positions[paramsNodeId(scene.id)] = { x, y };
    positions[scriptNodeId(scene.id)] = { x, y: y + 290 };

    const sceneX = x + LAYOUT.PARAMS_WIDTH + LAYOUT.COL_GAP;
    const sceneY = y + 100;
    positions[scene.id] = { x: sceneX, y: sceneY };

    if (hasOutput) {
      positions[outputNodeId(scene.id)] = {
        x: sceneX + LAYOUT.SCENE_WIDTH + LAYOUT.COL_GAP,
        y: sceneY + 4,
      };
    }

    const groupW =
      LAYOUT.PARAMS_WIDTH +
      LAYOUT.COL_GAP +
      LAYOUT.SCENE_WIDTH +
      LAYOUT.COL_GAP +
      (hasOutput ? LAYOUT.OUTPUT_WIDTH + LAYOUT.COL_GAP : 0);

    x += groupW + LAYOUT.GROUP_GAP;
  });

  return positions;
}

export function resolvePosition(
  nodeId: string,
  saved: NodePositions | null,
  defaults: NodePositions,
): { x: number; y: number } {
  return saved?.[nodeId] ?? defaults[nodeId] ?? { x: 0, y: 0 };
}
