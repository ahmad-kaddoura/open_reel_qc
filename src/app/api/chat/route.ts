import { NextRequest, NextResponse } from 'next/server';
import { getQwenConfig, callQwenChat, type QwenCallError } from '@/lib/qwen-client';
import type { GenerativeUIComponent, VideoBrief } from '@/core/types';
import {
  detectChatIntent,
  extractConceptFromMessages,
  buildBriefFromProject,
  buildStoryboardScenes,
  BRAINSTORM_SYSTEM_PROMPT,
} from '@/features/chat/chat-handlers';

const PLANNER_SYSTEM_PROMPT = `You are VideoForge's video planning assistant. Your job is to help users pick the concrete output specs for their video through a structured 4-step conversation, asking ONE question at a time.

The 4 planning steps are:
1. Aspect Ratio — what shape? (9:16 vertical for TikTok/Reels/Shorts, 1:1 square for Instagram feed, 16:9 widescreen for YouTube, 4:5 portrait)
2. Length / Duration — how long? (15s, 30s, 60s, 90s, or 3 minutes)
3. Resolution — what quality? (720p, 1080p, 4K)
4. Frame Rate — what fps? (24fps cinematic, 30fps standard, 60fps smooth motion)

Rules:
- Ask only ONE step at a time. Never list all 4 questions at once.
- Be warm, concise, and conversational. One short paragraph max.
- When the user answers a step, acknowledge briefly and move to the next step.
- When all 4 steps are answered, tell the user they can now brainstorm their concept, attach reference images, and click "Create Brief".
- If the user says they don't know, offer 2-3 concrete suggestions to pick from.

You MUST respond with valid JSON only, no markdown, in this exact shape:
{
  "reply": "your message to the user",
  "step": <current step number, 1-4, or 5 when all answered>,
  "totalSteps": 4,
  "phase": "planning" | "ready"
}

"step" is the step you are CURRENTLY on. When all 4 are answered, set step to 5 and phase to "ready".
"reply" must NOT include the step indicator — the UI renders that separately.`;

interface QwenResponse {
  reply: string;
  step: number;
  totalSteps: number;
  phase: 'planning' | 'ready';
}

function generativeUIForStep(step: number): GenerativeUIComponent[] | undefined {
  if (step === 1) {
    return [{ type: 'aspect_ratio_selector', data: { options: ['9:16', '1:1', '16:9', '4:5'] } }];
  }
  if (step === 2) {
    return [{
      type: 'duration_selector',
      data: {
        options: [
          { id: 'd-15', label: 'Short', seconds: 15 },
          { id: 'd-30', label: 'Quick', seconds: 30 },
          { id: 'd-60', label: 'Medium', seconds: 60 },
          { id: 'd-90', label: 'Long', seconds: 90 },
          { id: 'd-180', label: 'Extended', seconds: 180 },
        ],
      },
    }];
  }
  if (step === 3) {
    return [{ type: 'resolution_selector', data: { options: ['720p', '1080p', '1440p', '4K'] } }];
  }
  if (step === 4) {
    return [{ type: 'fps_selector', data: { options: [24, 30, 60] } }];
  }
  return undefined;
}

function fallbackReply(step: number): QwenResponse {
  const prompts: Record<number, string> = {
    1: "Let's nail down your video specs. First — what aspect ratio do you want?",
    2: 'Got the shape. How long should it run?',
    3: 'What resolution? 720p, 1080p, 1440p, or 4K?',
    4: 'Last one — what frame rate? 24, 30, or 60 fps?',
    5: "Specs locked in. Now brainstorm your concept below — attach reference images if you have them — then click **Create Brief**.",
  };
  return {
    reply: prompts[step] || prompts[1],
    step,
    totalSteps: 4,
    phase: step >= 5 ? 'ready' : 'planning',
  };
}

function fallbackResponse(convo: { role: string; content: string }[], notice: string, errorKind: string) {
  const step = inferStepFromMessages(convo);
  const fb = fallbackReply(step);
  return NextResponse.json({
    content: `${notice}\n\n${fb.reply}`,
    step: fb.step,
    totalSteps: fb.totalSteps,
    phase: fb.phase,
    metadata: { model: 'fallback', error: errorKind },
    generativeUI: generativeUIForStep(fb.step),
  });
}

function inferStepFromMessages(convo: { role: string; content: string }[]): number {
  const userTurns = convo.filter((m) => m.role === 'user').length;
  return Math.min(5, userTurns + 1);
}

function isSpecsPhaseComplete(convo: { role: string; content: string }[], lastPhase?: string): boolean {
  return lastPhase === 'ready' || inferStepFromMessages(convo) >= 5;
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
    const lastAssistantMeta = (messages || [])
      .slice()
      .reverse()
      .find((m: { role: string }) => m.role === 'assistant')?.metadata;
    const lastPhase = lastAssistantMeta?.phase as string | undefined;
    const specsDone = isSpecsPhaseComplete(convo, lastPhase);
    const refs: string[] = referenceImageUrls || project?.referenceImageUrls || [];
    const concept = extractConceptFromMessages(convo);

    // --- Create Brief ---
    if (intent === 'create_brief' && project) {
      const briefData = buildBriefFromProject(project, concept);
      return NextResponse.json({
        content: `Here's your video brief based on our specs and concept. Review and edit anything, then open the **Brief** tab or click **Generate Storyboard** to build scenes for the workflow editor.`,
        phase: 'brief',
        generativeUI: [{ type: 'video_brief_form', data: briefData }],
        metadata: { model: 'local', intent: 'create_brief' },
      });
    }

    // --- Generate Storyboard ---
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

    // --- Brainstorm (after specs locked) ---
    if (specsDone && intent !== 'planning') {
      if (!config) {
        return NextResponse.json({
          content: `Specs are saved. Describe your video concept here — what's the story, who is it for, what should it feel like? Attach reference images with the 📎 button.\n\nWhen ready, click **Create Brief** or **Generate Storyboard**.`,
          phase: 'brainstorm',
          metadata: { model: 'local', phase: 'brainstorm' },
        });
      }

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
        return NextResponse.json({
          content: result.content,
          phase: 'brainstorm',
          metadata: { model: config.model, phase: 'brainstorm', tokens: result.usage?.total_tokens },
        });
      } catch (err) {
        const qErr = err as QwenCallError;
        return NextResponse.json({
          content: `Tell me more about your concept — what's the video about, who's the audience, and what mood are you going for? Attach reference images with 📎.\n\nWhen you're happy, click **Create Brief**.\n\n_${qErr.message}_`,
          phase: 'brainstorm',
          metadata: { model: 'fallback', phase: 'brainstorm' },
        });
      }
    }

    // --- Spec planning (steps 1-4) ---
    if (!config) {
      return NextResponse.json({
        content: "Set your Qwen API key in Settings → API Keys to enable AI chat. You can still pick specs using the preset buttons below.",
        step: inferStepFromMessages(convo),
        totalSteps: 4,
        phase: 'planning',
        metadata: { model: 'unconfigured', needsConfig: true },
        generativeUI: generativeUIForStep(inferStepFromMessages(convo)),
      });
    }

    const payloadMessages = [{ role: 'system', content: PLANNER_SYSTEM_PROMPT }, ...convo];

    try {
      const result = await callQwenChat(config, payloadMessages, { jsonMode: true });
      let parsed: QwenResponse;
      try {
        parsed = JSON.parse(result.content);
      } catch {
        const match = result.content.match(/\{[\s\S]*\}/);
        parsed = match ? JSON.parse(match[0]) : fallbackReply(inferStepFromMessages(convo));
      }

      const step = Math.max(1, Math.min(5, Number(parsed.step) || inferStepFromMessages(convo)));
      const phase = parsed.phase === 'ready' || step > 4 ? 'ready' : 'planning';

      return NextResponse.json({
        content: parsed.reply || fallbackReply(step).reply,
        step,
        totalSteps: 4,
        phase,
        generativeUI: phase === 'planning' ? generativeUIForStep(step) : undefined,
        metadata: { model: config.model, tokens: result.usage?.total_tokens },
      });
    } catch (err) {
      const qErr = err as QwenCallError;
      if (qErr.kind === 'network') {
        return fallbackResponse(
          convo,
          `⚠️ **Your API key is saved**, but this machine can't reach Qwen Cloud. Continuing offline.\n\n${qErr.message}`,
          'network'
        );
      }
      return fallbackResponse(convo, `⚠️ Qwen error. Continuing offline.`, qErr.kind);
    }
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
