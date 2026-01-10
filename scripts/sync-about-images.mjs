
import fs from 'fs';
import path from 'path';

const PROJECTS_FILE = path.join(process.cwd(), 'src', 'data', 'projects.json');
const ABOUT_FILE = path.join(process.cwd(), 'src', 'data', 'about.json');

function syncAboutImages() {
    try {
        const projectsData = JSON.parse(fs.readFileSync(PROJECTS_FILE, 'utf8'));
        const aboutData = JSON.parse(fs.readFileSync(ABOUT_FILE, 'utf8'));

        const projectMap = new Map(projectsData.projects.map(p => [p.slug, p]));

        console.log(`Loaded ${projectsData.projects.length} projects.`);
        console.log(`Original Trail length: ${aboutData.hero.backgroundTrail.length}`);

        const newTrail = [];

        for (const item of aboutData.hero.backgroundTrail) {
            const project = projectMap.get(item.slug);
            if (project) {
                console.log(`✅ Updating ${item.slug}: ${item.src} -> ${project.cover}`);
                item.src = project.cover;
                newTrail.push(item);
            } else {
                console.warn(`❌ Removing ${item.slug} (Not found in properties)`);
            }
        }

        aboutData.hero.backgroundTrail = newTrail;
        console.log(`New Trail length: ${aboutData.hero.backgroundTrail.length}`);

        fs.writeFileSync(ABOUT_FILE, JSON.stringify(aboutData, null, 2));
        console.log('Successfully updated about.json');

    } catch (e) {
        console.error('Error:', e);
    }
}

syncAboutImages();
