import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { nanoid } from 'nanoid';
import { applyNodeChanges, applyEdgeChanges, type OnNodesChange, type OnEdgesChange, type Connection, addEdge } from '@xyflow/react';
import type { Scene, SceneStatus } from '@/core/types';
import { useProjectStore } from '@/features/project/store';

interface WorkflowState {
  sceneMap: Record<string, Scene>;
  sceneOrder: string[];

  // Scene CRUD
  addScene: (afterIndex?: number) => void;
  removeScene: (id: string) => void;
  updateScene: (id: string, updates: Partial<Scene>) => void;
  reorderScenes: (newOrder: string[]) => void;
  duplicateScene: (id: string) => void;

  // Scene status
  setSceneStatus: (id: string, status: SceneStatus) => void;

  // AI actions on scenes
  updateScenePrompt: (id: string, newPrompt: string) => void;

  // Helpers
  getScene: (id: string) => Scene | undefined;
  getScenes: () => Scene[];
  getTotalDuration: () => number;
  buildFromStoryboard: (scenes: Scene[]) => void;
}

export const useWorkflowStore = create<WorkflowState>()(
  immer((set, get) => ({
    sceneMap: {},
    sceneOrder: [],

    addScene: (afterIndex) => {
      const id = nanoid();
      const scenes = get().getScenes();
      const order = scenes.length;
      const prevScene = afterIndex !== undefined ? scenes[afterIndex] : null;
      const startTime = prevScene ? prevScene.endTime : 0;

      const scene: Scene = {
        id,
        order,
        title: `Scene ${scenes.length + 1}`,
        prompt: '',
        startTime,
        endTime: startTime + 5,
        duration: 5,
        cameraMovement: 'static',
        mood: '',
        characters: [],
        props: [],
        transition: 'cut',
        textOverlays: [],
        stylePreset: 'cinematic',
        status: 'idle',
        versions: [],
      };

      set((s) => {
        s.sceneMap[id] = scene;
        const insertAt = afterIndex !== undefined ? afterIndex + 1 : s.sceneOrder.length;
        s.sceneOrder.splice(insertAt, 0, id);
        // Re-calculate timing
        s.sceneOrder.forEach((sid, idx) => {
          if (s.sceneMap[sid]) {
            s.sceneMap[sid].order = idx;
            if (idx > 0) {
              const prevSid = s.sceneOrder[idx - 1];
              s.sceneMap[sid].startTime = s.sceneMap[prevSid]?.endTime || 0;
            }
            s.sceneMap[sid].endTime = s.sceneMap[sid].startTime + s.sceneMap[sid].duration;
          }
        });
      });

      // Persist
      const project = useProjectStore.getState().getCurrentProject();
      if (project) {
        const newScenes = get().getScenes();
        useProjectStore.getState().setStoryboard({
          id: project.storyboard?.id || nanoid(),
          scenes: newScenes,
          totalDuration: get().getTotalDuration(),
          narrativeArc: project.storyboard?.narrativeArc || '',
        });
      }
    },

    removeScene: (id) => {
      set((s) => {
        delete s.sceneMap[id];
        s.sceneOrder = s.sceneOrder.filter((sid) => sid !== id);
        s.sceneOrder.forEach((sid, idx) => {
          if (s.sceneMap[sid]) {
            s.sceneMap[sid].order = idx;
            if (idx > 0) {
              const prevSid = s.sceneOrder[idx - 1];
              s.sceneMap[sid].startTime = s.sceneMap[prevSid]?.endTime || 0;
            }
            s.sceneMap[sid].endTime = s.sceneMap[sid].startTime + s.sceneMap[sid].duration;
          }
        });
      });
    },

    updateScene: (id, updates) => {
      set((s) => {
        if (s.sceneMap[id]) {
          Object.assign(s.sceneMap[id], updates);
          if (updates.duration !== undefined) {
            // Recalculate end time and subsequent scenes
            const idx = s.sceneOrder.indexOf(id);
            if (idx >= 0) {
              s.sceneMap[id].endTime = s.sceneMap[id].startTime + updates.duration;
              for (let i = idx + 1; i < s.sceneOrder.length; i++) {
                const prevSid = s.sceneOrder[i - 1];
                s.sceneMap[s.sceneOrder[i]].startTime = s.sceneMap[prevSid]?.endTime || 0;
                s.sceneMap[s.sceneOrder[i]].endTime = s.sceneMap[s.sceneOrder[i]].startTime + s.sceneMap[s.sceneOrder[i]].duration;
              }
            }
          }
        }
      });
    },

    reorderScenes: (newOrder) => {
      set((s) => {
        s.sceneOrder = newOrder;
        s.sceneOrder.forEach((sid, idx) => {
          if (s.sceneMap[sid]) {
            s.sceneMap[sid].order = idx;
            if (idx > 0) {
              const prevSid = s.sceneOrder[idx - 1];
              s.sceneMap[sid].startTime = s.sceneMap[prevSid]?.endTime || 0;
            }
            s.sceneMap[sid].endTime = s.sceneMap[sid].startTime + s.sceneMap[sid].duration;
          }
        });
      });
    },

    duplicateScene: (id) => {
      const scene = get().sceneMap[id];
      if (!scene) return;
      const newId = nanoid();
      const newScene: Scene = {
        ...structuredClone(scene),
        id: newId,
        title: `${scene.title} (Copy)`,
        status: 'idle',
        versions: [],
        generatedStartFrameUrl: undefined,
        generatedEndFrameUrl: undefined,
        generatedVideoUrl: undefined,
        generatedAudioUrl: undefined,
      };
      set((s) => {
        s.sceneMap[newId] = newScene;
        const idx = s.sceneOrder.indexOf(id);
        s.sceneOrder.splice(idx + 1, 0, newId);
        s.sceneOrder.forEach((sid, i) => {
          if (s.sceneMap[sid]) {
            s.sceneMap[sid].order = i;
            if (i > 0) {
              const prevSid = s.sceneOrder[i - 1];
              s.sceneMap[sid].startTime = s.sceneMap[prevSid]?.endTime || 0;
            }
            s.sceneMap[sid].endTime = s.sceneMap[sid].startTime + s.sceneMap[sid].duration;
          }
        });
      });
    },

    setSceneStatus: (id, status) => {
      set((s) => {
        if (s.sceneMap[id]) {
          s.sceneMap[id].status = status;
        }
      });
    },

    updateScenePrompt: (id, newPrompt) => {
      set((s) => {
        if (s.sceneMap[id]) {
          s.sceneMap[id].prompt = newPrompt;
        }
      });
    },

    getScene: (id) => get().sceneMap[id],
    getScenes: () => get().sceneOrder.map((id) => get().sceneMap[id]).filter(Boolean),
    getTotalDuration: () => {
      const scenes = get().getScenes();
      return scenes.length > 0 ? scenes[scenes.length - 1].endTime : 0;
    },

    buildFromStoryboard: (scenes) => {
      set((s) => {
        s.sceneMap = {};
        s.sceneOrder = scenes.map((sc) => {
          s.sceneMap[sc.id] = sc;
          return sc.id;
        });
      });
    },
  }))
);