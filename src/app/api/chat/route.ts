import { NextRequest, NextResponse } from 'next/server';
import { getQwenConfig, callQwenChat, callQwenImageGeneration, type QwenCallError, type QwenConfig } from '@/lib/qwen-client';
import type { CreativeWorkflowPlan, GenerationModelRouting, GenerativeUIComponent, Scene, VideoBrief } from '@/core/types';
import {
  detectChatIntent,
  extractConceptFromMessages,
  buildBriefFromProject,
  buildStoryboardScenes,
  buildCreativeWorkflowPlan,
  BRAINSTORM_SYSTEM_PROMPT,
} from '@/features/chat';

function framePrompt(scene: Scene, kind: 'start' | 'end', plan: CreativeWorkflowPlan): string {
  const assetNotes = plan.reusableAssets
    .filter((asset) => scene.assetsUsed?.includes(asset.id))
    .map((asset) => `${asset.name}: ${asset.description}. ${asset.consistencyNotes}`)
    .join('\n');
  const referenceNotes = (plan.consistencyReferences ?? [])
    .filter((ref) => ref.reusePolicy === 'always' || ref.appliesToSceneIds.includes(scene.id))
    .map((ref) => `${ref.name} (${ref.type}, ${ref.reusePolicy}): ${ref.consistencyNotes}`)
    .join('\n');
  const base = kind === 'start' ? scene.startFramePrompt : scene.endFramePrompt;
  return `${base}

Style: ${plan.toneAndStyle}.
Video type: ${plan.videoMode}.
Scene continuity: ${plan.consistencyRequirements.join(' ')}
Reusable assets to preserve:
${assetNotes || 'No reusable asset assigned.'}
Consistency references:
${referenceNotes || 'Use project visual direction and scene prompt only.'}
Camera: ${scene.cameraMovement}. Lighting: ${scene.lighting}. Avoid: ${scene.negativePrompt || scene.avoid || ''}`;
}

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

function isRateLimit(error: unknown): boolean {
  const err = error as Partial<QwenCallError>;
  return Boolean(
    err?.message?.toLowerCase().includes('rate') ||
    err?.message?.toLowerCase().includes('throttling')
  );
}

async function generateImageWithRetry(
  config: QwenConfig,
  prompt: string,
  options: { model: string; negativePrompt?: string },
): Promise<{ url: string; model: string }> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await callQwenImageGeneration(config, prompt, options);
    } catch (error) {
      lastError = error;
      if (!isRateLimit(error) || attempt === 2) break;
      await new Promise((resolve) => setTimeout(resolve, 4000 * (attempt + 1)));
    }
  }
  throw lastError;
}

async function hydratePlanImages(plan: CreativeWorkflowPlan, config: QwenConfig): Promise<CreativeWorkflowPlan> {
  const next: CreativeWorkflowPlan = structuredClone(plan);

  for (const asset of next.reusableAssets) {
    try {
      const result = await generateImageWithRetry(config, asset.referenceImagePrompt, {
        model: config.imageModel,
        negativePrompt: asset.negativePrompt,
      });
      asset.generatedImageUrl = result.url;
      asset.generationStatus = 'generated';
      asset.generationModel = result.model;
      asset.generationError = undefined;
    } catch (error) {
      const err = error as QwenCallError;
      asset.generationStatus = 'failed';
      asset.generationModel = config.imageModel;
      asset.generationError = err.message;
    }
  }

  for (const scene of next.scenes) {
    try {
      const start = await generateImageWithRetry(config, framePrompt(scene, 'start', next), {
          model: config.frameModel,
          negativePrompt: scene.negativePrompt || scene.avoid,
      });
      const end = await generateImageWithRetry(config, framePrompt(scene, 'end', next), {
          model: config.frameModel,
          negativePrompt: scene.negativePrompt || scene.avoid,
      });
      scene.startFrameUrl = start.url;
      scene.endFrameUrl = end.url;
      scene.generatedStartFrameUrl = start.url;
      scene.generatedEndFrameUrl = end.url;
      scene.frameGenerationStatus = 'generated';
      scene.frameGenerationModel = start.model;
      scene.frameGenerationError = undefined;
    } catch (error) {
      const err = error as QwenCallError;
      scene.frameGenerationStatus = 'failed';
      scene.frameGenerationModel = config.frameModel;
      scene.frameGenerationError = err.message;
    }
  }

  next.consistencyReferences = next.consistencyReferences.map((ref) => {
    const asset = next.reusableAssets.find((item) => `ref-${item.id}` === ref.id || item.id === ref.id.replace(/^ref-/, ''));
    return asset
      ? {
          ...ref,
          imageUrl: asset.generatedImageUrl ?? ref.imageUrl,
          prompt: asset.referenceImagePrompt,
          negativePrompt: asset.negativePrompt,
          consistencyNotes: asset.consistencyNotes,
        }
      : ref;
  });

  return next;
}

async function workflowPlanResponse(concept: string, refs: string[], metadata: Record<string, unknown> = {}, config?: QwenConfig | null) {
  const basePlan = buildCreativeWorkflowPlan(concept, refs);
  const plan = config ? await hydratePlanImages(basePlan, config) : basePlan;
  const firstAsset = plan.reusableAssets[0]?.name ?? 'reusable visual asset';
  const generatedAssets = plan.reusableAssets.filter((asset) => asset.generationStatus === 'generated').length;
  const generatedFramePairs = plan.scenes.filter((scene) => scene.frameGenerationStatus === 'generated').length;
  const imageNote = config
    ? `Generated ${generatedAssets}/${plan.reusableAssets.length} reusable image asset${plan.reusableAssets.length === 1 ? '' : 's'} with **${config.imageModel}** and ${generatedFramePairs}/${plan.scenes.length} start/end frame pair${plan.scenes.length === 1 ? '' : 's'} with **${config.frameModel}**.`
    : `Image generation is not configured, so I prepared the prompts and marked the assets/frames as pending instead of showing fake generated images.`;
  return NextResponse.json({
    content: `I created the **${firstAsset}** first so every shot can stay consistent. ${imageNote}\n\nReview or save the assets below, then open **Workflow**. The workflow will load with ${plan.reusableAssets.length} reusable asset node${plan.reusableAssets.length === 1 ? '' : 's'}, ${plan.scenes.length} scenes, and any generated start/end frames already attached so you can generate the scene videos and connect them into one consistent film.`,
    phase: 'assets_ready',
    generativeUI: [{ type: 'creative_workflow_plan', data: plan } satisfies GenerativeUIComponent],
    metadata: {
      model: config?.model || 'local',
      imageModel: config?.imageModel,
      frameModel: config?.frameModel,
      videoModel: config?.videoModel,
      directorModel: config?.directorModel,
      intent: 'creative_workflow',
      ...metadata,
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const { messages, project, referenceImageUrls = [], generationModels } = await req.json();

    const convo = (messages || [])
      .filter((m: { role: string; content: string }) => m.role !== 'system' && m.content)
      .map((m: { role: string; content: string }) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      }));

    const lastUser = convo.filter((m: { role: string }) => m.role === 'user').pop()?.content || '';
    const intent = detectChatIntent(lastUser);
    const refs: string[] = referenceImageUrls || project?.referenceImageUrls || [];
    const concept = extractConceptFromMessages(convo);

    // --- Create Brief ---
    if (intent === 'create_brief' && project) {
      const briefData = buildBriefFromProject(project, concept);
      return NextResponse.json({
        content: `Here's a structured brief based on the creative plan. It stays available for later editing, but the current flow will continue through **Workflow** first.`,
        phase: 'brief',
        generativeUI: [{ type: 'video_brief_form', data: briefData }],
        metadata: { model: 'local', intent: 'create_brief' },
      });
    }

    // --- Generate Storyboard (kept for future sections, not required in current flow) ---
    if (intent === 'generate_storyboard' && project) {
      const brief = buildBriefFromProject(project, concept) as VideoBrief;
      const scenes = buildStoryboardScenes(brief, concept, refs);
      return NextResponse.json({
        content: `I've built **${scenes.length} scenes** with prompts ready for the workflow editor. Each scene includes your reference images where attached. Click **Accept All & Continue** to open the n8n-style flow where you can edit every prompt.`,
        generativeUI: [{ type: 'scene_suggestion', data: scenes }],
        metadata: { model: 'local', intent: 'generate_storyboard' },
      });
    }

    const rawConfig = await getQwenConfig();
    const config = rawConfig ? withGenerationModels(rawConfig, generationModels) : null;

    if (config) {
      const refNote = refs.length
        ? `\n\nThe user attached ${refs.length} reference image(s). Describe how they could inspire the visual direction.`
        : '';
      try {
        const result = await callQwenChat(
          config,
          [
            { role: 'system', content: BRAINSTORM_SYSTEM_PROMPT + refNote },
            ...convo,
          ],
          { jsonMode: false, maxTokens: 800 }
        );
        const basePlan = buildCreativeWorkflowPlan(concept || lastUser, refs);
        const plan = await hydratePlanImages(basePlan, config);
        const generatedAssets = plan.reusableAssets.filter((asset) => asset.generationStatus === 'generated').length;
        const generatedFramePairs = plan.scenes.filter((scene) => scene.frameGenerationStatus === 'generated').length;
        return NextResponse.json({
          content: `${result.content}\n\nI generated ${generatedAssets}/${plan.reusableAssets.length} reusable image assets with **${config.imageModel}** and ${generatedFramePairs}/${plan.scenes.length} start/end frame pairs with **${config.frameModel}**. Review or save them below, then open Workflow when you are ready to generate the scene videos.`,
          phase: 'assets_ready',
          generativeUI: [{ type: 'creative_workflow_plan', data: plan }],
          metadata: {
            model: config.model,
            imageModel: config.imageModel,
            frameModel: config.frameModel,
            videoModel: config.videoModel,
            directorModel: config.directorModel,
            phase: 'assets_ready',
            intent: 'creative_workflow',
            tokens: result.usage?.total_tokens,
          },
        });
      } catch (err) {
        const qErr = err as QwenCallError;
        return workflowPlanResponse(concept || lastUser, refs, { model: 'fallback', error: qErr.kind, notice: qErr.message }, config);
      }
    }

    return workflowPlanResponse(concept || lastUser, refs, { model: 'unconfigured', needsConfig: true }, null);
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
