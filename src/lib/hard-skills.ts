import fs from 'fs';
import path from 'path';

// Define the Hard Skill type
export interface HardSkill {
    id: string;
    name: string;
    icon: string;
    level: string;
    color: string; // Hex color
    details: string[]; // List of capabilities
}

// Path to the JSON file
const dataPath = path.join(process.cwd(), 'src/data/hard-skills.json');

// Ensure data directory exists
const ensureDataDir = () => {
    const dir = path.dirname(dataPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    // Create initial file if not exists
    if (!fs.existsSync(dataPath)) {
        fs.writeFileSync(dataPath, '[]', 'utf8');
    }
};

export async function getHardSkills(): Promise<HardSkill[]> {
    ensureDataDir();
    try {
        const fileContents = fs.readFileSync(dataPath, 'utf8');
        return JSON.parse(fileContents);
    } catch (error) {
        console.error('Error reading hard skills data:', error);
        return [];
    }
}

export async function saveHardSkills(skills: HardSkill[]): Promise<boolean> {
    ensureDataDir();
    try {
        fs.writeFileSync(dataPath, JSON.stringify(skills, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error('Error saving hard skills data:', error);
        return false;
    }
}
