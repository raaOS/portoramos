import { Metadata } from "next";
import SequenceGenerator from "./_components/SequenceGenerator";
import SequenceList from "./_components/SequenceList";

export const metadata: Metadata = {
    title: "Sequence Generator | Admin Dashboard",
};

export default function SequencesPage() {
    return (
        <div className="space-y-8 max-w-4xl">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Image Sequence Generator</h1>
                <p className="text-muted-foreground mt-2">
                    Convert Video files (.mp4) into optimized Image Sequences (.webp) for scroll animations.
                </p>
            </div>

            <div className="grid gap-8">
                {/* Generator Section */}
                <div className="bg-card border rounded-xl p-6 shadow-sm">
                    <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                        ✨ New Generation
                    </h2>
                    <SequenceGenerator />
                </div>

                {/* Manager Section */}
                <div className="bg-card border rounded-xl p-6 shadow-sm">
                    <SequenceList />
                </div>
            </div>
        </div>
    );
}
