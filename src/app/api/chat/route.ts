import { NextRequest, NextResponse } from 'next/server';
import { getQwenConfig, callQwenChat, callQwenImageGeneration, type QwenCallError, type QwenConfig } from '@/lib/qwen-client';
import type { CreativeWorkflowPlan, GenerationModelRouting, GenerativeUIComponent, PromptOverrides, Scene, VideoBrief } from '@/core/types';
import {
  detectPlanApproval,
  detectChatIntent,
  extractConceptFromMessages,
  buildBriefFromProject,
  buildStoryboardScenes,
  buildCreativeWorkflowPlanWithPrompts,
  BRAINSTORM_SYSTEM_PROMPT,
} from '@/features/chat';
import { resolvePrompt } from '@/core/prompts';

function framePrompt(scene: Scene, kind: 'start' | 'end', plan: CreativeWorkflowPlan, promptOverrides?: PromptOverrides): string {
  const assetNotes = plan.reusableAssets
    .filter((asset) => scene.assetsUsed?.includes(asset.id))
    .map((asset) => `${asset.name}: ${asset.description}. ${asset.consistencyNotes}`)
    .join('\n');
  const referenceNotes = (plan.consistencyReferences ?? [])
    .filter((ref) => ref.reusePolicy === 'always' || ref.appliesToSceneIds.includes(scene.id))
    .map((ref) => `${ref.name} (${ref.type}, ${ref.reusePolicy}): ${ref.consistencyNotes}`)
    .join('\n');
  const base = kind === 'start' ? scene.startFramePrompt : scene.endFramePrompt;
  return resolvePrompt(kind === 'start' ? 'frame.start.consistency' : 'frame.end.consistency', {
    base,
    style: plan.toneAndStyle,
    mode: plan.videoMode,
    continuity: plan.consistencyRequirements.join(' '),
    assets: assetNotes || 'No reusable asset assigned.',
    references: referenceNotes || 'Use project visual direction and scene prompt only.',
    camera: scene.cameraMovement,
    lighting: scene.lighting,
    avoid: scene.negativePrompt || scene.avoid || '',
  }, promptOverrides);
}

function withGenerationModels(config: QwenConfig, generationModels?: Partial<GenerationModelRouting>): QwenConfig {
  if (!generationModels) return config;
  return {
    ...config,
    model: generationModels.plannerModel || config.model,
    imageModel: generationModels.imageModel || config.imageModel,
    frameModel: generationModels.frameModel || config.frameModel,
    videoModel: generationModels.videoModel || config.videoModel,
    motionControlModel: generationModels.motionControlModel || config.motionControlModel,
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

async function hydratePlanImages(plan: CreativeWorkflowPlan, config: QwenConfig, promptOverrides?: PromptOverrides): Promise<CreativeWorkflowPlan> {
  const next: CreativeWorkflowPlan = structuredClone(plan);
  next.approvalStatus = 'approved';

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
      const start = await generateImageWithRetry(config, framePrompt(scene, 'start', next, promptOverrides), {
          model: config.frameModel,
          negativePrompt: scene.negativePrompt || scene.avoid,
      });
      const end = await generateImageWithRetry(config, framePrompt(scene, 'end', next, promptOverrides), {
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

  next.approvalStatus = 'assets_generated';
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

function planReviewResponse(plan: CreativeWorkflowPlan, metadata: Record<string, unknown> = {}, config?: QwenConfig | null, promptOverrides?: PromptOverrides) {
  return NextResponse.json({
    content: resolvePrompt('scenario.plan.response', {
      sceneCount: plan.scenes.length,
      assetCount: plan.reusableAssets.length,
    }, promptOverrides),
    phase: 'plan_ready',
    generativeUI: [{ type: 'creative_workflow_plan', data: plan } satisfies GenerativeUIComponent],
    metadata: {
      model: config?.model || 'local',
      imageModel: config?.imageModel,
      frameModel: config?.frameModel,
      videoModel: config?.videoModel,
      directorModel: config?.directorModel,
      intent: 'creative_plan',
      ...metadata,
    },
  });
}

async function approvedAssetsResponse(plan: CreativeWorkflowPlan, metadata: Record<string, unknown> = {}, config?: QwenConfig | null, promptOverrides?: PromptOverrides) {
  const hydrated = config ? await hydratePlanImages(plan, config, promptOverrides) : { ...plan, approvalStatus: 'approved' as const };
  const firstAsset = hydrated.reusableAssets[0]?.name ?? 'reusable visual asset';
  const generatedAssets = hydrated.reusableAssets.filter((asset) => asset.generationStatus === 'generated').length;
  const generatedFramePairs = hydrated.scenes.filter((scene) => scene.frameGenerationStatus === 'generated').length;
  const imageNote = config
    ? `Generated ${generatedAssets}/${hydrated.reusableAssets.length} reusable image asset${hydrated.reusableAssets.length === 1 ? '' : 's'} with **${config.imageModel}** and ${generatedFramePairs}/${hydrated.scenes.length} start/end frame pair${hydrated.scenes.length === 1 ? '' : 's'} with **${config.frameModel}**.`
    : `Image generation is not configured, so I prepared the approved prompts and marked the assets/frames as pending instead of showing fake generated images.`;
  return NextResponse.json({
    content: `Plan approved. I prepared the **${firstAsset}** first so every shot can stay consistent. ${imageNote}\n\nConfirm the generated assets, number of scenes, length, aspect ratio, visual style, main subject, negative prompts, output format, and any manual preferences before generating videos in Workflow.`,
    phase: 'assets_ready',
    generativeUI: [{ type: 'creative_workflow_plan', data: hydrated } satisfies GenerativeUIComponent],
    metadata: {
      model: config?.model || 'local',
      imageModel: config?.imageModel,
      frameModel: config?.frameModel,
      videoModel: config?.videoModel,
      directorModel: config?.directorModel,
      intent: 'approved_asset_generation',
      ...metadata,
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const { messages, project, referenceImageUrls = [], generationModels, promptOverrides = {} } = await req.json();

    const convo = (messages || [])
      .filter((m: { role: string; content: string }) => m.role !== 'system' && m.content)
      .map((m: { role: string; content: string }) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      }));

    const lastUser = convo.filter((m: { role: string }) => m.role === 'user').pop()?.content || '';
    const intent = detectChatIntent(lastUser);
    const approved = detectPlanApproval(lastUser);
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
    const existingPlan = project?.creativePlan as CreativeWorkflowPlan | undefined;

    if (approved && existingPlan) {
      return approvedAssetsResponse(
        { ...existingPlan, approvalStatus: 'approved' },
        { model: config ? config.model : 'unconfigured', needsConfig: !config },
        config,
        promptOverrides,
      );
    }

    if (config) {
      const refNote = refs.length
        ? `The user attached ${refs.length} reference image(s). Treat user-provided images as source-of-truth references where relevant.`
        : '';
      try {
        const result = await callQwenChat(
          config,
          [
            { role: 'system', content: resolvePrompt('planning.chat.system', { referenceCount: refs.length, referenceNote: refNote }, promptOverrides) || BRAINSTORM_SYSTEM_PROMPT },
            ...convo,
          ],
          { jsonMode: false, maxTokens: 800 }
        );
        const plan = buildCreativeWorkflowPlanWithPrompts(concept || lastUser, refs, promptOverrides);
        return planReviewResponse(plan, {
            model: config.model,
            aiPlanningNotes: result.content,
            intent: 'creative_plan',
            tokens: result.usage?.total_tokens,
          }, config, promptOverrides);
      } catch (err) {
        const qErr = err as QwenCallError;
        const plan = buildCreativeWorkflowPlanWithPrompts(concept || lastUser, refs, promptOverrides);
        return planReviewResponse(plan, { model: 'fallback', error: qErr.kind, notice: qErr.message }, config, promptOverrides);
      }
    }

    const plan = buildCreativeWorkflowPlanWithPrompts(concept || lastUser, refs, promptOverrides);
    return planReviewResponse(plan, { model: 'unconfigured', needsConfig: true }, null, promptOverrides);
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
