import * as dotenv from 'dotenv';
import path from 'path';
import { bootstrapD1Schema, getMissingD1EnvKeys, isD1Configured } from '../../src/lib/cloudflareD1';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function main() {
    if (!isD1Configured()) {
        throw new Error(`Cloudflare D1 env is incomplete. Missing: ${getMissingD1EnvKeys().join(', ')}`);
    }

    await bootstrapD1Schema();
    console.log('Cloudflare D1 schema is ready.');
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
