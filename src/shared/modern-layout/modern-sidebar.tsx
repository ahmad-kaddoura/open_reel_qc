'use client';

import { Clapperboard, Home, Palette, LayoutGrid, Folder, Undo2, Settings, Gauge } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface ModernSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onToggleClassic: () => void;
}

export function ModernSidebar({ activeTab, onTabChange, onToggleClassic }: ModernSidebarProps) {
  const tabs = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'avatar', icon: Gauge, label: 'Usage' },
    { id: 'brand', icon: Palette, label: 'Brand' },
    { id: 'apps', icon: LayoutGrid, label: 'Assets' },
    { id: 'projects', icon: Folder, label: 'Projects' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="w-16 h-full flex flex-col items-center py-4 bg-sidebar border-r border-sidebar-border shadow-sm z-20 shrink-0">
      {/* Logo */}
      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-400 to-blue-500 flex items-center justify-center mb-6 shadow-sm">
        <Clapperboard className="w-5 h-5 text-white" />
      </div>

      {/* Main Nav */}
      <nav className="flex flex-col gap-2 w-full items-center flex-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <Tooltip key={tab.id} delayDuration={0}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onTabChange(tab.id)}
                  aria-label={tab.label}
                  aria-current={isActive ? 'page' : undefined}
                  className={`group relative w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${
                    isActive
                      ? 'bg-foreground text-background shadow-sm'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <tab.icon className={`w-5 h-5 ${isActive ? 'stroke-[2.25px]' : ''}`} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="font-medium">
                {tab.label}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="flex flex-col items-center gap-2 mt-auto">
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <button
              onClick={onToggleClassic}
              aria-label="Switch to Classic View"
              className="w-10 h-10 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
            >
              <Undo2 className="w-5 h-5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" className="font-medium">
            Switch to Classic View
          </TooltipContent>
        </Tooltip>

        {/* User Profile placeholder */}
        <button className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 text-white font-semibold text-sm flex items-center justify-center mt-1">
          A
        </button>
      </div>
    </div>
  );
}
