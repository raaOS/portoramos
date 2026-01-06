import fs from 'fs';
import path from 'path';
import https from 'https';
import { pipeline } from 'stream';
import { promisify } from 'util';

const pipelineAsync = promisify(pipeline);

const ASSETS_DIR = path.resolve('public/assets/media');

const FILES_TO_RECOVER = [
    {
        url: 'https://res.cloudinary.com/dcb3dslfw/video/upload/v1766857273/AQMRJH0BtqJVJdw_PX1iLNUZuM7OjhI8KOt8dAx5yn6ryPif1yfQ7wrl9s7ZaP3J-J9oYFbOy8QKyVRA8dUAtzm738de-P5C_yuiotv.mp4',
        filename: 'manipulasi-foto-musik-alam-cover.mp4'
    },
    {
        url: 'https://res.cloudinary.com/dcb3dslfw/image/upload/v1766511410/71182738_1401283963356534_8000667800149668246_n._afmhq4.jpg',
        filename: 'manipulasi-foto-musik-alam-comparison-before.jpg'
    }
];

async function downloadFile(url, filepath) {
    return new Promise((resolve, reject) => {
        https.get(url, (response) => {
            if (response.statusCode !== 200) {
                reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
                return;
            }
            const fileStream = fs.createWriteStream(filepath);
            pipelineAsync(response, fileStream)
                .then(() => resolve())
                .catch((err) => reject(err));
        }).on('error', (err) => reject(err));
    });
}

async function main() {
    console.log('Starting media recovery for Manipulasi Project...');

    for (const file of FILES_TO_RECOVER) {
        const start = Date.now();
        const filepath = path.join(ASSETS_DIR, file.filename);
        console.log(`Downloading ${file.filename}...`);
        try {
            await downloadFile(file.url, filepath);
            const end = Date.now();
            console.log(`✓ Downloaded ${file.filename} in ${(end - start) / 1000}s`);
        } catch (error) {
            console.error(`✗ Failed to download ${file.filename}:`, error);
        }
    }

    console.log('Recovery complete.');
}

main();
