import { NextRequest, NextResponse } from 'next/server';

// Mock AI chat endpoint - structured for real Qwen API later
export async function POST(req: NextRequest) {
  try {
    const { messages, projectId, agentType } = await req.json();

    const lastUserMessage = messages
      ?.filter((m: { role: string }) => m.role === 'user')
      .pop()?.content || '';

    // Mock response - in production, this calls Qwen API
    const response = generateMockResponse(lastUserMessage, agentType, messages?.length || 0);

    return NextResponse.json({
      content: response.content,
      generativeUI: response.generativeUI,
      metadata: { model: 'mock', tokens: 150 },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

function generateMockResponse(
  userMessage: string,
  _agentType?: string,
  messageCount?: number
) {
  const lowerMsg = userMessage.toLowerCase();

  // First message - welcome and ask questions
  if (messageCount !== undefined && messageCount <= 1) {
    return {
      content: `Great! I'd love to help you create this video. Let me ask a few questions to make sure we nail the creative direction:

**1. Target Platform & Format**
Where will this video be published? (TikTok, Instagram Reels, YouTube Shorts, etc.)

**2. Video Length**
How long should the video be? (Short 15-30s, Medium 30-60s, Long 1-3min)

**3. Visual Style**
What kind of visual style are you going for? (Cinematic, UGC/Influencer, Luxury, Documentary, etc.)

**4. Audience**
Who is your target audience?

Take your time answering — or if you have a clear vision already, just tell me everything and I'll build the plan!`,
      generativeUI: [
        { type: 'style_selector', data: { options: ['cinematic', 'luxury_ad', 'ugc_influencer', 'realistic_product', 'anime', 'dark_scifi', 'documentary', 'fashion_campaign', 'motivational_reel', 'tech_commercial'] } },
        { type: 'platform_selector', data: { options: ['tiktok', 'instagram_reels', 'youtube_shorts', 'youtube', 'instagram_feed', 'instagram_story'] } },
      ],
    };
  }

  // If user mentions creating a brief
  if (lowerMsg.includes('brief') || lowerMsg.includes('plan') || lowerMsg.includes('ready')) {
    return {
      content: `I've analyzed your input and I'm ready to create a structured video brief. Here's what I've put together based on our conversation. You can adjust any of these parameters:

📋 **Video Brief Draft**

The brief below captures the key parameters for your video. Review and adjust as needed, then we can move on to creating the storyboard and scene breakdown.`,
      generativeUI: [
        {
          type: 'video_brief_form',
          data: {
            title: 'AI-Generated Video',
            description: 'An engaging short-form video based on our discussion',
            videoType: 'ad',
            targetPlatform: 'tiktok',
            aspectRatio: '9:16',
            duration: 30,
            style: 'cinematic',
            mood: 'Energetic and professional',
            numberOfScenes: 4,
            sceneDuration: 7,
            fps: 30,
            resolution: '1080x1920',
            outputFormat: 'mp4',
            captions: true,
          },
        },
      ],
    };
  }

  // If user mentions storyboard or scenes
  if (lowerMsg.includes('storyboard') || lowerMsg.includes('scene') || lowerMsg.includes('script')) {
    return {
      content: `Excellent! I've created a detailed storyboard with scene breakdowns. Each scene includes visual direction, camera movement, narration, and timing. You can edit any scene, rearrange them, or let me refine specific ones.

🎬 **Storyboard Ready — 4 Scenes**

Here's the scene breakdown. You can now switch to the **Workflow Editor** to fine-tune each scene, or switch to the **Timeline** view to see the full video structure.`,
      generativeUI: [
        {
          type: 'scene_suggestion',
          data: [
            {
              id: 'scene-1', order: 0, title: 'Hook — The Problem',
              prompt: 'Dramatic close-up of a frustrated person looking at their phone, soft cinematic lighting, shallow depth of field, moody color grade, professional studio setup',
              startTime: 0, endTime: 5, duration: 5, cameraMovement: 'slow_push_in',
              mood: 'Tense, relatable', characters: [], props: ['smartphone'],
              transition: 'fade', textOverlays: [], stylePreset: 'cinematic', status: 'idle', versions: [],
              narration: 'We\'ve all been there... staring at a screen, feeling stuck.',
            },
            {
              id: 'scene-2', order: 1, title: 'Introduction — The Solution',
              prompt: 'Dynamic wide shot revealing a modern, well-lit workspace with the product in focus, bright optimistic color grade, smooth camera movement, premium product photography style',
              startTime: 5, endTime: 12, duration: 7, cameraMovement: 'dolly_in',
              mood: 'Hopeful, exciting', characters: [], props: ['product', 'workspace'],
              transition: 'whip_pan', textOverlays: [], stylePreset: 'realistic_product', status: 'idle', versions: [],
              narration: 'But what if there was a better way?',
            },
            {
              id: 'scene-3', order: 2, title: 'Features — Show, Don\'t Tell',
              prompt: 'Close-up product showcase with dynamic angles, sleek and modern styling, dramatic lighting highlighting product features, macro shots of key details, premium commercial quality',
              startTime: 12, endTime: 22, duration: 10, cameraMovement: 'orbit',
              mood: 'Premium, impressive', characters: [], props: ['product', 'feature highlights'],
              transition: 'match_cut', textOverlays: [], stylePreset: 'luxury_ad', status: 'idle', versions: [],
              narration: 'Discover features that actually make a difference.',
            },
            {
              id: 'scene-4', order: 3, title: 'CTA — Take Action',
              prompt: 'Confident person using the product successfully, warm and inviting lighting, genuine smile, modern lifestyle setting, aspirational but achievable feel, brand colors subtly integrated',
              startTime: 22, endTime: 30, duration: 8, cameraMovement: 'tracking_shot',
              mood: 'Empowering, conclusive', characters: [], props: ['product'],
              transition: 'fade', textOverlays: [], stylePreset: 'ugc_influencer', status: 'idle', versions: [],
              narration: 'Start your journey today. The link is in the bio.',
              cta: 'Shop Now →',
            },
          ],
        },
      ],
    };
  }

  // If user asks about hooks
  if (lowerMsg.includes('hook') || lowerMsg.includes('opening')) {
    return {
      content: `Here are 5 powerful hook ideas for the opening of your video. These are designed to grab attention in the first 2-3 seconds:

🎣 **Hook Options**

Choose your favorite, or I can generate more variations!`,
      generativeUI: [
        {
          type: 'hook_suggestions',
          data: {
            hooks: [
              { id: 'h1', text: '"Stop scrolling — this changed everything for me."', style: 'hook_question', estimatedRetention: 92 },
              { id: 'h2', text: '"I spent 6 months building this. Here\'s what happened."', style: 'story_open', estimatedRetention: 88 },
              { id: 'h3', text: '"97% of people get this wrong. Are you one of them?"', style: 'shocking_stat', estimatedRetention: 95 },
              { id: 'h4', text: '"POV: You finally found the solution you\'ve been looking for."', style: 'problem_agitate', estimatedRetention: 85 },
              { id: 'h5', text: '"This is the secret nobody talks about..."', style: 'curiosity_gap', estimatedRetention: 90 },
            ],
          },
        },
      ],
    };
  }

  // If user asks for review
  if (lowerMsg.includes('review') || lowerMsg.includes('director') || lowerMsg.includes('feedback')) {
    return {
      content: `🎬 **AI Director's Review**

Here's my assessment of your current video plan:`,
      generativeUI: [
        {
          type: 'director_review',
          data: {
            overallScore: 78,
            pacing: 'Good overall pacing, but Scene 3 could be tighter.',
            visualConsistency: 'Strong consistency between scenes.',
            characterConsistency: 'N/A — No characters defined yet.',
            productConsistency: 'Product placement looks consistent.',
            ctaAssessment: 'CTA is present but could be more compelling.',
            weakScenes: [2],
            suggestions: [
              'Add a character to improve brand relatability',
              'Consider adding text overlays in Scene 1',
              'Scene 3 duration may cause drop-off — try 7-8 seconds',
              'Add sound design notes for transitions',
              'Strengthen the CTA with urgency or social proof',
            ],
            styleMatch: 'The shift from cinematic to luxury to UGC works well.',
            transitionQuality: 'Transitions are well-chosen. Good energy.',
            overallQuality: 'Solid foundation. Focus on tightening Scene 3 and strengthening the CTA.',
          },
        },
      ],
    };
  }

  // Default response
  return {
    content: `That's a great point! Let me think about this...

Based on what you've shared, here are my thoughts:

1. **Creative Direction**: I can see the vision forming — we're building toward something compelling here.
2. **Next Steps**: Would you like me to create a formal video brief, or should we keep brainstorming?

You can also:
- 📋 Generate a **Video Brief** from our conversation
- 🎬 Create a **Storyboard** with scene breakdowns
- 🎣 Get **Hook Ideas** for the opening
- 🎥 Move to the **Workflow Editor** to start building

Just tell me what you'd like to do next!`,
  };
}