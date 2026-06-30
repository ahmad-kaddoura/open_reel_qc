import { NextRequest, NextResponse } from 'next/server';
import { getQwenConfig, callQwenChat, type QwenCallError } from '@/lib/qwen-client';
import type { GenerativeUIComponent, VideoBrief } from '@/core/types';
import {
  detectChatIntent,
  extractConceptFromMessages,
  buildBriefFromProject,
  buildStoryboardScenes,
  buildCreativeWorkflowPlan,
  BRAINSTORM_SYSTEM_PROMPT,
} from '@/features/chat';

function workflowPlanResponse(concept: string, refs: string[], metadata: Record<string, unknown> = {}) {
  const plan = buildCreativeWorkflowPlan(concept, refs);
  const firstAsset = plan.reusableAssets[0]?.name ?? 'reusable visual asset';
  return NextResponse.json({
    content: `I’ll first create the **${firstAsset}** so every shot stays consistent. Then I’ll build the workflow with editable scene nodes, start/end frame prompts, motion prompts, camera direction, script notes, and deferred render settings.\n\nI’ve prepared ${plan.reusableAssets.length} reusable asset node${plan.reusableAssets.length === 1 ? '' : 's'} and ${plan.scenes.length} scenes. You can edit or regenerate everything in **Workflow** before final video generation.`,
    phase: 'workflow',
    generativeUI: [{ type: 'creative_workflow_plan', data: plan } satisfies GenerativeUIComponent],
    metadata: { model: 'local', intent: 'creative_workflow', ...metadata },
  });
}

export async function POST(req: NextRequest) {
  try {
    const { messages, project, referenceImageUrls = [] } = await req.json();

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

    const config = await getQwenConfig();

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
        const plan = buildCreativeWorkflowPlan(concept || lastUser, refs);
        return NextResponse.json({
          content: `${result.content}\n\nI’ve also built the editable workflow now, starting with reusable asset references before scene generation.`,
          phase: 'workflow',
          generativeUI: [{ type: 'creative_workflow_plan', data: plan }],
          metadata: { model: config.model, phase: 'workflow', intent: 'creative_workflow', tokens: result.usage?.total_tokens },
        });
      } catch (err) {
        const qErr = err as QwenCallError;
        return workflowPlanResponse(concept || lastUser, refs, { model: 'fallback', error: qErr.kind, notice: qErr.message });
      }
    }

    return workflowPlanResponse(concept || lastUser, refs, { model: 'unconfigured', needsConfig: true });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
