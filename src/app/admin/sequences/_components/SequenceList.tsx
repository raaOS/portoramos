"use client";

import React, { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import { Trash2, FolderOpen, RefreshCw, Play } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
import { format } from "date-fns";

interface Sequence {
    name: string;
    frames: number;
    createdAt: string;
    path: string;
}

export default function SequenceList() {
    const { showSuccess, showError } = useToast();
    const [sequences, setSequences] = useState<Sequence[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [activatingId, setActivatingId] = useState<string | null>(null);

    const handleActivate = async (name: string) => {
        setActivatingId(name);
        try {
            const res = await fetch("/api/upload/sequence", {
                method: "PATCH",
                body: JSON.stringify({ name }),
            });

            if (!res.ok) throw new Error("Activation failed");

            const data = await res.json();
            showSuccess(`Active sequence set to: ${name}`);
        } catch (error) {
            console.error(error);
            showError("Failed to activate sequence");
        } finally {
            setActivatingId(null);
        }
    };

    const fetchSequences = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/upload/sequence");
            if (!res.ok) throw new Error("Failed to fetch");
            const data = await res.json();

            // Map strings to dates if needed, though JSON returns strings
            setSequences(data);
        } catch (error) {
            console.error(error);
            showError("Failed to load sequences");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSequences();
    }, []);

    // Expose refresh method to parent if needed, or just use button
    // For now, simple auto-refresh on mount.

    const handleDelete = async (name: string) => {
        if (!confirm(`Are you sure you want to delete "${name}"? This cannot be undone.`)) return;

        setDeletingId(name);
        try {
            const res = await fetch(`/api/upload/sequence?name=${name}`, {
                method: "DELETE",
            });

            if (!res.ok) throw new Error("Delete failed");

            showSuccess("Sequence deleted");
            fetchSequences(); // Refresh list
        } catch (error) {
            showError("Failed to delete");
            console.error(error);
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Saved Sequences</h3>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={fetchSequences}
                    disabled={isLoading}
                >
                    <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                    Refresh
                </Button>
            </div>

            {sequences.length === 0 && !isLoading && (
                <div className="text-center p-8 border rounded-lg border-dashed text-muted-foreground">
                    No sequences found. Generate one above.
                </div>
            )}

            <div className="grid gap-3">
                {sequences.map((seq) => (
                    <div
                        key={seq.name}
                        className="flex items-center justify-between p-4 border rounded-lg bg-card/50 hover:bg-card transition-colors"
                    >
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-primary/10 rounded">
                                <FolderOpen className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <h4 className="font-medium text-sm flex items-center gap-2">
                                    {seq.name}
                                    {/* Simple 'New' badge logic if created recently could go here */}
                                </h4>
                                <div className="text-xs text-muted-foreground mt-1 space-x-3">
                                    <span>{seq.frames} frames</span>
                                    <span>•</span>
                                    <span>{format(new Date(seq.createdAt), "MMM d, HH:mm")}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <code className="hidden sm:block text-xs bg-muted px-2 py-1 rounded select-all">
                                {seq.name}
                            </code>
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handleActivate(seq.name)}
                                disabled={activatingId !== null}
                            >
                                {activatingId === seq.name ? (
                                    <span className="animate-pulse">Active...</span>
                                ) : (
                                    <span className="flex items-center">
                                        <Play className="w-3 h-3 mr-1 fill-current" />
                                        Use
                                    </span>
                                )}
                            </Button>

                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handleActivate(seq.name)}
                                disabled={activatingId !== null}
                            >
                                {activatingId === seq.name ? (
                                    <span className="animate-pulse">Active...</span>
                                ) : (
                                    <span className="flex items-center">
                                        <Play className="w-3 h-3 mr-1 fill-current" />
                                        Use
                                    </span>
                                )}
                            </Button>

                            <Button
                                variant="danger"
                                size="sm"
                                onClick={() => handleDelete(seq.name)}
                                loading={deletingId === seq.name}
                                disabled={deletingId !== null}
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
