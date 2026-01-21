import SimpleSplineViewer from './_components/SimpleSplineViewer';
import DesktopEnvironment from './_components/os/DesktopEnvironment';
import { loadAboutData } from '@/lib/about';
import { loadExperienceData } from '@/lib/experience';
import { loadHardSkillsData } from '@/lib/hardSkills';

// Force dynamic since we are fetching data
export const revalidate = 0;

export default async function AboutTestPage() {
    const [aboutData, experienceData, hardSkillsData] = await Promise.all([
        loadAboutData(),
        loadExperienceData(),
        loadHardSkillsData()
    ]);

    return (
        <main className="h-screen w-full bg-[#050505] overflow-hidden">
            <DesktopEnvironment
                aboutData={aboutData}
                experienceData={experienceData}
                hardSkillsData={hardSkillsData}
            >
                {/* The Spline Scene as Background/Wallpaper */}
                <div className="w-full h-full opacity-60">
                    <SimpleSplineViewer />
                </div>
            </DesktopEnvironment>
        </main>
    );
}
