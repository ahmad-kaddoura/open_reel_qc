import type { GenerationModelRouting, Scene } from '@/core/types';

export type GenerationProgressTiming = {
  elapsedMs: number;
  estimatedRemainingMs: number;
};

export class SceneGenerationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SceneGenerationError';
  }
}

const POLL_INTERVAL_MS = 2_500;
const CLIENT_TIMEOUT_MS = 5 * 60 * 1_000;

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function estimateGenerationMs(scene: Scene): number {
  // Qwen video synthesis typically takes 1–3 minutes per clip.
  return Math.max(90_000, scene.duration * 18_000);
}

function placeholderFrameUrl(title: string, order: number): string {
  const hue = (order * 67) % 360;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="540" height="960" viewBox="0 0 540 960">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:hsl(${hue},55%,35%)"/>
        <stop offset="100%" style="stop-color:hsl(${(hue + 40) % 360},45%,18%)"/>
      </linearGradient>
    </defs>
    <rect width="540" height="960" fill="url(#g)"/>
    <text x="270" y="460" text-anchor="middle" fill="white" font-family="system-ui,sans-serif" font-size="28" font-weight="600">${title.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</text>
    <text x="270" y="510" text-anchor="middle" fill="rgba(255,255,255,0.6)" font-family="system-ui,sans-serif" font-size="16">Scene ${order + 1}</text>
  </svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function reportProgress(
  startedAt: number,
  estimatedTotalMs: number,
  pct: number,
  onProgress: (pct: number, timing?: GenerationProgressTiming) => void,
) {
  const elapsedMs = Date.now() - startedAt;
  onProgress(pct, {
    elapsedMs,
    estimatedRemainingMs: Math.max(0, estimatedTotalMs - elapsedMs),
  });
}

function progressFromElapsed(startedAt: number, estimatedTotalMs: number): number {
  const elapsedMs = Date.now() - startedAt;
  const ratio = Math.min(elapsedMs / estimatedTotalMs, 0.97);
  return Math.round(10 + ratio * 85);
}

async function parseApiError(response: Response): Promise<string> {
  try {
    const data = await response.json();
    return data.error || data.message || `Request failed (${response.status})`;
  } catch {
    return `Request failed (${response.status})`;
  }
}

type PollResponse =
  | { status: 'pending' | 'running'; taskId: string }
  | { status: 'succeeded'; taskId: string; videoUrl: string; model: string }
  | { status: 'failed'; taskId: string; error: string };

export async function generateSceneAssets(
  scene: Scene,
  onProgress: (pct: number, timing?: GenerationProgressTiming) => void,
  options?: {
    prompt?: string;
    generationModels?: GenerationModelRouting;
    existingTaskId?: string;
    existingModel?: string;
    onTaskSubmitted?: (taskId: string, model: string) => void | Promise<void>;
    signal?: AbortSignal;
  },
): Promise<{ startFrameUrl: string; endFrameUrl: string; videoUrl: string; taskId: string; model: string }> {
  const startFrameUrl =
    scene.startFrameUrl ??
    scene.generatedStartFrameUrl ??
    scene.referenceImageUrls?.[0] ??
    placeholderFrameUrl(scene.title, scene.order);
  const endFrameUrl =
    scene.endFrameUrl ??
    scene.generatedEndFrameUrl ??
    placeholderFrameUrl(`${scene.title} End`, scene.order);

  const startedAt = Date.now();
  const estimatedTotalMs = estimateGenerationMs(scene);
  let taskId = options?.existingTaskId;
  let model = options?.existingModel || options?.generationModels?.videoModel || '';

  reportProgress(startedAt, estimatedTotalMs, taskId ? 12 : 5, onProgress);

  if (!taskId) {
    const submitResponse = await fetch('/api/generate-scene', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: options?.prompt || scene.motionPrompt || scene.prompt,
        startFrameUrl,
        endFrameUrl,
        generationModels: options?.generationModels,
      }),
      signal: options?.signal,
    });

    if (!submitResponse.ok) {
      throw new SceneGenerationError(await parseApiError(submitResponse));
    }

    const submitted = await submitResponse.json();
    taskId = submitted.taskId;
    model = submitted.model || model;
    if (!taskId) {
      throw new SceneGenerationError('Video generation did not return a task id.');
    }

    await options?.onTaskSubmitted?.(taskId, model);
    reportProgress(startedAt, estimatedTotalMs, 12, onProgress);
  }

  while (Date.now() - startedAt < CLIENT_TIMEOUT_MS) {
    if (options?.signal?.aborted) {
      throw new SceneGenerationError('Generation cancelled.');
    }

    reportProgress(startedAt, estimatedTotalMs, progressFromElapsed(startedAt, estimatedTotalMs), onProgress);

    const params = new URLSearchParams({ taskId, ...(model ? { model } : {}) });
    const statusResponse = await fetch(`/api/generate-scene?${params.toString()}`, {
      signal: options?.signal,
    });

    if (!statusResponse.ok) {
      throw new SceneGenerationError(await parseApiError(statusResponse));
    }

    const status = await statusResponse.json() as PollResponse;

    if (status.status === 'succeeded') {
      reportProgress(startedAt, estimatedTotalMs, 100, onProgress);
      return {
        startFrameUrl,
        endFrameUrl,
        videoUrl: status.videoUrl,
        taskId: status.taskId,
        model: status.model || model,
      };
    }

    if (status.status === 'failed') {
      throw new SceneGenerationError(status.error || 'Video generation failed.');
    }

    await delay(POLL_INTERVAL_MS);
  }

  throw new SceneGenerationError(
    'Video generation timed out after 5 minutes. Your task is saved — refresh or retry to resume polling.',
  );
}

export function estimateSceneGenerationMs(scene: Scene): number {
  return estimateGenerationMs(scene);
}

export function formatGenerationDuration(ms: number): string {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  if (totalSec < 60) return `${totalSec}s`;
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return sec > 0 ? `${min}m ${sec}s` : `${min}m`;
}
