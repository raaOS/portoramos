const { execSync } = require('child_process');
const readline = require('readline');
const fs = require('fs');

const runTests = (password) => {
    console.log('\n🤖 Robot sedang bersiap... (Target: Localhost)\n');

    try {
        // Run Playwright synchronous so output streams directly to terminal
        execSync('npx playwright test tests/e2e/crud-flow.spec.ts --headed', {
            env: { ...process.env, ADMIN_PASSWORD: password },
            stdio: 'inherit'
        });
        console.log('\n✅ ALL SYSTEMS GREEN. Test Selesai!');
    } catch (e) {
        console.log('\n❌ Ada masalah saat testing. Cek log di atas.');
        // Don't exit process with error to avoid closing window immediately if double clicked
    }
};

// Check if .env.local has the password (simple check)
try {
    const envLocal = fs.readFileSync('.env.local', 'utf8');
    const match = envLocal.match(/ADMIN_PASSWORD=(.+)/);
    if (match && match[1]) {
        console.log('Found ID card in .env.local, proceeding...');
        runTests(match[1].trim());
        process.exit(0);
    }
} catch (e) {
    // Ignore
}

// Check env var
if (process.env.ADMIN_PASSWORD) {
    runTests(process.env.ADMIN_PASSWORD);
} else {
    // Ask user
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    console.log('🔒 Security Check');
    rl.question('Please enter your Admin Password to run the robot: ', (answer) => {
        rl.close();
        if (!answer) {
            console.error('Password is required to test CRUD.');
            process.exit(1);
        }
        runTests(answer);
    });
}
