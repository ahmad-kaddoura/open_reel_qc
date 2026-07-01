'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { RotateCcw } from 'lucide-react';
import { PROMPT_TEMPLATE_VARIABLES } from '@/core/config';
import { useSettingsStore } from '@/features/settings/store';

export function PromptsTab() {
  const scenePromptTemplate = useSettingsStore((s) => s.settings.scenePromptTemplate);
  const setScenePromptTemplate = useSettingsStore((s) => s.setScenePromptTemplate);
  const resetScenePromptTemplate = useSettingsStore((s) => s.resetScenePromptTemplate);

  return (
    <>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Scene prompt template — each scene fills this with its parameters and section values.
        </p>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => resetScenePromptTemplate()}
        >
          <RotateCcw className="w-3 h-3" /> Reset
        </Button>
      </div>
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {PROMPT_TEMPLATE_VARIABLES.map((v) => (
              <button
                key={v.token}
                onClick={() => {
                  const ta = document.getElementById('prompt-template-textarea') as HTMLTextAreaElement | null;
                  if (ta) {
                    const start = ta.selectionStart;
                    const end = ta.selectionEnd;
                    const next = scenePromptTemplate.slice(0, start) + v.token + scenePromptTemplate.slice(end);
                    setScenePromptTemplate(next);
                    requestAnimationFrame(() => {
                      ta.focus();
                      ta.selectionStart = ta.selectionEnd = start + v.token.length;
                    });
                  } else {
                    setScenePromptTemplate(scenePromptTemplate + v.token);
                  }
                }}
                className="text-[10px] px-2 py-1 rounded border border-border hover:border-primary/40 hover:bg-primary/5 text-muted-foreground transition-colors"
                title={v.label}
              >
                {v.token}
              </button>
            ))}
          </div>
          <Textarea
            id="prompt-template-textarea"
            className="font-mono text-xs min-h-[280px]"
            value={scenePromptTemplate}
            onChange={(e) => setScenePromptTemplate(e.target.value)}
          />
          <div className="text-[10px] text-muted-foreground">
            Variables are replaced per scene. Empty sections render as blank lines.
          </div>
        </CardContent>
      </Card>
    </>
  );
}
