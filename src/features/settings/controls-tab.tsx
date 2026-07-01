'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { useSettingsStore } from '@/features/settings/store';

export function ControlsTab() {
  const costControls = useSettingsStore((s) => s.settings.costControls);
  const updateCostControls = useSettingsStore((s) => s.updateCostControls);

  return (
    <>
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
                value={[costControls.maxParallelGenerations]}
                onValueChange={([v]) => updateCostControls({ maxParallelGenerations: v })}
                min={1}
                max={10}
                step={1}
              />
              <span className="text-sm font-medium w-6 text-right">{costControls.maxParallelGenerations}</span>
            </div>
          </div>
          <div>
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Max Duration (seconds)
            </Label>
            <Input
              type="number"
              className="mt-1 h-8"
              value={costControls.maxDuration}
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
              value={costControls.maxRetries}
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
              value={costControls.maxScenes}
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
              value={costControls.maxVersions}
              onChange={(e) => updateCostControls({ maxVersions: Number(e.target.value) })}
            />
          </div>
          <div>
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Max Output Quality
            </Label>
            <Select
              value={costControls.maxOutputQuality}
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
    </>
  );
}
