"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PanelLeft } from "lucide-react";

interface HeaderProps {
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
}

export function Header({ onToggleSidebar, sidebarOpen }: HeaderProps) {
  return (
    <header className="h-14 border-b bg-background flex items-center justify-between px-4 sticky top-0 z-10">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          className="h-9 w-auto px-3 gap-2"
        >
          <PanelLeft className="h-4 w-4" />
          <span className="text-sm font-medium">SF</span>
        </Button>
      </div>
      <div className="flex-1 flex justify-center">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold">Navigator</h1>
          <Badge variant="secondary" className="text-xs">
            v0.3
          </Badge>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="text-xs">
          IDLE
        </Badge>
        <Badge variant="secondary" className="text-xs gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
          ONLINE
        </Badge>
      </div>
    </header>
  );
}
