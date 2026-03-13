/**
 * Script untuk sync workflowSteps dari about.json ke Firebase
 * Usage: node scripts/sync-workflow-to-firebase.js
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getDatabase } = require('firebase-admin/database');
const fs = require('fs');
const path = require('path');

// Load service account
const serviceAccountPath = path.join(__dirname, '../service-account.json');
if (!fs.existsSync(serviceAccountPath)) {
    console.error('❌ service-account.json not found!');
    process.exit(1);
}

// Initialize Firebase
const serviceAccount = require(serviceAccountPath);
initializeApp({
    credential: cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL || 'https://ramos-portfolio-chat-default-rtdb.asia-southeast1.firebasedatabase.app'
});

const db = getDatabase();

// Load about.json
const aboutData = require('../src/data/about.json');

async function syncWorkflow() {
    try {
        console.log('🔄 Syncing workflowSteps to Firebase...\n');
        
        const designPhilosophy = aboutData.designPhilosophy;
        
        console.log('📊 Data from JSON:');
        console.log(`   - Heading: ${designPhilosophy.heading}`);
        console.log(`   - Legacy steps: ${designPhilosophy.steps?.length || 0}`);
        console.log(`   - Workflow steps: ${designPhilosophy.workflowSteps?.length || 0}`);
        
        if (!designPhilosophy.workflowSteps || designPhilosophy.workflowSteps.length === 0) {
            console.error('❌ No workflowSteps found in about.json!');
            process.exit(1);
        }
        
        console.log('\n📋 Workflow Steps:');
        designPhilosophy.workflowSteps.forEach(step => {
            console.log(`   ${step.number}. ${step.title} (${step.subSteps?.length || 0} sub-steps)`);
        });
        
        // Update Firebase
        const ref = db.ref('content/about/designPhilosophy');
        await ref.set(designPhilosophy);
        
        // Update lastUpdated
        await db.ref('content/about/lastUpdated').set(new Date().toISOString());
        
        console.log('\n✅ Successfully synced to Firebase!');
        console.log('📝 Clear browser cache and refresh to see changes.');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Sync failed:', error);
        process.exit(1);
    }
}

syncWorkflow();
