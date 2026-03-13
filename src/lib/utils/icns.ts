/**
 * Lightweight ICNS Parser Utility
 * Extracts PNG/JPEG data from Apple .icns containers.
 */

export interface IcnsImage {
    id: string;
    data: Buffer;
    width: number;
    height: number;
}

const ICNS_TYPES: Record<string, { size: number; os?: number }> = {
    'icp4': { size: 16 },
    'icp5': { size: 32 },
    'icp6': { size: 64 },
    'ic07': { size: 128 },
    'ic08': { size: 256 },
    'ic09': { size: 512 },
    'ic10': { size: 1024 },
    'ic11': { size: 32 }, // 16x16@2x
    'ic12': { size: 64 }, // 32x32@2x
    'ic13': { size: 256 }, // 128x128@2x
    'ic14': { size: 512 }, // 256x256@2x
};

export function extractImagesFromIcns(buffer: Buffer): IcnsImage[] {
    // Check Magic number 'icns'
    if (buffer.toString('utf8', 0, 4) !== 'icns') {
        throw new Error('Not a valid ICNS file');
    }

    const images: IcnsImage[] = [];
    let offset = 8; // Skip Magic(4) and Length(4)

    while (offset < buffer.length) {
        const id = buffer.toString('utf8', offset, offset + 4);
        const size = buffer.readUInt32BE(offset + 4);

        if (size === 0) break;

        const typeInfo = ICNS_TYPES[id];
        if (typeInfo) {
            // Data starts after ID(4) and Size(4)
            const data = buffer.slice(offset + 8, offset + size);

            // Modern ICNS files contain PNG or JPEG 2000 data
            // We skip nested 'icns' headers if they appear inside chunks (rare but happens)
            if (data.slice(0, 4).toString('utf8') !== 'icns') {
                images.push({
                    id,
                    data,
                    width: typeInfo.size,
                    height: typeInfo.size,
                });
            }
        }

        offset += size;
    }

    return images.sort((a, b) => b.width - a.width); // Sort largest first
}

export function getBestImageFromIcns(buffer: Buffer): Buffer | null {
    try {
        const images = extractImagesFromIcns(buffer);
        if (images.length === 0) return null;

        // Return largest image data
        return images[0].data;
    } catch (e) {
        console.error('Failed to extract image from ICNS:', e);
        return null;
    }
}
