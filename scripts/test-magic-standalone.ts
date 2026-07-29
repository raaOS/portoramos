import { resolve } from 'path';
import { config } from 'dotenv';
import { generateAiCommentsWithFallback } from '../src/app/api/admin/projects/magic-complete/route';

config({ path: resolve(process.cwd(), '.env.local') });

async function runStandaloneTest() {
  console.log('--- RUNNING STANDALONE AI COMMENTS GENERATOR TEST (OPENROUTER) ---');
  console.log('Using OpenRouter API Key:', process.env.OPENROUTER_API_KEY ? 'DEFINED' : 'NOT DEFINED');

  const start = Date.now();
  try {
    const comments = await generateAiCommentsWithFallback({
      slug: 'test-standalone-project',
      count: 3,
      tone: 'casual',
      reply: true,
      projectTitle: 'Interactive 3D Art Gallery',
      projectDescription: 'A Three.js web application showcasing interactive 3D modeling and lighting effects in a custom shaders environment.',
      reqUrl: 'http://localhost:3000',
    });

    console.log(`\n✅ Completed in ${((Date.now() - start) / 1000).toFixed(2)} seconds!`);
    console.log('Generated Comments Output:');
    console.log(JSON.stringify(comments, null, 2));
  } catch (err: any) {
    console.error('❌ Standalone test failed:', err.message || err);
  }
}

runStandaloneTest();
