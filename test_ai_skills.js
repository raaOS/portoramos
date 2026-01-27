async function testAi() {
    try {
        console.log('Testing AI Suggest Skills for "Affinity Designer"...');

        const response = await fetch('http://localhost:3000/api/ai/suggest-skills', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ skillName: "Affinity Designer" })
        });

        if (!response.ok) {
            const txt = await response.text();
            throw new Error(`API Error ${response.status}: ${txt}`);
        }

        const data = await response.json();
        console.log('\n--- SUCCESS ---');
        console.log('Skill:', "Affinity Designer");
        console.log('Capabilities Generated:');
        console.log(JSON.stringify(data, null, 2));

    } catch (error) {
        console.error('\n--- FAILED ---');
        console.error(error.message);
    }
}

testAi();
