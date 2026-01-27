"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CreateTeamPage() {
    const router = useRouter();
    const [teamName, setTeamName] = useState("");

    const handleCreate = () => {
        if (!teamName.trim()) return;

        // TODO: Implement team creation logic
        // This will:
        // 1. Create a new team/project in the database
        // 2. Generate a 6-character team code
        // 3. Add current user as owner
        // 4. Redirect to the new team's project page

        console.log("Creating team:", teamName);
        // For now, just redirect back
        router.push("/navigator/personal");
    };

    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)] p-8">
            <div className="w-full max-w-md space-y-8">
                <div className="space-y-2">
                    <Link
                        href="/navigator/add-team"
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
                    >
                        <ArrowLeft className="h-4 w-4" /> Back
                    </Link>
                </div>

                <div className="space-y-6">
                    <div className="space-y-2">
                        <h1 className="text-4xl font-bold">Create Team</h1>
                        <p className="text-lg text-muted-foreground">
                            Give your team a name.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="team-name">Team Name</Label>
                        <Input
                            id="team-name"
                            value={teamName}
                            onChange={(e) => setTeamName(e.target.value)}
                            placeholder="e.g. Acme Corp"
                            className="text-lg"
                            autoFocus
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    handleCreate();
                                }
                            }}
                        />
                    </div>

                    <Button
                        onClick={handleCreate}
                        disabled={!teamName.trim()}
                        className="w-full"
                        size="lg"
                    >
                        Create Team
                    </Button>
                </div>
            </div>
        </div>
    );
}
