"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Archive,
  BarChart3,
  Clock,
  FileText,
  Plus,
  User,
  Video,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserFooter } from "./user-footer";

interface SidebarProps {
  isOpen: boolean;
}

export function Sidebar({ isOpen }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <aside
      className={`h-screen border-r bg-background flex flex-col ${
        isOpen ? "w-64" : "w-0 overflow-hidden"
      }`}
    >
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Teams Section */}
        <div className="space-y-2">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2">
            Teams
          </h2>
          <nav className="space-y-1">
            <Link href="/navigator/personal">
              <Button
                variant={isActive("/navigator/personal") ? "secondary" : "ghost"}
                className="w-full justify-start"
                asChild
              >
                <span>
                  <User className="mr-2 h-4 w-4" />
                  Personal
                </span>
              </Button>
            </Link>
            <Link href="/navigator/project-navigator">
              <Button
                variant={
                  isActive("/navigator/project-navigator")
                    ? "secondary"
                    : "ghost"
                }
                className="w-full justify-start"
                asChild
              >
                <span>
                  <FileText className="mr-2 h-4 w-4" />
                  Project Navigator
                </span>
              </Button>
            </Link>
            <Button variant="ghost" className="w-full justify-start text-muted-foreground">
              <Plus className="mr-2 h-4 w-4" />
              Add new team
            </Button>
          </nav>
        </div>

        <Separator />

        {/* Views Section */}
        <div className="space-y-2">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2">
            Views
          </h2>
          <nav className="space-y-1">
            <Link href="/navigator/timeline">
              <Button
                variant={isActive("/navigator/timeline") ? "secondary" : "ghost"}
                className="w-full justify-start"
                asChild
              >
                <span>
                  <Clock className="mr-2 h-4 w-4" />
                  Timeline
                </span>
              </Button>
            </Link>
            <Link href="/navigator/statistics">
              <Button
                variant={
                  isActive("/navigator/statistics") ? "secondary" : "ghost"
                }
                className="w-full justify-start"
                asChild
              >
                <span>
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Statistics
                </span>
              </Button>
            </Link>
            <Link href="/navigator/agent-jerry">
              <Button
                variant={
                  isActive("/navigator/agent-jerry") ? "secondary" : "ghost"
                }
                className="w-full justify-start"
                asChild
              >
                <span className="flex items-center">
                  <Image
                    src="/assets/agent-jerry-avatar.svg"
                    alt="Agent Jerry"
                    width={16}
                    height={16}
                    className="mr-2"
                  />
                  Agent Jerry
                </span>
              </Button>
            </Link>
            <Link href="/navigator/work-sessions">
              <Button
                variant={
                  isActive("/navigator/work-sessions") ? "secondary" : "ghost"
                }
                className="w-full justify-start"
                asChild
              >
                <span>
                  <Clock className="mr-2 h-4 w-4" />
                  Work Sessions
                </span>
              </Button>
            </Link>
            <Link href="/navigator/recordings">
              <Button
                variant={
                  isActive("/navigator/recordings") ? "secondary" : "ghost"
                }
                className="w-full justify-start"
                asChild
              >
                <span>
                  <Video className="mr-2 h-4 w-4" />
                  Recordings
                </span>
              </Button>
            </Link>
            <Link href="/navigator/archived">
              <Button
                variant={isActive("/navigator/archived") ? "secondary" : "ghost"}
                className="w-full justify-start"
                asChild
              >
                <span>
                  <Archive className="mr-2 h-4 w-4" />
                  Archived
                </span>
              </Button>
            </Link>
            <Button variant="ghost" className="w-full justify-start text-muted-foreground">
              <Plus className="mr-2 h-4 w-4" />
              Add Custom View
            </Button>
          </nav>
        </div>
      </div>

      {/* Fixed User Footer */}
      <div className="p-4 border-t">
        <UserFooter />
      </div>
    </aside>
  );
}
