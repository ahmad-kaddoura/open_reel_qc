import type { Project, Scene, SceneStatus } from '@/core/types';

const ACTIVE_GENERATION: SceneStatus[] = ['generating', 'queued', 'regenerating'];

export function sceneIsActivelyGenerating(scene: Scene): boolean {
  return ACTIVE_GENERATION.includes(scene.status);
}

export function projectHasActiveGeneration(scenes: Scene[]): boolean {
  return scenes.some(sceneIsActivelyGenerating);
}

export function isProjectGenerating(
  project: Project,
  options?: {
    isCurrentProject: boolean;
    isGeneratingAll: boolean;
    liveScenes: Scene[];
  },
): boolean {
  if (options?.isCurrentProject) {
    if (options.isGeneratingAll) return true;
    if (projectHasActiveGeneration(options.liveScenes)) return true;
  }
  return projectHasActiveGeneration(project.storyboard?.scenes ?? []);
}
