'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Grid3X3, Monitor, Moon, PanelLeft, Sparkles, Sun } from 'lucide-react';
import { useSettingsStore } from '@/features/settings/store';

export function AppearanceTab() {
  const settings = useSettingsStore((s) => s.settings);
  const setLayout = useSettingsStore((s) => s.setLayout);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const setEdgeLabelPlacement = useSettingsStore((s) => s.setEdgeLabelPlacement);
  const updateCanvasGrid = useSettingsStore((s) => s.updateCanvasGrid);

  return (
    <>
      <p className="text-sm text-muted-foreground">Customize workspace layout, theme, and workflow canvas display.</p>
      <Card>
        <CardContent className="p-4 space-y-4">
          <div>
            <Label className="text-sm font-medium">Workspace layout</Label>
            <p className="text-xs text-muted-foreground mt-1 mb-2">
              Switch between the modern assistant workspace and the classic phase-based workflow.
            </p>
            <div className="flex gap-2">
              {[
                { id: 'modern' as const, icon: Sparkles, label: 'Modern' },
                { id: 'classic' as const, icon: PanelLeft, label: 'Classic' },
              ].map((layout) => (
                <button
                  key={layout.id}
                  type="button"
                  onClick={() => setLayout(layout.id)}
                  className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border transition-all ${
                    (settings.layout ?? 'modern') === layout.id
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:border-primary/30'
                  }`}
                >
                  <layout.icon className="w-4 h-4" />
                  <span className="text-sm">{layout.label}</span>
                </button>
              ))}
            </div>
          </div>

          <Separator />

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

          <Separator />

          <div>
            <Label className="text-sm font-medium">Canvas appearance</Label>
            <p className="text-xs text-muted-foreground mt-1">
              Controls for the Workflow canvas labels, grid, and visual guides.
            </p>
          </div>

          <div>
            <Label className="text-sm font-medium">Connection labels</Label>
            <p className="text-xs text-muted-foreground mt-1 mb-2">
              Show port names on the connection lines, or inside the scene node like n8n.
            </p>
            <div className="flex gap-2">
              {[
                { id: 'in-node' as const, label: 'Inside nodes (n8n)' },
                { id: 'on-edge' as const, label: 'On connection lines' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setEdgeLabelPlacement(opt.id)}
                  className={`flex-1 p-3 rounded-lg border text-sm transition-all ${
                    (settings.edgeLabelPlacement ?? 'in-node') === opt.id
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:border-primary/30'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Grid3X3 className="h-4 w-4" />
                  Canvas grid
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Show a theme-aware grid behind workflow nodes.
                </p>
              </div>
              <Switch
                checked={settings.canvasGrid.enabled}
                onCheckedChange={(enabled) => updateCanvasGrid({ enabled })}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Pattern</Label>
                <Select
                  value={settings.canvasGrid.variant}
                  onValueChange={(variant) => updateCanvasGrid({ variant: variant as typeof settings.canvasGrid.variant })}
                  disabled={!settings.canvasGrid.enabled}
                >
                  <SelectTrigger className="mt-1 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dots">Dots</SelectItem>
                    <SelectItem value="lines">Lines</SelectItem>
                    <SelectItem value="cross">Cross</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Spacing: {settings.canvasGrid.gap}px
                </Label>
                <Slider
                  className="mt-3"
                  value={[settings.canvasGrid.gap]}
                  onValueChange={([gap]) => updateCanvasGrid({ gap })}
                  min={10}
                  max={60}
                  step={2}
                  disabled={!settings.canvasGrid.enabled}
                />
              </div>

              <div>
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Opacity: {Math.round(settings.canvasGrid.opacity * 100)}%
                </Label>
                <Slider
                  className="mt-3"
                  value={[settings.canvasGrid.opacity]}
                  onValueChange={([opacity]) => updateCanvasGrid({ opacity })}
                  min={0.06}
                  max={0.6}
                  step={0.02}
                  disabled={!settings.canvasGrid.enabled}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
