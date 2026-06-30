'use client';

import { useMemo, useState } from 'react';
import { useProjectStore } from '@/features/project/store';
import { useWorkflowStore } from '@/features/workflow';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BarChart3, Boxes, Coins, Film, Image, Sparkles, type LucideIcon } from 'lucide-react';
import type { Scene, UsageEvent } from '@/core/types';

const MODEL_FILTERS = ['all', 'qwen-max', 'qwen-image-plus', 'wan2.1-i2v-plus', 'qwen-vl-max'];
const TYPE_FILTERS = ['all', 'planning', 'image', 'frame', 'video', 'review', 'export', 'asset_save'];

function estimateSceneUsage(projectId: string, scenes: Record<string, Scene>): UsageEvent[] {
  return Object.values(scenes).flatMap((scene) => {
    const events: UsageEvent[] = [];
    if (scene.frameGenerationStatus === 'generated') {
      events.push({
        id: `usage-frame-${scene.id}`,
        projectId,
        sceneId: scene.id,
        model: scene.frameGenerationModel || 'qwen-image-plus',
        generationType: 'frame',
        action: 'Generated start/end frames',
        assetType: 'image',
        credits: 2,
        status: 'completed',
        createdAt: scene.versions[0]?.createdAt || new Date().toISOString(),
      });
    }
    if (scene.generatedVideoUrl) {
      events.push({
        id: `usage-video-${scene.id}`,
        projectId,
        sceneId: scene.id,
        model: 'wan2.1-i2v-plus',
        generationType: 'video',
        action: 'Generated scene video',
        assetType: 'final_video',
        credits: Math.max(1, Math.ceil(scene.duration / 5)),
        status: 'completed',
        createdAt: scene.versions.at(-1)?.createdAt || new Date().toISOString(),
      });
    }
    return events;
  });
}

export function UsageView() {
  const { projects, currentProjectId, getCurrentProject } = useProjectStore();
  const sceneMap = useWorkflowStore((s) => s.sceneMap);
  const currentProject = getCurrentProject();
  const [projectFilter, setProjectFilter] = useState(currentProjectId || 'all');
  const [modelFilter, setModelFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  const events = useMemo(() => {
    const stored = projects.flatMap((project) => project.usageEvents ?? []);
    const estimated = currentProjectId ? estimateSceneUsage(currentProjectId, sceneMap) : [];
    return [...stored, ...estimated];
  }, [projects, currentProjectId, sceneMap]);

  const filtered = events.filter((event) => {
    if (projectFilter !== 'all' && event.projectId !== projectFilter) return false;
    if (modelFilter !== 'all' && event.model !== modelFilter) return false;
    if (typeFilter !== 'all' && event.generationType !== typeFilter) return false;
    if (dateFilter !== 'all') {
      const created = new Date(event.createdAt).getTime();
      const ageDays = (Date.now() - created) / 86400000;
      if (dateFilter === '7d' && ageDays > 7) return false;
      if (dateFilter === '30d' && ageDays > 30) return false;
    }
    return true;
  });

  const totalTokens = filtered.reduce((sum, event) => sum + (event.tokens ?? 0), 0);
  const totalCredits = filtered.reduce((sum, event) => sum + (event.credits ?? 0), 0);
  const videoCredits = filtered.filter((event) => event.generationType === 'video').reduce((sum, event) => sum + (event.credits ?? 0), 0);
  const assetCredits = filtered.filter((event) => event.generationType === 'image' || event.generationType === 'frame').reduce((sum, event) => sum + (event.credits ?? 0), 0);

  const byModel = Object.entries(filtered.reduce<Record<string, number>>((acc, event) => {
    acc[event.model] = (acc[event.model] ?? 0) + (event.credits ?? 0);
    return acc;
  }, {})).sort((a, b) => b[1] - a[1]);

  return (
    <div className="h-full overflow-auto bg-background">
      <div className="border-b border-border px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold">Usage</h1>
            <p className="text-xs text-muted-foreground">Project, scene, model, asset, token, and credit tracking.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Select value={projectFilter} onValueChange={setProjectFilter}>
              <SelectTrigger className="h-8 w-[150px] text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All projects</SelectItem>
                {projects.map((project) => <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="h-8 w-[120px] text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All dates</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
              </SelectContent>
            </Select>
            <Select value={modelFilter} onValueChange={setModelFilter}>
              <SelectTrigger className="h-8 w-[150px] text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {MODEL_FILTERS.map((model) => <SelectItem key={model} value={model}>{model === 'all' ? 'All models' : model}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="h-8 w-[150px] text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {TYPE_FILTERS.map((type) => <SelectItem key={type} value={type}>{type === 'all' ? 'All actions' : type.replace(/_/g, ' ')}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <UsageStat icon={Coins} label="Credits" value={totalCredits.toFixed(1)} />
          <UsageStat icon={Sparkles} label="Tokens" value={totalTokens.toLocaleString()} />
          <UsageStat icon={Film} label="Video credits" value={videoCredits.toFixed(1)} />
          <UsageStat icon={Image} label="Asset/frame credits" value={assetCredits.toFixed(1)} />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="w-4 h-4" /> Usage Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {filtered.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                    No tracked usage for the selected filters yet.
                  </div>
                ) : filtered.map((event) => {
                  const project = projects.find((p) => p.id === event.projectId);
                  const scene = event.sceneId ? sceneMap[event.sceneId] : undefined;
                  return (
                    <div key={event.id} className="grid grid-cols-[1fr_auto] gap-3 rounded-lg border border-border bg-card/60 p-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium">{event.action}</span>
                          <Badge variant="outline" className="h-5 text-[10px]">{event.generationType.replace(/_/g, ' ')}</Badge>
                          <Badge variant="secondary" className="h-5 text-[10px]">{event.model}</Badge>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {project?.name || 'Unknown project'}{scene ? ` · ${scene.title}` : ''} · {new Date(event.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right text-xs">
                        <div className="font-semibold">{(event.credits ?? 0).toFixed(1)} credits</div>
                        <div className="text-muted-foreground">{event.tokens ? `${event.tokens.toLocaleString()} tokens` : event.status}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2"><Boxes className="w-4 h-4" /> By Model</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {byModel.length === 0 ? (
                <p className="text-xs text-muted-foreground">No model usage yet.</p>
              ) : byModel.map(([model, credits]) => {
                const pct = totalCredits > 0 ? Math.round((credits / totalCredits) * 100) : 0;
                return (
                  <div key={model} className="space-y-1">
                    <div className="flex justify-between gap-2 text-xs">
                      <span className="truncate">{model}</span>
                      <span className="text-muted-foreground">{credits.toFixed(1)} credits</span>
                    </div>
                    <Progress value={pct} className="h-1.5" />
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function UsageStat({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <div className="text-lg font-semibold leading-none">{value}</div>
          <div className="mt-1 text-xs text-muted-foreground">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}
