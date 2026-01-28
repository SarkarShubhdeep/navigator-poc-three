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

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleCreate = async () => {
        if (!teamName.trim()) return;

        setLoading(true);
        setError(null);

        try {
            const response = await fetch("/api/teams", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: teamName.trim() }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to create team");
            }

            await response.json();
            // Redirect to personal page (teams list will show the new team)
            // The sidebar will automatically refresh teams
            router.push("/navigator/personal");
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Failed to create team",
            );
            setLoading(false);
        }
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

                    {error && (
                        <p className="text-sm text-destructive">{error}</p>
                    )}

                    <Button
                        onClick={handleCreate}
                        disabled={!teamName.trim() || loading}
                        className="w-full"
                        size="lg"
                    >
                        {loading ? "Creating..." : "Create Team"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
