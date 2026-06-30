import type { CreativeWorkflowPlan, Project, ReusableAssetPlan, Scene, VideoBrief } from '@/core/types';
import { buildVideoBriefPatch } from './video-output-utils';

export type ChatIntent = 'planning' | 'brainstorm' | 'create_brief' | 'generate_storyboard' | 'hooks' | 'review';

export function detectChatIntent(message: string): ChatIntent | null {
  const m = message.toLowerCase();
  if (m.includes('create brief') || m.includes('create a brief') || m.includes('structured video brief')) {
    return 'create_brief';
  }
  if (m.includes('storyboard') || m.includes('scene breakdown')) {
    return 'generate_storyboard';
  }
  if (m.includes('hook')) return 'hooks';
  if (m.includes('review') || m.includes('director')) return 'review';
  return null;
}

export function extractConceptFromMessages(messages: { role: string; content: string }[]): string {
  return messages
    .filter((m) => m.role === 'user')
    .map((m) => m.content)
    .filter((c) => !/^\d+:\d+|aspect ratio|fps|resolution|\d+ seconds?$/i.test(c))
    .slice(-5)
    .join(' ')
    .trim();
}

export function buildBriefFromProject(
  project: Project,
  conceptHint?: string
): Partial<VideoBrief> {
  const settings = project.settings;
  const existing = project.videoBrief;
  const base = buildVideoBriefPatch(project, {});

  return {
    ...base,
    title: existing?.title || project.name || 'Untitled Video',
    description:
      conceptHint ||
      existing?.description ||
      project.description ||
      'A short-form video based on our planning session.',
    videoType: existing?.videoType || 'reel',
    targetPlatform: settings.targetPlatform,
    aspectRatio: settings.aspectRatio,
    duration: base.duration,
    style: existing?.style || 'cinematic',
    mood: existing?.mood || '',
    numberOfScenes: existing?.numberOfScenes || Math.max(3, Math.min(6, Math.round(base.duration / 7))),
    sceneDuration: existing?.sceneDuration || Math.round(base.duration / 4),
    fps: settings.fps,
    resolution: settings.resolution,
    outputFormat: settings.outputFormat,
    captions: existing?.captions ?? true,
    audience: existing?.audience,
  };
}

export function buildStoryboardScenes(
  brief: Partial<VideoBrief>,
  concept: string,
  referenceImageUrls: string[] = []
): Partial<Scene>[] {
  const count = brief.numberOfScenes || 4;
  const sceneDur = brief.sceneDuration || Math.floor((brief.duration || 30) / count);
  const style = brief.style || 'cinematic';
  const topic = concept || brief.description || 'the product';

  const templates = [
    {
      title: 'Hook — Grab Attention',
      prompt: `Dramatic opening shot for ${topic}, ${style} style, high contrast lighting, immediate visual hook, ${brief.aspectRatio} framing`,
      mood: 'Bold, attention-grabbing',
      cameraMovement: 'slow_push_in' as const,
    },
    {
      title: 'Problem / Context',
      prompt: `Relatable scene establishing the challenge around ${topic}, ${style} aesthetic, natural lighting, authentic feel`,
      mood: 'Relatable, empathetic',
      cameraMovement: 'handheld' as const,
    },
    {
      title: 'Solution / Showcase',
      prompt: `Hero showcase of ${topic}, premium ${style} product shot, dynamic angles, crisp detail, professional commercial quality`,
      mood: 'Confident, impressive',
      cameraMovement: 'orbit' as const,
    },
    {
      title: 'Call to Action',
      prompt: `Closing scene for ${topic}, warm inviting ${style} finish, clear CTA moment, aspirational but achievable`,
      mood: 'Empowering, conclusive',
      cameraMovement: 'dolly_in' as const,
    },
  ];

  let t = 0;
  return Array.from({ length: count }, (_, i) => {
    const tpl = templates[i] || templates[templates.length - 1];
    const start = t;
    const end = t + sceneDur;
    t = end;
    return {
      id: `scene-${i + 1}`,
      order: i,
      title: tpl.title,
      prompt: tpl.prompt,
      startTime: start,
      endTime: end,
      duration: sceneDur,
      cameraMovement: tpl.cameraMovement,
      mood: tpl.mood,
      characters: [],
      props: [],
      transition: i === 0 ? 'fade' : 'cut',
      textOverlays: [],
      referenceImageUrls: referenceImageUrls.slice(0, 3),
      stylePreset: style,
      status: 'idle' as const,
      versions: [],
    };
  });
}

function inferAssetNeeds(concept: string): ReusableAssetPlan[] {
  const lower = concept.toLowerCase();
  const assets: ReusableAssetPlan[] = [];
  const needsInfluencer = /influencer|creator|woman|female|girl|model|person|face|makeup|beauty/.test(lower);
  const needsProduct = /product|make\s*up|makeup|cosmetic|lipstick|foundation|serum|cream|brand/.test(lower);

  if (needsInfluencer) {
    assets.push({
      id: 'asset-influencer-character',
      type: 'influencer',
      name: 'Influencer Character Asset',
      description: 'Consistent female beauty creator used as the hero subject across every scene.',
      generationStatus: 'pending',
      consistencyNotes: 'Keep the same face shape, skin tone, hair length, facial features, and approachable creator energy in all frames.',
      styleNotes: 'Clean beauty lighting, polished but realistic makeup, modern neutral outfit, premium social-video framing.',
      personality: 'Confident, warm, tutorial-friendly, aspirational without feeling staged.',
      referenceImagePrompt: `Photorealistic reference portrait of a consistent female beauty influencer for ${concept}, clean studio bathroom or vanity lighting, natural skin texture, soft glam makeup, modern neutral outfit, direct-to-camera creator look, high detail`,
      negativePrompt: 'different face, inconsistent hair, distorted hands, extra fingers, heavy filters, plastic skin, unreadable text, random logos',
      usageNotes: 'Generate this identity first. Reuse it in every start frame, end frame, and motion prompt that includes the creator.',
      saveTargets: ['brand_identity', 'project_assets'],
    });
  }

  if (needsProduct) {
    assets.push({
      id: 'asset-makeup-product',
      type: 'product',
      name: 'Makeup Product Asset',
      description: 'Reusable hero cosmetic product or compact brand item for application and final product shot scenes.',
      generationStatus: 'pending',
      consistencyNotes: 'Keep packaging shape, cap color, label placement, and product color consistent.',
      styleNotes: 'Minimal premium beauty packaging with clean readable silhouette; avoid inventing real brand logos.',
      referenceImagePrompt: `Premium makeup product reference for ${concept}, elegant cosmetic packaging, clean label area, soft reflective surface, beauty campaign lighting, high detail`,
      negativePrompt: 'real trademarked logos, misspelled text, warped packaging, duplicated caps, messy background',
      usageNotes: 'Use in application, reveal, and product hero/CTA scenes. Save to assets if this becomes a recurring product.',
      saveTargets: ['project_assets', 'brand_identity'],
    });
  }

  return assets;
}

function scene(
  index: number,
  title: string,
  goal: string,
  concept: string,
  duration: number,
  startTime: number,
  cameraMovement: Scene['cameraMovement'],
  action: string,
  assetsUsed: string[],
): Scene {
  const endTime = startTime + duration;
  const startFramePrompt = `${title} start frame for ${concept}: ${goal}. Compose the opening image with clear subject placement, consistent reusable assets, and beauty-commercial detail.`;
  const endFramePrompt = `${title} end frame for ${concept}: show the completed beat after the action, preserving the same character, product, lighting, and environment.`;

  return {
    id: `scene-${index}`,
    order: index - 1,
    title,
    sceneGoal: goal,
    prompt: `${goal}. ${action}. Maintain visual continuity with approved reusable assets.`,
    startTime,
    endTime,
    duration,
    cameraMovement,
    mood: 'Polished, intimate, creator-led',
    characters: assetsUsed.filter((id) => id.includes('influencer')),
    props: assetsUsed.filter((id) => id.includes('product')),
    productPlacement: assetsUsed.some((id) => id.includes('product')) ? 'Product is visible only when narratively useful; final scene gives it the clean hero moment.' : undefined,
    transition: index === 1 ? 'fade' : 'cut',
    textOverlays: [],
    referenceImageUrls: [],
    stylePreset: 'ugc_influencer',
    status: 'idle',
    versions: [],
    aspectRatio: '9:16',
    sceneDescription: goal,
    actionDescription: action,
    visualStyle: 'Realistic UGC beauty tutorial with premium commercial polish',
    lighting: 'Soft frontal vanity light with gentle highlights and natural skin texture',
    details: 'Consistent face, outfit, makeup progression, product packaging, and tidy vanity environment',
    avoid: 'warped hands, inconsistent face, random logos, unreadable labels, flickering makeup continuity',
    startFramePrompt,
    endFramePrompt,
    frameGenerationStatus: 'pending',
    motionPrompt: `Animate ${action.toLowerCase()} with controlled creator-style movement, stable facial identity, natural hand motion, and no sudden camera jumps.`,
    negativePrompt: 'distorted hands, face changes, melted packaging, extra fingers, jump cuts, duplicated products, text artifacts',
    narration: index === 1
      ? 'Today I am testing a soft glam look that feels effortless on camera.'
      : index === 4
        ? 'Save this look for your next beauty routine.'
        : undefined,
    assetsUsed,
  };
}

export function buildCreativeWorkflowPlan(concept: string, referenceImageUrls: string[] = []): CreativeWorkflowPlan {
  const safeConcept = concept || 'a creator-led short video';
  const assets = inferAssetNeeds(safeConcept);
  const assetIds = assets.map((asset) => asset.id);
  const productIds = assetIds.filter((id) => id.includes('product'));
  const influencerIds = assetIds.filter((id) => id.includes('influencer'));
  const allAssets = [...influencerIds, ...productIds];

  const scenes = [
    scene(1, 'Hook / Before Makeup Close-Up', 'Open with a clean close-up that establishes the influencer and the before state.', safeConcept, 4, 0, 'slow_push_in', 'The influencer looks into camera, shows natural skin, and teases the transformation.', influencerIds),
    scene(2, 'Applying Product', 'Show the key makeup application beat with clear hand, product, and face continuity.', safeConcept, 7, 4, 'close_up', 'The influencer applies the product in a satisfying close-up with smooth hand movement.', allAssets),
    scene(3, 'Beauty Reveal', 'Deliver the transformation payoff while keeping the same identity and makeup continuity.', safeConcept, 5, 11, 'dolly_in', 'The influencer turns toward the light to reveal the finished soft glam look.', influencerIds),
    scene(4, 'Product Hero / CTA', 'End with a clean product and creator moment that can support a brand CTA.', safeConcept, 4, 16, 'static', 'The product sits foreground on the vanity while the influencer smiles behind it and gestures naturally.', allAssets),
  ].map((sc) => ({ ...sc, referenceImageUrls }));

  return {
    id: `plan-${Date.now()}`,
    concept: safeConcept,
    summary: `A creator-led beauty video built around ${safeConcept}. The workflow starts by locking reusable visual assets, then uses them across editable scene, frame, motion, script, and render nodes.`,
    targetViewer: 'Beauty and social-commerce viewers who want a quick, credible transformation and product proof.',
    toneAndStyle: 'Warm creator tutorial, realistic beauty lighting, polished short-form ad energy.',
    storyStructure: ['Identity/reference asset first', 'Before-state hook', 'Application proof', 'Transformation reveal', 'Product hero and CTA'],
    reusableAssets: assets,
    scenes,
    consistencyRequirements: [
      'Generate and approve reusable character/product references before scene generation.',
      'Reuse the same face, hair, outfit, makeup progression, product packaging, and environment across frames.',
      'Keep technical render choices in the output settings panel until the creative workflow is approved.',
    ],
    renderSettingsDeferred: true,
  };
}

export const BRAINSTORM_SYSTEM_PROMPT = `You are VideoForge's creative director. First understand the user's video idea, then plan the video like a production workflow.

Do not ask for aspect ratio, duration, platform, fps, resolution, model, seed, or render settings first. Those come later in the render settings panel.

Respond with a concise creative plan that covers:
- what the video is about
- target viewer
- tone and style
- reusable character, product, brand, logo, or environment assets needed first
- scene structure
- start/end frame direction
- motion and camera direction
- script or voiceover notes
- consistency requirements

If a reusable character or product is needed, explicitly say it should be generated before scenes. Keep the response actionable and invite the user to edit everything in Workflow.`;
