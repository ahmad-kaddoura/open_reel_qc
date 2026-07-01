'use client';

import { memo, useEffect, useState } from 'react';
import { NodeResizer, type NodeProps } from '@xyflow/react';
import { Pencil, StickyNote } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { useWorkflowStore } from '@/features/workflow/store';

type WorkflowStyle = { border?: string; line?: string };

const DEFAULT_NOTE_COLOR = '#fde047';
const DEFAULT_NOTE_TITLE = 'Text (Notes)';

function hexToRgb(hex: string) {
  const normalized = hex.replace('#', '');
  if (!/^[0-9a-f]{6}$/i.test(normalized)) return null;
  const value = Number.parseInt(normalized, 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

function colorWithAlpha(hex: string, alpha: number) {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

function readableTextColor(hex: string) {
  const rgb = hexToRgb(hex);
  if (!rgb) return '#18181b';
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance > 0.58 ? '#18181b' : '#fafafa';
}

function NoteNodeComponent({ id, data, selected }: NodeProps) {
  const title = (data as { title?: string }).title ?? DEFAULT_NOTE_TITLE;
  const text = (data as { text?: string }).text ?? '';
  const width = (data as { width?: number }).width ?? 240;
  const height = (data as { height?: number }).height ?? 170;
  const workflowStyle = (data as { workflowStyle?: WorkflowStyle }).workflowStyle;
  const updateNoteNode = useWorkflowStore((s) => s.updateNoteNode);
  const [titleDraft, setTitleDraft] = useState(title);
  const [draft, setDraft] = useState(text);
  const [size, setSize] = useState({ width, height });
  const [editOpen, setEditOpen] = useState(false);
  const noteColor = workflowStyle?.border ?? DEFAULT_NOTE_COLOR;
  const textColor = readableTextColor(noteColor);
  const headerBackground = colorWithAlpha(noteColor, 0.72);
  const bodyBackground = colorWithAlpha(noteColor, 0.9);

  useEffect(() => {
    setDraft(text);
  }, [text]);

  useEffect(() => {
    setTitleDraft(title);
  }, [title]);

  useEffect(() => {
    setSize({ width, height });
  }, [width, height]);

  useEffect(() => {
    const openNoteEditor = (event: Event) => {
      const detail = (event as CustomEvent<{ id?: string }>).detail;
      if (detail?.id === id) openEdit();
    };
    window.addEventListener('workflow:open-note-editor', openNoteEditor);
    return () => window.removeEventListener('workflow:open-note-editor', openNoteEditor);
  }, [id, title, text]);

  const openEdit = () => {
    setTitleDraft(title);
    setDraft(text);
    setEditOpen(true);
  };

  const closeEdit = () => {
    setTitleDraft(title);
    setDraft(text);
    setEditOpen(false);
  };

  const save = () => {
    updateNoteNode(id, {
      title: titleDraft,
      text: draft,
    });
    setEditOpen(false);
  };

  return (
    <>
      <NodeResizer
        isVisible={selected}
        minWidth={180}
        minHeight={130}
        color={noteColor}
        onResize={(_, params) => {
          setSize({
            width: Math.round(params.width),
            height: Math.round(params.height),
          });
        }}
        onResizeEnd={(_, params) => {
          const nextSize = {
            width: Math.round(params.width),
            height: Math.round(params.height),
          };
          setSize(nextSize);
          updateNoteNode(id, {
            width: nextSize.width,
            height: nextSize.height,
          });
        }}
      />
      <div
        className="flex h-full w-full flex-col overflow-hidden rounded-md border shadow-lg"
        style={{
          width: size.width,
          height: size.height,
          borderColor: noteColor,
          backgroundColor: bodyBackground,
          color: textColor,
        }}
      >
        <div
          className="flex items-center gap-1.5 border-b px-3 py-2"
          style={{
            backgroundColor: headerBackground,
            borderColor: colorWithAlpha(noteColor, 0.45),
          }}
        >
          <StickyNote className="h-3.5 w-3.5 shrink-0" />
          <span className="min-w-0 flex-1 truncate text-[10px] font-semibold uppercase tracking-wider">
            {title || DEFAULT_NOTE_TITLE}
          </span>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              openEdit();
            }}
            className="nodrag rounded p-0.5 transition-colors hover:bg-black/10"
            aria-label="Edit note"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-auto whitespace-pre-wrap px-3 py-2.5 text-xs leading-relaxed">
          {text ? text : <span className="opacity-65">Click the pencil to write a note...</span>}
        </div>
      </div>

      <Dialog open={editOpen} onOpenChange={(open) => open ? openEdit() : closeEdit()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-sm">Edit note</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              value={titleDraft}
              onChange={(event) => setTitleDraft(event.target.value)}
              placeholder={DEFAULT_NOTE_TITLE}
              className="text-sm"
            />
            <Textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Write a note..."
              className="min-h-[220px] resize-y text-sm"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeEdit}>Cancel</Button>
            <Button onClick={save}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export const NoteNode = memo(NoteNodeComponent);
