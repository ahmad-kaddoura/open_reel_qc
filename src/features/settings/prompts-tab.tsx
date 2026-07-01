'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RotateCcw, SlidersHorizontal } from 'lucide-react';
import { DEFAULT_PROMPT_LIBRARY, PROMPT_TEMPLATE_VARIABLES } from '@/core/prompts';
import { useSettingsStore } from '@/features/settings/store';
import { useMemo, useState } from 'react';

export function PromptsTab() {
  const promptOverrides = useSettingsStore((s) => s.settings.promptOverrides);
  const getPromptValue = useSettingsStore((s) => s.getPromptValue);
  const updatePromptOverride = useSettingsStore((s) => s.updatePromptOverride);
  const resetPromptOverride = useSettingsStore((s) => s.resetPromptOverride);
  const resetAllPromptOverrides = useSettingsStore((s) => s.resetAllPromptOverrides);
  const groups = useMemo(() => Array.from(new Set(DEFAULT_PROMPT_LIBRARY.map((prompt) => prompt.group))), []);
  const [activeGroup, setActiveGroup] = useState(groups[0] ?? '');
  const prompts = DEFAULT_PROMPT_LIBRARY.filter((prompt) => prompt.group === activeGroup);
  const overrideCount = Object.keys(promptOverrides ?? {}).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Prompt Management</h3>
          <p className="text-sm text-muted-foreground">
            View, edit, organize, and reset every default prompt used by planning, assets, frames, video, enhancements, and negative prompts.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => resetAllPromptOverrides()}
          disabled={overrideCount === 0}
        >
          <RotateCcw className="w-3 h-3" /> Reset All
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
        <Card className="h-fit">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <SlidersHorizontal className="h-4 w-4" />
              Groups
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 p-2">
            {groups.map((group) => {
              const count = DEFAULT_PROMPT_LIBRARY.filter((prompt) => prompt.group === group).length;
              const changed = DEFAULT_PROMPT_LIBRARY.some((prompt) => prompt.group === group && promptOverrides?.[prompt.id]);
              return (
                <button
                  key={group}
                  type="button"
                  onClick={() => setActiveGroup(group)}
                  className={`flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-xs transition-colors ${
                    activeGroup === group ? 'bg-primary/10 text-foreground' : 'text-muted-foreground hover:bg-muted/60'
                  }`}
                >
                  <span>{group}</span>
                  <span className="flex items-center gap-1">
                    {changed && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                    <Badge variant="secondary" className="h-4 px-1.5 text-[9px]">{count}</Badge>
                  </span>
                </button>
              );
            })}
          </CardContent>
        </Card>

        <ScrollArea className="max-h-[620px] pr-3">
          <div className="space-y-3">
            {prompts.map((prompt) => {
              const value = getPromptValue(prompt.id);
              const isOverridden = Boolean(promptOverrides?.[prompt.id]);
              const variables = 'variables' in prompt ? prompt.variables : undefined;
              return (
                <Card key={prompt.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <CardTitle className="text-sm">{prompt.name}</CardTitle>
                        <p className="mt-1 text-xs text-muted-foreground">{prompt.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {isOverridden && <Badge className="h-5 text-[10px]">Custom</Badge>}
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 gap-1 text-xs"
                          onClick={() => resetPromptOverride(prompt.id)}
                          disabled={!isOverridden}
                        >
                          <RotateCcw className="h-3 w-3" /> Reset
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {prompt.id === 'scenario.scene.base' && (
                      <div className="flex flex-wrap gap-1.5">
                        {PROMPT_TEMPLATE_VARIABLES.map((v) => (
                          <button
                            key={v.token}
                            onClick={() => updatePromptOverride(prompt.id, `${value}${v.token}`)}
                            className="rounded border border-border px-2 py-1 text-[10px] text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5"
                            title={v.label}
                          >
                            {v.token}
                          </button>
                        ))}
                      </div>
                    )}
                    {variables && variables.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {variables.map((variable) => (
                          <Badge key={variable} variant="outline" className="h-5 text-[10px]">
                            {`{{${variable}}}`}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <Textarea
                      className="min-h-[180px] font-mono text-xs"
                      value={value}
                      onChange={(e) => updatePromptOverride(prompt.id, e.target.value)}
                    />
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
