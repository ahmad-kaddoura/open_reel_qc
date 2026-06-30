'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Box, MoreHorizontal } from 'lucide-react';
import type { ReusableAssetPlan } from '@/core/types';

function AssetNodeComponent({ data }: NodeProps) {
  const asset = data as unknown as ReusableAssetPlan;
  const action = (label: string) => () => {
    console.info(`[VideoForge] ${label}: ${asset.name}`);
  };

  return (
    <div className="relative">
      <div className="w-[230px] rounded-xl border border-cyan-500/40 bg-card shadow-lg overflow-hidden">
        <div className="px-2.5 py-1.5 border-b border-border bg-cyan-500/10 flex items-center justify-between gap-2">
          <span className="text-[9px] uppercase tracking-wider text-cyan-300 font-semibold flex items-center gap-1">
            <Box className="w-3 h-3" />
            {asset.type.replace(/_/g, ' ')}
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" className="p-0.5 rounded hover:bg-muted" aria-label="Asset actions">
                <MoreHorizontal className="w-3.5 h-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={action('Save to Brand Identity')}>Save to Brand Identity</DropdownMenuItem>
              <DropdownMenuItem onClick={action('Save to Project Assets')}>Save to Project Assets</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={action('Rename')}>Rename</DropdownMenuItem>
              <DropdownMenuItem onClick={action('Edit with AI')}>Edit with AI</DropdownMenuItem>
              <DropdownMenuItem onClick={action('Regenerate')}>Regenerate</DropdownMenuItem>
              <DropdownMenuItem onClick={action('Duplicate')}>Duplicate</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={action('Delete')} className="text-red-400">Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="p-3 space-y-2">
          <div>
            <h3 className="text-xs font-semibold leading-tight">{asset.name}</h3>
            <p className="mt-1 text-[10px] text-muted-foreground line-clamp-2">{asset.description}</p>
          </div>
          <div className="flex flex-wrap gap-1">
            {asset.saveTargets.map((target) => (
              <Badge key={target} variant="outline" className="text-[9px] h-4 px-1.5">
                {target.replace(/_/g, ' ')}
              </Badge>
            ))}
          </div>
          <div className="rounded-md bg-background/40 border border-border/40 p-2">
            <div className="text-[9px] text-muted-foreground mb-0.5">Reference prompt</div>
            <p className="text-[9px] leading-relaxed line-clamp-3">{asset.referenceImagePrompt}</p>
          </div>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        id="asset-out"
        className="!w-3 !h-3 !bg-cyan-400 !border-2 !border-background"
      />
    </div>
  );
}

export const AssetNode = memo(AssetNodeComponent);
