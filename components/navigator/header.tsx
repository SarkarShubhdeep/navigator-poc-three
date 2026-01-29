"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { getUserInitials } from "@/lib/utils/user";
import { PanelLeft } from "lucide-react";
import { useEffect, useImperativeHandle, useState } from "react";
import { useActiveWorkSession } from "@/hooks/use-active-work-session";

interface HeaderProps {
    onToggleSidebar: () => void;
    refreshRef?: React.MutableRefObject<(() => void) | null>;
}

export function Header({ onToggleSidebar, refreshRef }: HeaderProps) {
    const [userInitials, setUserInitials] = useState("U");
    const { isActive, formattedTime } = useActiveWorkSession();

    const loadUserInitials = async () => {
        const supabase = createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (user) {
            const fullName = user.user_metadata?.full_name || null;
            const email = user.email || null;
            const initials =
                getUserInitials(fullName) ||
                (email ? email.substring(0, 2).toUpperCase() : "U");
            setUserInitials(initials);
        }
    };

    useEffect(() => {
        loadUserInitials();
    }, []);

    useImperativeHandle(refreshRef, () => loadUserInitials);

    return (
        <header className="h-14 border-b bg-background flex items-center justify-between px-4 sticky top-0 z-10">
            <div className="flex items-center gap-2 w-1/3">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onToggleSidebar}
                    className="h-9 w-auto px-3 gap-2"
                >
                    <PanelLeft className="h-4 w-4" />
                    <span className="text-sm font-medium font-mono">
                        {userInitials}
                    </span>
                </Button>
            </div>

            <div className="flex-1 flex justify-center w-1/3">
                <div className="flex items-center gap-2">
                    <h1 className="text-lg font-semibold">Navigator</h1>
                    <Badge variant="secondary" className="text-xs">
                        v0.3
                    </Badge>
                </div>
            </div>

            <div className="flex items-center gap-2 w-1/3 justify-end">
                {isActive && formattedTime ? (
                    <Badge variant="secondary" className="text-xs font-mono">
                        {formattedTime}
                    </Badge>
                ) : (
                    <Badge variant="secondary" className="text-xs">
                        IDLE
                    </Badge>
                )}
                <Badge variant="secondary" className="text-xs gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                    ONLINE
                </Badge>
            </div>
        </header>
    );
}
