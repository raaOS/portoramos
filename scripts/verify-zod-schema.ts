
import { ProjectSchema } from '../src/lib/validations/project';
import projectsData from '../src/data/projects.json';

async function verify() {
    console.log('🔍 Verifying ' + projectsData.projects.length + ' projects against Zod Schema...');

    let passed = 0;
    let failed = 0;

    projectsData.projects.forEach((p, index) => {
        const result = ProjectSchema.safeParse(p);
        if (result.success) {
            passed++;
        } else {
            failed++;
            const f = result.error.format();
            const keys = Object.keys(f).filter(k => k !== '_errors' && (f as any)[k]._errors);
            console.error(`❌ [${index}] ${p.title.slice(0, 20)}... -> Bad Fields: ${keys.join(', ')}`);
        }
    });

    console.log('\n-----------------------------------');
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log('-----------------------------------');

    if (failed > 0) {
        console.log('⚠️  Zod is acting as a "Hindrance" (Strict Gatekeeper) for legacy data.');
        console.log('Recommended Action: Update legacy data or relax schema.');
    } else {
        console.log('✨ Zod is a "Helper" (All clear). System is stable.');
    }
}

verify();
