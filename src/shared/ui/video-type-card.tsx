'use client';

import { Card, CardContent } from '@/components/ui/card';
import * as LucideIcons from 'lucide-react';

interface VideoTypeCardProps {
  icon: string;
  name: string;
  description: string;
  onClick: () => void;
}

export function VideoTypeCard({ icon, name, description, onClick }: VideoTypeCardProps) {
  const IconComponent = (LucideIcons as Record<string, React.ComponentType<{ className?: string }>>)[icon] || LucideIcons.Film;

  return (
    <Card
      className="h-full cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all group"
      onClick={onClick}
    >
      <CardContent className="p-3.5 h-[84px]">
        <div className="flex items-start gap-2.5 h-full">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
            <IconComponent className="w-4 h-4 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium mb-0.5 leading-tight">{name}</div>
            <div className="text-[11px] text-muted-foreground leading-snug line-clamp-2">{description}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}