'use client';

import { useSettingsStore } from '@/features/settings/store';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sun, Moon, Monitor, Bot, Download, Shield, RotateCcw } from 'lucide-react';
import { QWEN_MODELS, DEFAULT_AGENT_CONFIGS, DEFAULT_COST_CONTROLS, EXPORT_PRESETS } from '@/core/config';
import type { AgentType } from '@/core/types';

const AGENT_INFO: { type: AgentType; icon: string; category: string }[] = [
  { type: 'chat_planner', icon: '💬', category: 'Planning' },
  { type: 'prompt_enhancer', icon: '✨', category: 'Planning' },
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

export function SettingsView() {
  const { settings, getAgentConfig, updateAgentConfig, updateCostControls, setTheme } = useSettingsStore();

  return (
    <ScrollArea className="h-full">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div>
          <h2 className="text-xl font-bold">Settings</h2>
          <p className="text-sm text-muted-foreground">Configure your VideoForge experience</p>
        </div>

        <Tabs defaultValue="agents" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="agents" className="gap-1.5 text-xs">
              <Bot className="w-3.5 h-3.5" /> Agents
            </TabsTrigger>
            <TabsTrigger value="export" className="gap-1.5 text-xs">
              <Download className="w-3.5 h-3.5" /> Export
            </TabsTrigger>
            <TabsTrigger value="limits" className="gap-1.5 text-xs">
              <Shield className="w-3.5 h-3.5" /> Controls
            </TabsTrigger>
            <TabsTrigger value="appearance" className="gap-1.5 text-xs">
              <Sun className="w-3.5 h-3.5" /> Appearance
            </TabsTrigger>
          </TabsList>

          {/* Agents Tab */}
          <TabsContent value="agents" className="space-y-3">
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
                    <div className="grid grid-cols-3 gap-4">
                      <div>
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
                      <div>
                        <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                          Temperature: {config.temperature}
                        </Label>
                        <Slider
                          className="mt-3"
                          value={[config.temperature]}
                          onValueChange={([v]) => updateAgentConfig(type, { temperature: v })}
                          min={0}
                          max={2}
                          step={0.1}
                        />
                      </div>
                      <div>
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
          </TabsContent>

          {/* Export Tab */}
          <TabsContent value="export" className="space-y-3">
            <p className="text-sm text-muted-foreground">Manage export presets for different platforms and use cases.</p>
            <div className="grid gap-3">
              {settings.exportPresets.map((preset) => (
                <Card key={preset.id} className="border-border/50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium">{preset.name}</div>
                        <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-3">
                          <span>{preset.aspectRatio}</span>
                          <span>{preset.resolution}</span>
                          <span>{preset.fps}fps</span>
                          <span>max {preset.maxDuration}s</span>
                          <Badge variant="outline" className="text-[10px]">{preset.quality}</Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Cost Controls Tab */}
          <TabsContent value="limits" className="space-y-4">
            <p className="text-sm text-muted-foreground">Set limits to avoid accidental API overuse.</p>
            <Card>
              <CardContent className="p-4 space-y-5">
                <div>
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Max Parallel Generations
                  </Label>
                  <div className="flex items-center gap-3 mt-1">
                    <Slider
                      className="flex-1"
                      value={[settings.costControls.maxParallelGenerations]}
                      onValueChange={([v]) => updateCostControls({ maxParallelGenerations: v })}
                      min={1}
                      max={10}
                      step={1}
                    />
                    <span className="text-sm font-medium w-6 text-right">{settings.costControls.maxParallelGenerations}</span>
                  </div>
                </div>
                <div>
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Max Duration (seconds)
                  </Label>
                  <Input
                    type="number"
                    className="mt-1 h-8"
                    value={settings.costControls.maxDuration}
                    onChange={(e) => updateCostControls({ maxDuration: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Max Retries
                  </Label>
                  <Input
                    type="number"
                    className="mt-1 h-8"
                    value={settings.costControls.maxRetries}
                    onChange={(e) => updateCostControls({ maxRetries: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Max Scenes
                  </Label>
                  <Input
                    type="number"
                    className="mt-1 h-8"
                    value={settings.costControls.maxScenes}
                    onChange={(e) => updateCostControls({ maxScenes: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Max Versions Per Scene
                  </Label>
                  <Input
                    type="number"
                    className="mt-1 h-8"
                    value={settings.costControls.maxVersions}
                    onChange={(e) => updateCostControls({ maxVersions: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Max Output Quality
                  </Label>
                  <Select
                    value={settings.costControls.maxOutputQuality}
                    onValueChange={(v: any) => updateCostControls({ maxOutputQuality: v })}
                  >
                    <SelectTrigger className="mt-1 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="ultra">Ultra (4K)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appearance Tab */}
          <TabsContent value="appearance" className="space-y-4">
            <p className="text-sm text-muted-foreground">Customize the look and feel.</p>
            <Card>
              <CardContent className="p-4 space-y-4">
                <div>
                  <Label className="text-sm font-medium">Theme</Label>
                  <div className="flex gap-2 mt-2">
                    {[
                      { id: 'light' as const, icon: Sun, label: 'Light' },
                      { id: 'dark' as const, icon: Moon, label: 'Dark' },
                      { id: 'system' as const, icon: Monitor, label: 'System' },
                    ].map((theme) => (
                      <button
                        key={theme.id}
                        onClick={() => setTheme(theme.id)}
                        className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border transition-all ${
                          settings.theme === theme.id
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border hover:border-primary/30'
                        }`}
                      >
                        <theme.icon className="w-4 h-4" />
                        <span className="text-sm">{theme.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ScrollArea>
  );
}