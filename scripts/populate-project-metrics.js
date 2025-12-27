const fs = require('fs');
const path = require('path');

const projectsFile = path.join(__dirname, '../src/data/projects.json');

function run() {
    console.log("📊 Populating project metrics (Likes & Shares)...");

    if (!fs.existsSync(projectsFile)) {
        console.error("❌ projects.json not found!");
        return;
    }

    const data = JSON.parse(fs.readFileSync(projectsFile, 'utf8'));

    data.projects = data.projects.map(project => {
        // Add likes (100-500) and shares (20-100) if not present or just refresh them
        return {
            ...project,
            likes: Math.floor(Math.random() * 401) + 100,
            shares: Math.floor(Math.random() * 81) + 20
        };
    });

    fs.writeFileSync(projectsFile, JSON.stringify(data, null, 2));
    console.log(`✅ Successfully updated ${data.projects.length} projects with random metrics.`);
}

run();
