/**
 * Hard Skill Service — CRUD data keahlian teknis (hard skills).
 *
 * Instansiasi ContentService dengan fallback JSON. Mendukung upload
 * ikon skill ke R2 via storageCleanup.
 *
 * @module hardSkillService
 */
import { HardSkill, HardSkillsData } from '@/types/hardSkill';
import { ContentService } from '@/lib/services/contentService';
import { deleteStorageAsset } from '@/lib/services/storageCleanup';
import hardSkillsDataFallback from '@/data/hardSkills.json';

const service = new ContentService<HardSkillsData>(
  'hardSkills.json',
  hardSkillsDataFallback as unknown as HardSkillsData
);

const DEFAULT_ICON_URLS: Record<string, string> = {
  'hard-ps': 'https://cdn.simpleicons.org/adobephotoshop',
  'hard-ai': 'https://cdn.simpleicons.org/adobeillustrator',
  'hard-figma': 'https://cdn.simpleicons.org/figma',
  'hard-canva': 'https://cdn.simpleicons.org/canva',
};

function getDefaultIconUrl(skill: Pick<HardSkill, 'id' | 'name'>) {
  const normalizedName = skill.name.toLowerCase();
  if (DEFAULT_ICON_URLS[skill.id]) return DEFAULT_ICON_URLS[skill.id];
  if (normalizedName.includes('photoshop')) return DEFAULT_ICON_URLS['hard-ps'];
  if (normalizedName.includes('illustrator')) return DEFAULT_ICON_URLS['hard-ai'];
  if (normalizedName.includes('figma')) return DEFAULT_ICON_URLS['hard-figma'];
  if (normalizedName.includes('canva')) return DEFAULT_ICON_URLS['hard-canva'];
  return 'https://cdn.simpleicons.org/adobecreativecloud';
}

function normalizeHardSkill(
  skill: Partial<HardSkill> & { id: string; name: string },
  index: number
): HardSkill {
  const now = new Date().toISOString();
  return {
    id: skill.id,
    name: skill.name,
    iconUrl: skill.iconUrl || getDefaultIconUrl(skill),
    level: skill.level || 'Intermediate',
    order: typeof skill.order === 'number' ? skill.order : index + 1,
    description: skill.description,
    description_id: skill.description_id,
    isActive: skill.isActive,
    details: skill.details,
    createdAt: skill.createdAt || now,
    updatedAt: skill.updatedAt || now,
  };
}

async function getHardSkills(noCache = false): Promise<HardSkillsData> {
  const data = await service.getData(noCache);

  // Ensure structure
  if (!data || !data.skills) {
    return { skills: [], lastUpdated: new Date().toISOString() };
  }

  return {
    ...data,
    skills: data.skills.map((skill, index) => normalizeHardSkill(skill, index)),
    lastUpdated: data.lastUpdated || new Date().toISOString(),
  };
}

async function saveHardSkills(skills: HardSkill[], message: string): Promise<boolean> {
  const data: HardSkillsData = {
    skills: skills.map((skill, index) => normalizeHardSkill(skill, index)),
    lastUpdated: new Date().toISOString(),
  };
  return await service.saveData(data, message);
}

async function createHardSkill(
  skillData: Omit<HardSkill, 'id' | 'createdAt' | 'updatedAt'>
): Promise<HardSkill> {
  const currentData = await getHardSkills();
  const currentSkills = currentData.skills || [];
  const now = new Date().toISOString();
  const newSkill: HardSkill = {
    id: `hard-${Date.now()}`,
    ...skillData,
    createdAt: now,
    updatedAt: now,
  };

  const updatedSkills = [...currentSkills, newSkill];
  await saveHardSkills(updatedSkills, `Add hard skill: ${newSkill.name}`);

  return newSkill;
}

async function updateHardSkill(id: string, updates: Partial<HardSkill>): Promise<HardSkill | null> {
  const currentData = await getHardSkills();
  const currentSkills = currentData.skills || [];

  const index = currentSkills.findIndex((s) => s.id === id);
  if (index === -1) return null;

  const updatedSkill = {
    ...currentSkills[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  currentSkills[index] = updatedSkill;
  await saveHardSkills(currentSkills, `Update hard skill: ${updatedSkill.name}`);

  return updatedSkill;
}

async function deleteHardSkill(id: string): Promise<boolean> {
  const currentData = await getHardSkills();
  const currentSkills = currentData.skills || [];

  const skillToDelete = currentSkills.find((s) => s.id === id);
  if (!skillToDelete) return false;

  if (skillToDelete.iconUrl) {
    await deleteStorageAsset(skillToDelete.iconUrl, 'HardSkillService');
  }

  const filtered = currentSkills.filter((s) => s.id !== id);
  await saveHardSkills(filtered, `Delete hard skill ID: ${id}`);
  return true;
}

export const hardSkillService = {
  getHardSkills,
  saveHardSkills,
  createHardSkill,
  updateHardSkill,
  deleteHardSkill,
};
