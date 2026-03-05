import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const data = JSON.parse(readFileSync('./src/data/projects.json', 'utf8'));
const missing = [];
data.projects.forEach(p => {
    const pth = join('./public', p.coverImage);
    if (!existsSync(pth)) missing.push(p.coverImage);
});
console.log("Missing:", missing);
