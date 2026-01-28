"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Plus, Users } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AddTeamPage() {
    const router = useRouter();

    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)] p-8">
            <div className="w-full max-w-4xl space-y-8">
                <div className="text-center space-y-2">
                    <h1 className="text-4xl font-semibold">Add New Team</h1>
                    <p className="text-base text-muted-foreground">
                        Create a new workspace or join an existing one.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Create Team Card */}
                    <Card
                        className="cursor-pointer hover:bg-accent/50 transition-colors flex items-center justify-center"
                        onClick={() =>
                            router.push("/navigator/add-team/create")
                        }
                    >
                        <CardContent className="flex flex-col items-center justify-center p-12 space-y-6">
                            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                                <Plus className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <div className="text-center space-y-2">
                                <h2 className="text-2xl font-semibold">
                                    Create Team
                                </h2>
                                <p className="text-muted-foreground">
                                    Start a new workspace for your organization
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Join Team Card */}
                    <Card
                        className="cursor-pointer hover:bg-accent/50 transition-colors flex items-center justify-center"
                        onClick={() => router.push("/navigator/add-team/join")}
                    >
                        <CardContent className="flex flex-col items-center justify-center p-12 space-y-6">
                            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                                <Users className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <div className="text-center space-y-2">
                                <h2 className="text-2xl font-semibold">
                                    Join Team
                                </h2>
                                <p className="text-muted-foreground">
                                    Enter an invite code to join existing team
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
