'use client';

import { useProjectStore } from '@/features/project/store';
import { useWorkflowStore } from '@/features/workflow';
import { useSettingsStore } from '@/features/settings/store';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { StatusBadge } from '@/shared/ui/status-badge';
import { Download, CheckCircle2, AlertTriangle, Clock, FileVideo, Settings, ArrowLeft } from 'lucide-react';
import { useState } from 'react';

export function ExportView() {
  const { getCurrentProject, setPhase } = useProjectStore();
  const { getScenes, getTotalDuration } = useWorkflowStore();
  const settings = useSettingsStore((s) => s.settings);
  const project = getCurrentProject();
  const scenes = getScenes();
  const totalDuration = getTotalDuration();
  const [selectedPreset, setSelectedPreset] = useState(settings.exportPresets[0]?.id || 'tiktok');
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  const preset = settings.exportPresets.find(p => p.id === selectedPreset);
  const completedScenes = scenes.filter(s => s.status === 'completed').length;
  const allCompleted = scenes.length > 0 && completedScenes === scenes.length;
  const hasIssues = scenes.some(s => s.status === 'failed');

  const handleExport = () => {
    setIsExporting(true);
    setExportProgress(0);
    const interval = setInterval(() => {
      setExportProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsExporting(false);
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 500);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-6 py-3 border-b border-border">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setPhase('timeline')} className="gap-1.5">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Timeline
          </Button>
          <div>
            <h2 className="text-lg font-semibold">Export</h2>
            <p className="text-xs text-muted-foreground">Final quality check and video export</p>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="max-w-3xl mx-auto p-6 space-y-6">
          {/* Quality Check */}
          <Card className={hasIssues ? 'border-red-500/30' : allCompleted ? 'border-emerald-500/30' : 'border-yellow-500/30'}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                {allCompleted ? (
                  <><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Quality Check Passed</>
                ) : hasIssues ? (
                  <><AlertTriangle className="w-4 h-4 text-red-400" /> Issues Found</>
                ) : (
                  <><Clock className="w-4 h-4 text-yellow-400" /> Scenes Pending</>
                )}
              </CardTitle>
              <CardDescription className="text-xs">
                {completedScenes}/{scenes.length} scenes completed · {totalDuration}s total duration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {scenes.map(scene => (
                  <div key={scene.id} className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs">#{scene.order + 1}</span>
                      <span className="text-xs font-medium">{scene.title}</span>
                    </div>
                    <StatusBadge status={scene.status} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Export Settings */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Settings className="w-4 h-4" /> Export Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Export Preset</label>
                <Select value={selectedPreset} onValueChange={setSelectedPreset}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {settings.exportPresets.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {preset && (
                <div className="grid grid-cols-3 gap-3 bg-muted/30 rounded-lg p-3">
                  <div>
                    <div className="text-[10px] text-muted-foreground">Aspect Ratio</div>
                    <div className="text-sm font-medium">{preset.aspectRatio}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-muted-foreground">Resolution</div>
                    <div className="text-sm font-medium">{preset.resolution}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-muted-foreground">FPS</div>
                    <div className="text-sm font-medium">{preset.fps}fps</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-muted-foreground">Format</div>
                    <div className="text-sm font-medium uppercase">{preset.format}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-muted-foreground">Max Duration</div>
                    <div className="text-sm font-medium">{preset.maxDuration}s</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-muted-foreground">Quality</div>
                    <Badge variant="outline" className="text-xs">{preset.quality}</Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Export Button */}
          {isExporting ? (
            <Card>
              <CardContent className="p-6 text-center space-y-3">
                <FileVideo className="w-10 h-10 mx-auto text-primary animate-pulse" />
                <div className="text-sm font-medium">Exporting Video...</div>
                <Progress value={Math.min(exportProgress, 100)} className="h-2" />
                <div className="text-xs text-muted-foreground">{Math.min(Math.round(exportProgress), 100)}% complete</div>
              </CardContent>
            </Card>
          ) : (
            <Button
              size="lg"
              className="w-full gap-2"
              onClick={handleExport}
              disabled={!allCompleted}
            >
              <Download className="w-4 h-4" />
              {allCompleted ? 'Export Video' : 'Complete All Scenes to Export'}
            </Button>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}