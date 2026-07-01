'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSettingsStore } from '@/features/settings/store';

export function ExportTab() {
  const exportPresets = useSettingsStore((s) => s.settings.exportPresets);

  return (
    <>
      <p className="text-sm text-muted-foreground">Manage export presets for different platforms and use cases.</p>
      <div className="grid gap-3">
        {exportPresets.map((preset) => (
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
    </>
  );
}
