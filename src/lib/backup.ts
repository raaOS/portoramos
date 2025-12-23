import { promises as fs } from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'src', 'data');

export const createBackup = async (filePath: string) => {
  try {
    const backupPath = filePath.replace('.json', '.backup.json');
    await fs.copyFile(filePath, backupPath);
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ Backup created: ${backupPath}`);
    }
  } catch (error) {
    console.error('❌ Backup failed:', error);
  }
};

export const loadData = async (filePath: string) => {
  try {
    // Coba load data utama dulu
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch {
    // Kalau gagal, load backup
    const backupPath = filePath.replace('.json', '.backup.json');
    try {
      const backupData = await fs.readFile(backupPath, 'utf8');
      if (process.env.NODE_ENV === 'development') {
        console.log(`⚠️ Using backup data: ${backupPath}`);
      }
      return JSON.parse(backupData);
    } catch {
      console.error('❌ Both main and backup data failed');
      return null;
    }
  }
};

export const saveData = async (filePath: string, data: any) => {
  try {
    // 1. Backup dulu
    await createBackup(filePath);

    // 2. Save data baru
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ Data saved: ${filePath}`);
    }
    return true;
  } catch (error) {
    console.error('❌ Save failed:', error);
    return false;
  }
};

export const ensureDataDir = async () => {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (error) {
    console.error('❌ Failed to create data directory:', error);
  }
};
