'use client';

import { useProjectStore } from '@/features/project/store';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { FolderOpen, Image, Video, Music, FileText, Upload, Search } from 'lucide-react';
import { useState } from 'react';
import type { Asset } from '@/core/types';

const MOCK_ASSETS: Asset[] = [
  { id: '1', projectId: '', name: 'product-hero.jpg', type: 'image', url: '#', mimeType: 'image/jpeg', size: 2400000, createdAt: new Date().toISOString(), metadata: { width: 1920, height: 1080 } },
  { id: '2', projectId: '', name: 'logo-transparent.png', type: 'reference', url: '#', mimeType: 'image/png', size: 150000, createdAt: new Date().toISOString(), metadata: {} },
  { id: '3', projectId: '', name: 'scene-1-frame.jpg', type: 'image', url: '#', mimeType: 'image/jpeg', size: 1800000, createdAt: new Date().toISOString(), metadata: { sceneId: 'scene-1' } },
  { id: '4', projectId: '', name: 'narration-v1.mp3', type: 'audio', url: '#', mimeType: 'audio/mpeg', size: 3200000, createdAt: new Date().toISOString(), metadata: { duration: 30 } },
];

const ASSET_TYPE_CONFIG: Record<string, { icon: any; color: string; label: string }> = {
  image: { icon: Image, color: 'text-blue-400 bg-blue-400/10', label: 'Image' },
  video: { icon: Video, color: 'text-purple-400 bg-purple-400/10', label: 'Video' },
  audio: { icon: Music, color: 'text-emerald-400 bg-emerald-400/10', label: 'Audio' },
  reference: { icon: FileText, color: 'text-amber-400 bg-amber-400/10', label: 'Reference' },
};

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export function AssetLibraryView() {
  const { currentProjectId } = useProjectStore();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<string>('all');

  const assets = MOCK_ASSETS.filter(a =>
    (filter === 'all' || a.type === filter) &&
    a.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border">
        <div>
          <h2 className="text-lg font-semibold">Asset Library</h2>
          <p className="text-xs text-muted-foreground">{assets.length} assets</p>
        </div>
        <Button size="sm" className="gap-1.5">
          <Upload className="w-3.5 h-3.5" /> Upload Asset
        </Button>
      </div>

      {/* Filters */}
      <div className="px-6 py-3 border-b border-border flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input placeholder="Search assets..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-8 text-xs" />
        </div>
        <div className="flex gap-1.5">
          {['all', 'image', 'video', 'audio', 'reference'].map(type => (
            <Button
              key={type}
              variant={filter === type ? 'default' : 'outline'}
              size="sm"
              className="h-7 text-[11px] capitalize"
              onClick={() => setFilter(type)}
            >
              {type === 'all' ? 'All' : type + 's'}
            </Button>
          ))}
        </div>
      </div>

      {/* Asset Grid */}
      <ScrollArea className="flex-1">
        <div className="p-6">
          {assets.length === 0 ? (
            <div className="text-center py-16">
              <FolderOpen className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No assets found</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {assets.map(asset => {
                const config = ASSET_TYPE_CONFIG[asset.type] || ASSET_TYPE_CONFIG.reference;
                return (
                  <Card key={asset.id} className="group hover:border-primary/30 transition-colors cursor-pointer overflow-hidden">
                    <div className="h-[120px] bg-muted/30 flex items-center justify-center relative">
                      <div className={`w-12 h-12 rounded-xl ${config.color} flex items-center justify-center`}>
                        <config.icon className="w-6 h-6" />
                      </div>
                      <div className="absolute top-2 right-2">
                        <Badge variant="secondary" className="text-[9px] h-4">{config.label}</Badge>
                      </div>
                    </div>
                    <CardContent className="p-2.5">
                      <div className="text-xs font-medium truncate">{asset.name}</div>
                      <div className="text-[10px] text-muted-foreground">{formatSize(asset.size)}</div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}