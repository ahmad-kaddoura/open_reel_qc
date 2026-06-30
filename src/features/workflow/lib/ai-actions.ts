import { Sparkles, Film, Camera, Eye, Zap, Wand2, type LucideIcon } from 'lucide-react';

export type AIAction = {
  label: string;
  icon: LucideIcon;
  prompt: string;
};

export const AI_ACTIONS: AIAction[] = [
  { label: 'Improve Prompt', icon: Sparkles, prompt: 'improve' },
  { label: 'Make Cinematic', icon: Film, prompt: 'cinematic' },
  { label: 'Make Realistic', icon: Eye, prompt: 'realistic' },
  { label: 'Make More Viral', icon: Zap, prompt: 'viral' },
  { label: 'Improve Camera', icon: Camera, prompt: 'camera' },
  { label: 'Simplify', icon: Wand2, prompt: 'simplify' },
];
