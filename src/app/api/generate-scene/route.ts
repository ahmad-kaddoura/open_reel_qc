import { NextRequest, NextResponse } from 'next/server';
import { callQwenVideoGeneration, getQwenConfig, type QwenConfig } from '@/lib/qwen-client';
import type { GenerationModelRouting } from '@/core/types';

function withGenerationModels(config: QwenConfig, generationModels?: Partial<GenerationModelRouting>): QwenConfig {
  if (!generationModels) return config;
  return {
    ...config,
    model: generationModels.plannerModel || config.model,
    imageModel: generationModels.imageModel || config.imageModel,
    frameModel: generationModels.frameModel || config.frameModel,
    videoModel: generationModels.videoModel || config.videoModel,
    directorModel: generationModels.directorModel || config.directorModel,
    effort: generationModels.effort || config.effort,
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawConfig = await getQwenConfig();
    if (!rawConfig) {
      return NextResponse.json({ error: 'Qwen API is not configured.' }, { status: 400 });
    }

    const config = withGenerationModels(rawConfig, body.generationModels);
    const result = await callQwenVideoGeneration(config, {
      prompt: body.prompt,
      startFrameUrl: body.startFrameUrl,
      endFrameUrl: body.endFrameUrl,
      model: config.videoModel,
    });

    return NextResponse.json({
      videoUrl: result.url,
      model: result.model,
    });
  } catch (error) {
    const err = error as { status?: number; message?: string; kind?: string };
    return NextResponse.json(
      {
        error: err.message || 'Failed to generate scene video.',
        kind: err.kind,
      },
      { status: err.status && err.status >= 400 ? err.status : 500 },
    );
  }
}
