export const STYLE_PRESETS = [
  { id: 'cinematic', name: 'Cinematic', description: 'Film-quality, dramatic lighting, shallow depth of field', icon: 'Film' },
  { id: 'luxury_ad', name: 'Luxury Ad', description: 'High-end, elegant, premium feel with rich textures', icon: 'Diamond' },
  { id: 'ugc_influencer', name: 'UGC Influencer', description: 'Authentic, smartphone-shot, relatable content', icon: 'Smartphone' },
  { id: 'realistic_product', name: 'Realistic Product', description: 'Clean product shots with studio lighting', icon: 'Package' },
  { id: 'anime', name: 'Anime', description: 'Japanese animation style with vibrant colors', icon: 'Sparkles' },
  { id: 'dark_scifi', name: 'Dark Sci-Fi', description: 'Futuristic, moody, neon-lit atmosphere', icon: 'Zap' },
  { id: 'documentary', name: 'Documentary', description: 'Natural, informative, real-world footage feel', icon: 'Camera' },
  { id: 'podcast_clip', name: 'Podcast Clip', description: 'Talking head with dynamic captions and B-roll', icon: 'Mic' },
  { id: 'fashion_campaign', name: 'Fashion Campaign', description: 'Editorial, high-fashion, runway-inspired', icon: 'Crown' },
  { id: 'app_promo', name: 'App Promo', description: 'Clean, modern, device mockup showcase', icon: 'Smartphone' },
  { id: 'real_estate', name: 'Real Estate', description: 'Aerial, wide-angle, warm and inviting spaces', icon: 'Home' },
  { id: 'food_commercial', name: 'Food Commercial', description: 'Appetizing, close-up, steam and sizzle effects', icon: 'UtensilsCrossed' },
  { id: 'motivational_reel', name: 'Motivational Reel', description: 'Energetic, text-driven, powerful imagery', icon: 'Flame' },
  { id: 'product_launch', name: 'Product Launch', description: 'Dramatic reveal, anticipation, celebration', icon: 'Rocket' },
  { id: 'fitness_ad', name: 'Fitness Ad', description: 'High energy, dynamic movement, intense', icon: 'Dumbbell' },
  { id: 'travel_video', name: 'Travel Video', description: 'Breathtaking landscapes, adventure, wanderlust', icon: 'Plane' },
  { id: 'tech_commercial', name: 'Tech Commercial', description: 'Sleek, modern, minimal, futuristic', icon: 'Cpu' },
] as const;

export const CAMERA_MOVEMENTS = [
  { id: 'static', name: 'Static', description: 'Fixed camera, no movement' },
  { id: 'dolly_in', name: 'Dolly In', description: 'Camera moves closer to subject' },
  { id: 'dolly_out', name: 'Dolly Out', description: 'Camera moves away from subject' },
  { id: 'orbit', name: 'Orbit', description: 'Camera circles around subject' },
  { id: 'handheld', name: 'Handheld', description: 'Natural, slightly shaky movement' },
  { id: 'drone', name: 'Drone', description: 'Aerial perspective, sweeping movements' },
  { id: 'close_up', name: 'Close Up', description: 'Tight framing on subject detail' },
  { id: 'wide_shot', name: 'Wide Shot', description: 'Full scene visible, establishing shot' },
  { id: 'tracking_shot', name: 'Tracking Shot', description: 'Camera follows subject movement' },
  { id: 'slow_push_in', name: 'Slow Push In', description: 'Gradual, dramatic zoom toward subject' },
  { id: 'top_down', name: 'Top Down', description: 'Bird\'s eye view, overhead angle' },
  { id: 'pan_left', name: 'Pan Left', description: 'Camera swivels horizontally left' },
  { id: 'pan_right', name: 'Pan Right', description: 'Camera swivels horizontally right' },
  { id: 'tilt_up', name: 'Tilt Up', description: 'Camera tilts vertically upward' },
  { id: 'tilt_down', name: 'Tilt Down', description: 'Camera tilts vertically downward' },
] as const;

export const TRANSITIONS = [
  { id: 'cut', name: 'Cut', description: 'Instant switch between scenes' },
  { id: 'fade', name: 'Fade', description: 'Gradual opacity transition' },
  { id: 'whip_pan', name: 'Whip Pan', description: 'Fast camera pan transition' },
  { id: 'zoom', name: 'Zoom', description: 'Zoom in/out transition' },
  { id: 'match_cut', name: 'Match Cut', description: 'Visual similarity between scenes' },
  { id: 'cross_dissolve', name: 'Cross Dissolve', description: 'Blended transition between scenes' },
] as const;

export const TARGET_PLATFORMS = [
  { id: 'tiktok', name: 'TikTok', defaultRatio: '9:16' as const, maxDuration: 180, defaultFps: 30 },
  { id: 'instagram_reels', name: 'Instagram Reels', defaultRatio: '9:16' as const, maxDuration: 90, defaultFps: 30 },
  { id: 'youtube_shorts', name: 'YouTube Shorts', defaultRatio: '9:16' as const, maxDuration: 60, defaultFps: 30 },
  { id: 'youtube', name: 'YouTube', defaultRatio: '16:9' as const, maxDuration: 600, defaultFps: 30 },
  { id: 'instagram_feed', name: 'Instagram Feed', defaultRatio: '1:1' as const, maxDuration: 60, defaultFps: 30 },
  { id: 'instagram_story', name: 'Instagram Story', defaultRatio: '9:16' as const, maxDuration: 15, defaultFps: 30 },
  { id: 'facebook', name: 'Facebook', defaultRatio: '1:1' as const, maxDuration: 240, defaultFps: 30 },
  { id: 'linkedin', name: 'LinkedIn', defaultRatio: '16:9' as const, maxDuration: 600, defaultFps: 30 },
  { id: 'twitter', name: 'X (Twitter)', defaultRatio: '16:9' as const, maxDuration: 140, defaultFps: 30 },
  { id: 'website', name: 'Website', defaultRatio: '16:9' as const, maxDuration: 300, defaultFps: 30 },
  { id: 'custom', name: 'Custom', defaultRatio: '16:9' as const, maxDuration: 600, defaultFps: 30 },
] as const;

export const ASPECT_RATIOS = [
  { id: '9:16', label: '9:16 (Vertical)', width: 1080, height: 1920 },
  { id: '1:1', label: '1:1 (Square)', width: 1080, height: 1080 },
  { id: '16:9', label: '16:9 (Widescreen)', width: 1920, height: 1080 },
  { id: '4:5', label: '4:5 (Portrait)', width: 1080, height: 1350 },
  { id: 'custom', label: 'Custom', width: 1920, height: 1080 },
] as const;

export const VIDEO_TYPES = [
  { id: 'ad', name: 'Advertisement', icon: 'Megaphone', description: 'Promotional video for products or services' },
  { id: 'cinematic', name: 'Cinematic', icon: 'Film', description: 'Film-quality narrative video' },
  { id: 'reel', name: 'Social Reel', icon: 'Clapperboard', description: 'Short-form social media content' },
  { id: 'influencer', name: 'Influencer Style', icon: 'Star', description: 'Creator-style authentic content' },
  { id: 'product', name: 'Product Video', icon: 'Package', description: 'Product showcase and demo' },
  { id: 'storytelling', name: 'Storytelling', icon: 'BookOpen', description: 'Narrative-driven content' },
  { id: 'app_promo', name: 'App Promo', icon: 'Smartphone', description: 'Mobile app showcase' },
  { id: 'motivational', name: 'Motivational', icon: 'Flame', description: 'Inspirational and empowering content' },
  { id: 'ugc', name: 'UGC Style', icon: 'Users', description: 'User-generated content feel' },
  { id: 'creative_concept', name: 'Creative Concept', icon: 'Lightbulb', description: 'Experimental and artistic video' },
] as const;

export const EXPORT_PRESETS: ExportPresetConfig[] = [
  { id: 'tiktok', name: 'TikTok / Reels / Shorts', platform: 'tiktok', aspectRatio: '9:16', resolution: '1080x1920', fps: 30, maxDuration: 180, format: 'mp4', quality: 'high' },
  { id: 'youtube', name: 'YouTube', platform: 'youtube', aspectRatio: '16:9', resolution: '1920x1080', fps: 30, maxDuration: 600, format: 'mp4', quality: 'high' },
  { id: 'instagram_feed', name: 'Instagram Feed', platform: 'instagram_feed', aspectRatio: '1:1', resolution: '1080x1080', fps: 30, maxDuration: 60, format: 'mp4', quality: 'high' },
  { id: 'instagram_story', name: 'Instagram Story', platform: 'instagram_story', aspectRatio: '9:16', resolution: '1080x1920', fps: 30, maxDuration: 15, format: 'mp4', quality: 'medium' },
  { id: 'ads', name: 'Ad Creative', platform: 'facebook', aspectRatio: '1:1', resolution: '1080x1080', fps: 30, maxDuration: 30, format: 'mp4', quality: 'high' },
  { id: 'cinematic', name: 'Cinematic Widescreen', platform: 'website', aspectRatio: '16:9', resolution: '3840x2160', fps: 24, maxDuration: 300, format: 'mp4', quality: 'ultra' },
  { id: 'square', name: 'Square Post', platform: 'instagram_feed', aspectRatio: '1:1', resolution: '1080x1080', fps: 30, maxDuration: 60, format: 'mp4', quality: 'high' },
];

import type { ExportPreset } from '../types';

interface ExportPresetConfig extends ExportPreset {
  id: string;
  name: string;
}

export const QWEN_MODELS = [
  { id: 'qwen-max', name: 'Qwen Max', description: 'Best planning/director reasoning', maxTokens: 32768, task: 'text' },
  { id: 'qwen-plus', name: 'Qwen Plus', description: 'Reliable balanced planning', maxTokens: 32768, task: 'text' },
  { id: 'qwen-turbo', name: 'Qwen Turbo', description: 'Fast low-cost planning', maxTokens: 8192, task: 'text' },
  { id: 'qwen-vl-max', name: 'Qwen VL Max', description: 'Best visual understanding/review', maxTokens: 8192, task: 'vision' },
  { id: 'qwen-vl-plus', name: 'Qwen VL Plus', description: 'Balanced visual understanding', maxTokens: 8192, task: 'vision' },
  { id: 'qwen-image-plus', name: 'Qwen Image Plus', description: 'Best image generation and prompt adherence', maxTokens: 0, task: 'image' },
  { id: 'qwen-image', name: 'Qwen Image', description: 'Balanced image generation', maxTokens: 0, task: 'image' },
  { id: 'wan2.1-i2v-plus', name: 'Wan 2.1 I2V Plus', description: 'Best image-to-video generation', maxTokens: 0, task: 'video' },
  { id: 'wan2.1-i2v-turbo', name: 'Wan 2.1 I2V Turbo', description: 'Faster image-to-video generation', maxTokens: 0, task: 'video' },
] as const;

export const GENERATION_MODEL_PRESETS = {
  low: {
    effort: 'low' as const,
    plannerModel: 'qwen-turbo',
    imageModel: 'qwen-image',
    frameModel: 'qwen-image',
    videoModel: 'wan2.1-i2v-turbo',
    directorModel: 'qwen-vl-plus',
  },
  medium: {
    effort: 'medium' as const,
    plannerModel: 'qwen-plus',
    imageModel: 'qwen-image',
    frameModel: 'qwen-image',
    videoModel: 'wan2.1-i2v-turbo',
    directorModel: 'qwen-vl-max',
  },
  high: {
    effort: 'high' as const,
    plannerModel: 'qwen-max',
    imageModel: 'qwen-image-plus',
    frameModel: 'qwen-image-plus',
    videoModel: 'wan2.1-i2v-plus',
    directorModel: 'qwen-vl-max',
  },
};

export const DEFAULT_GENERATION_MODELS = GENERATION_MODEL_PRESETS.high;

export const DEFAULT_AGENT_CONFIGS = {
  chat_planner: {
    id: 'chat_planner' as const,
    name: 'Chat Planner',
    description: 'Helps plan and refine video ideas through conversation',
    modelId: 'qwen-max',
    temperature: 0.7,
    maxTokens: 4096,
    systemPrompt: 'You are an expert video production planner. Help users develop their video ideas by asking insightful questions and suggesting creative directions. Focus on understanding the user\'s goals, target audience, and creative vision.',
    enabled: true,
  },
  prompt_enhancer: {
    id: 'prompt_enhancer' as const,
    name: 'Prompt Enhancer',
    description: 'Enhances and optimizes video generation prompts',
    modelId: 'qwen-max',
    temperature: 0.6,
    maxTokens: 2048,
    systemPrompt: 'You are a prompt engineering expert specializing in video generation. Enhance prompts to be more descriptive, cinematic, and effective for AI video generation.',
    enabled: true,
  },
  storyboard_writer: {
    id: 'storyboard_writer' as const,
    name: 'Storyboard Writer',
    description: 'Converts ideas into structured video plans',
    modelId: 'qwen-max',
    temperature: 0.7,
    maxTokens: 8192,
    systemPrompt: 'You are a professional storyboard artist and scriptwriter. Create detailed scene-by-scene video plans with visual direction, narration, camera movements, and timing.',
    enabled: true,
  },
  scene_generator: {
    id: 'scene_generator' as const,
    name: 'Scene Generator',
    description: 'Generates individual scene content',
    modelId: 'qwen-max',
    temperature: 0.8,
    maxTokens: 4096,
    systemPrompt: 'You are a scene generation specialist. Create detailed scene descriptions optimized for AI video generation.',
    enabled: true,
  },
  image_generator: {
    id: 'image_generator' as const,
    name: 'Image Generator',
    description: 'Generates frames and reference images',
    modelId: 'qwen-max',
    temperature: 0.7,
    maxTokens: 2048,
    systemPrompt: 'You prepare image generation prompts for start/end frames and reference images.',
    enabled: true,
  },
  frame_generator: {
    id: 'frame_generator' as const,
    name: 'Frame Generator',
    description: 'Generates start and end frames for video scenes',
    modelId: 'qwen-max',
    temperature: 0.6,
    maxTokens: 2048,
    systemPrompt: 'You generate detailed frame descriptions for video start and end points, ensuring visual continuity.',
    enabled: true,
  },
  video_generator: {
    id: 'video_generator' as const,
    name: 'Video Generator',
    description: 'Generates video clips from frames and prompts',
    modelId: 'qwen-max',
    temperature: 0.5,
    maxTokens: 4096,
    systemPrompt: 'You prepare video generation parameters and prompts for each scene.',
    enabled: true,
  },
  voiceover_agent: {
    id: 'voiceover_agent' as const,
    name: 'Voiceover Agent',
    description: 'Generates narration scripts and voiceover text',
    modelId: 'qwen-max',
    temperature: 0.6,
    maxTokens: 4096,
    systemPrompt: 'You write compelling voiceover and narration scripts for videos. Match tone to the video style and target audience.',
    enabled: true,
  },
  caption_agent: {
    id: 'caption_agent' as const,
    name: 'Caption Agent',
    description: 'Generates captions and text overlays',
    modelId: 'qwen-max',
    temperature: 0.5,
    maxTokens: 2048,
    systemPrompt: 'You create engaging captions, subtitles, and text overlays for video content. Keep text concise and impactful.',
    enabled: true,
  },
  ai_director: {
    id: 'ai_director' as const,
    name: 'AI Director',
    description: 'Reviews and provides quality feedback',
    modelId: 'qwen-max',
    temperature: 0.3,
    maxTokens: 4096,
    systemPrompt: 'You are an experienced film director and video producer. Review storyboards, prompts, and generated content. Provide constructive feedback on pacing, visual consistency, storytelling, and overall quality.',
    enabled: true,
  },
  video_assembler: {
    id: 'video_assembler' as const,
    name: 'Video Assembler',
    description: 'Assembles final video from generated clips',
    modelId: 'qwen-max',
    temperature: 0.3,
    maxTokens: 4096,
    systemPrompt: 'You manage the final video assembly process, ensuring smooth transitions, proper timing, and professional output.',
    enabled: true,
  },
  hook_generator: {
    id: 'hook_generator' as const,
    name: 'Hook Generator',
    description: 'Creates compelling video hooks and openings',
    modelId: 'qwen-max',
    temperature: 0.9,
    maxTokens: 2048,
    systemPrompt: 'You are a viral content strategist. Create powerful hooks and opening concepts that grab attention in the first 3 seconds. Focus on patterns that work for short-form video.',
    enabled: true,
  },
};

export const DEFAULT_COST_CONTROLS = {
  maxParallelGenerations: 3,
  maxDuration: 300,
  maxRetries: 3,
  maxOutputQuality: 'high' as const,
  maxScenes: 20,
  maxVersions: 5,
};

export const DEFAULT_SCENE_PROMPT_TEMPLATE = `Create a {{duration}} video in {{aspectRatio}}.

Scene:
{{sceneDescription}}

Action:
{{actionDescription}}

Camera:
{{cameraMovement}}

Visual style:
{{visualStyle}}

Lighting:
{{lighting}}

Details:
{{details}}

Avoid:
{{avoid}}`;

export const PROMPT_TEMPLATE_VARIABLES = [
  { token: '{{duration}}', label: 'Duration (e.g. 7s)' },
  { token: '{{aspectRatio}}', label: 'Aspect ratio (e.g. 9:16)' },
  { token: '{{sceneDescription}}', label: 'Scene — subject, location, mood' },
  { token: '{{actionDescription}}', label: 'Action — movement / change' },
  { token: '{{cameraMovement}}', label: 'Camera movement' },
  { token: '{{visualStyle}}', label: 'Visual style' },
  { token: '{{lighting}}', label: 'Lighting' },
  { token: '{{details}}', label: 'Details — textures, colors, atmosphere' },
  { token: '{{avoid}}', label: 'Avoid — negative prompts' },
] as const;
