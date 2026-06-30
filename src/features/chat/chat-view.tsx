'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useProjectStore } from '@/features/project/store';
import { useChatStore } from '@/features/chat/store';
import { useWorkflowStore } from '@/features/workflow/store';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { SpinnerIcon } from '@/components/ui/spinner-icon';
import { Send, Plus, FileText, Clapperboard, Wand2, Eye } from 'lucide-react';
import { renderGenerativeUI } from './generative-ui';
import ReactMarkdown from 'react-markdown';
import type { GenerativeUIComponent, Scene, VideoBrief } from '@/core/types';

const QUICK_ACTIONS = [
  { label: 'Create Brief', icon: FileText, prompt: 'I\'m ready. Please create a structured video brief based on our conversation.' },
  { label: 'Generate Storyboard', icon: Clapperboard, prompt: 'Please generate a full storyboard with scene breakdowns based on our discussion.' },
  { label: 'Get Hooks', icon: Wand2, prompt: 'Generate some powerful hook ideas for the opening of my video.' },
  { label: 'AI Review', icon: Eye, prompt: 'Please review my current video plan and give me your director\'s feedback.' },
];

export function ChatView() {
  const { currentProjectId, getCurrentProject, updateCurrentProject, setPhase } = useProjectStore();
  const { messages, isStreaming, addMessage, setStreaming } = useChatStore();
  const { buildFromStoryboard, getScenes } = useWorkflowStore();
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const isSendingRef = useRef(false);

  const currentProject = getCurrentProject();

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = useCallback(async (text?: string) => {
    const content = text || input.trim();
    if (!content || !currentProjectId || isSendingRef.current) return;

    isSendingRef.current = true;
    setInput('');
    setStreaming(true);

    // Add user message
    await addMessage(currentProjectId, 'user', content);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, { role: 'user', content }].map(m => ({
            role: m.role,
            content: m.content,
          })),
          projectId: currentProjectId,
          agentType: 'chat_planner',
        }),
      });

      const data = await response.json();

      // Handle generative UI actions
      if (data.generativeUI) {
        for (const gui of data.generativeUI as GenerativeUIComponent[]) {
          if (gui.type === 'video_brief_form' && gui.data) {
            await updateCurrentProject({ videoBrief: gui.data as VideoBrief });
          }
          if (gui.type === 'scene_suggestion' && gui.data) {
            const scenes = gui.data as Scene[];
            await updateCurrentProject({
              storyboard: {
                id: currentProject?.storyboard?.id || 'sb-1',
                scenes,
                totalDuration: scenes[scenes.length - 1]?.endTime || 0,
                narrativeArc: 'Standard ad structure: Hook → Problem → Solution → CTA',
              },
            });
            buildFromStoryboard(scenes);
          }
        }
      }

      await addMessage(currentProjectId, 'assistant', data.content, data.generativeUI);
    } catch (err) {
      await addMessage(currentProjectId, 'assistant', 'Sorry, I encountered an error. Please try again.');
    }

    setStreaming(false);
    isSendingRef.current = false;
  }, [input, currentProjectId, messages, addMessage, setStreaming, updateCurrentProject, buildFromStoryboard, currentProject]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-16">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
                <Wand2 className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-lg font-semibold mb-1">Describe Your Video</h2>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Tell me about the video you want to create. I&apos;ll help you plan every detail.
              </p>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted/50 border border-border'
                }`}
              >
                {msg.role === 'assistant' ? (
                  <div className="prose prose-sm prose-invert max-w-none [&>p]:mb-2 [&>p:last-child]:mb-0 [&>ul]:mb-2 [&>ol]:mb-2 [&>strong]:text-foreground [&_li]:text-sm">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                )}

                {/* Generative UI */}
                {msg.generativeUI && msg.generativeUI.length > 0 && (
                  <div className="mt-3 space-y-3">
                    {msg.generativeUI.map((gui, idx) => renderGenerativeUI(gui, idx))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isStreaming && (
            <div className="flex justify-start">
              <div className="bg-muted/50 border border-border rounded-2xl px-4 py-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <SpinnerIcon className="w-4 h-4 animate-spin" />
                  Thinking...
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Quick Actions */}
      {messages.length > 0 && messages.length < 10 && (
        <div className="px-4 pb-2">
          <div className="max-w-3xl mx-auto flex gap-2 overflow-x-auto pb-1">
            {QUICK_ACTIONS.map((action) => (
              <Button
                key={action.label}
                variant="outline"
                size="sm"
                className="whitespace-nowrap gap-1.5 text-xs shrink-0"
                onClick={() => handleSend(action.prompt)}
                disabled={isStreaming}
              >
                <action.icon className="w-3 h-3" />
                {action.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-border p-4">
        <div className="max-w-3xl mx-auto relative">
          <Textarea
            ref={inputRef}
            placeholder="Describe the video you want to create..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isStreaming}
            className="min-h-[52px] max-h-[200px] pr-12 resize-none rounded-xl border-border bg-muted/30 focus:bg-muted/50 text-sm"
            rows={1}
          />
          <Button
            size="icon"
            className="absolute right-2 bottom-2 h-8 w-8 rounded-lg"
            onClick={() => handleSend()}
            disabled={!input.trim() || isStreaming}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}