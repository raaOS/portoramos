const fs = require('fs');
const path = require('path');

const filePath = path.join('c:', 'Users', 'USER', 'Documents', 'portfolio-shared', 'src', 'data', 'projects.json');

try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(fileContent);

    data.projects = data.projects.map(project => {
        if (project.slug === 'kampanye-hadiah-digital-liburan') {
            return { ...project, software: ['canva', 'photoshop'] };
        } else {
            return { ...project, software: ['photoshop'] };
        }
    });

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    console.log("Successfully updated projects.json with software metadata using Node.js.");
} catch (error) {
    console.error("Error updating projects.json:", error);
    process.exit(1);
}
