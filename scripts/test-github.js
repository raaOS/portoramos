const { githubService } = require('../src/lib/github');

async function testGithub() {
    console.log('Testing GitHub Connection...');
    try {
        const file = await githubService.getFile();
        console.log('✅ Success! Fetched current projects.json');
        console.log('Current SHA:', file.sha);
        console.log('Project Count:', file.content.projects.length);
    } catch (error) {
        console.error('❌ Failed:', error);
    }
}

testGithub();
