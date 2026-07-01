'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { RotateCcw } from 'lucide-react';
import { DEFAULT_AGENT_CONFIGS, QWEN_MODELS } from '@/core/config';
import { useSettingsStore } from '@/features/settings/store';
import type { AgentType } from '@/core/types';

const AGENT_INFO: { type: AgentType; icon: string; category: string }[] = [
  { type: 'chat_planner', icon: '💬', category: 'Planning' },
  { type: 'prompt_enhancer', icon: '✨', category: 'Enhancement' },
  { type: 'storyboard_writer', icon: '🎬', category: 'Planning' },
  { type: 'hook_generator', icon: '🎣', category: 'Planning' },
  { type: 'image_generator', icon: '🖼️', category: 'Generation' },
  { type: 'frame_generator', icon: '🎞️', category: 'Generation' },
  { type: 'scene_generator', icon: '🎬', category: 'Generation' },
  { type: 'video_generator', icon: '🎥', category: 'Generation' },
  { type: 'voiceover_agent', icon: '🎤', category: 'Audio' },
  { type: 'caption_agent', icon: '💬', category: 'Audio' },
  { type: 'ai_director', icon: '🎬', category: 'Review' },
  { type: 'video_assembler', icon: '🔧', category: 'Assembly' },
];

function RouteModel({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-card/60 p-2">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 font-medium">{value}</div>
    </div>
  );
}

export function AgentsTab() {
  const generationModels = useSettingsStore((s) => s.settings.generationModels);
  const getAgentConfig = useSettingsStore((s) => s.getAgentConfig);
  const updateAgentConfig = useSettingsStore((s) => s.updateAgentConfig);
  const setGenerationEffort = useSettingsStore((s) => s.setGenerationEffort);

  return (
    <>
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Generation Model Routing</CardTitle>
          <CardDescription className="text-xs">
            Fixed task-specific Qwen routing for reliable output. Change effort, not individual model IDs.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="max-w-xs">
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Effort</Label>
            <Select value={generationModels.effort} onValueChange={(v) => setGenerationEffort(v as typeof generationModels.effort)}>
              <SelectTrigger className="mt-1 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high">High — best quality</SelectItem>
                <SelectItem value="medium">Medium — balanced</SelectItem>
                <SelectItem value="low">Low — faster/lower cost</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-2 text-xs">
            <RouteModel label="Planning" value={generationModels.plannerModel} />
            <RouteModel label="Images" value={generationModels.imageModel} />
            <RouteModel label="Frames" value={generationModels.frameModel} />
            <RouteModel label="Video" value={generationModels.videoModel} />
            <RouteModel label="Motion" value={generationModels.motionControlModel} />
            <RouteModel label="Review" value={generationModels.directorModel} />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Configure which AI model each agent uses. Select the Qwen Cloud model that best fits each task.</p>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => {
          Object.keys(DEFAULT_AGENT_CONFIGS).forEach(key => {
            updateAgentConfig(key as AgentType, DEFAULT_AGENT_CONFIGS[key as AgentType]);
          });
        }}>
          <RotateCcw className="w-3 h-3" /> Reset Defaults
        </Button>
      </div>

      {AGENT_INFO.map(({ type, icon, category }) => {
        const config = getAgentConfig(type);
        return (
          <Card key={type} className="border-border/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <span>{icon}</span> {config.name}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px]">{category}</Badge>
                  <Switch
                    checked={config.enabled}
                    onCheckedChange={(v) => updateAgentConfig(type, { enabled: v })}
                  />
                </div>
              </div>
              <CardDescription className="text-xs">{config.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr_0.8fr] gap-4">
                <div className="min-w-0">
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Model</Label>
                  <Select
                    value={config.modelId}
                    onValueChange={(v) => updateAgentConfig(type, { modelId: v })}
                  >
                    <SelectTrigger className="mt-1 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {QWEN_MODELS.map(m => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.name}
                          <span className="ml-1.5 text-muted-foreground text-[10px]">({m.description})</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="min-w-0">
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Temperature: {config.temperature}
                  </Label>
                  <div className="mt-3 h-8 flex items-center">
                    <Slider
                      className="w-full"
                      value={[config.temperature]}
                      onValueChange={([v]) => updateAgentConfig(type, { temperature: v })}
                      min={0}
                      max={2}
                      step={0.1}
                    />
                  </div>
                </div>
                <div className="min-w-0">
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Max Tokens</Label>
                  <Input
                    type="number"
                    className="mt-1 h-8 text-xs"
                    value={config.maxTokens}
                    onChange={(e) => updateAgentConfig(type, { maxTokens: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="mt-3">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">System Prompt</Label>
                <Textarea
                  className="mt-1 text-xs"
                  value={config.systemPrompt}
                  onChange={(e) => updateAgentConfig(type, { systemPrompt: e.target.value })}
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </>
  );
}
