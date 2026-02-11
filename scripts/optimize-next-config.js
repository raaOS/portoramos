#!/usr/bin/env node

/**
 * Optimize Next.js Configuration
 * Updates next.config.mjs with performance optimizations
 */

const fs = require('fs');
const path = require('path');

function optimizeNextConfig() {
  console.log('⚙️  Optimizing Next.js configuration...');
  
  const configPath = path.join(process.cwd(), 'next.config.mjs');
  const optimizedConfigPath = path.join(process.cwd(), 'next.config.optimized.mjs');
  
  if (fs.existsSync(optimizedConfigPath)) {
    console.log('📁 Found optimized config, applying...');
    
    // Backup current config
    const backupPath = path.join(process.cwd(), 'next.config.backup.mjs');
    if (fs.existsSync(configPath)) {
      fs.copyFileSync(configPath, backupPath);
      console.log('💾 Backed up current config to next.config.backup.mjs');
    }
    
    // Apply optimized config
    fs.copyFileSync(optimizedConfigPath, configPath);
    console.log('✅ Applied optimized configuration');
    
    return {
      success: true,
      message: 'Configuration optimized successfully'
    };
  } else {
    console.log('❌ Optimized config not found');
    return {
      success: false,
      message: 'next.config.optimized.mjs not found'
    };
  }
}

function validateConfig() {
  const configPath = path.join(process.cwd(), 'next.config.mjs');
  
  if (!fs.existsSync(configPath)) {
    return {
      valid: false,
      message: 'next.config.mjs not found'
    };
  }
  
  try {
    const content = fs.readFileSync(configPath, 'utf8');
    
    const optimizations = [
      {
        name: 'React Compiler',
        found: content.includes('reactCompiler: true')
      },
      {
        name: 'SWC Minification',
        found: content.includes('swcMinify: true')
      },
      {
        name: 'Image Optimization',
        found: content.includes('formats:') && content.includes('image/avif')
      },
      {
        name: 'Bundle Splitting',
        found: content.includes('splitChunks')
      },
      {
        name: 'PWA Support',
        found: content.includes('withPWA')
      }
    ];
    
    const appliedCount = optimizations.filter(opt => opt.found).length;
    
    return {
      valid: true,
      optimizations,
      appliedCount,
      totalCount: optimizations.length
    };
  } catch (error) {
    return {
      valid: false,
      message: error.message
    };
  }
}

function main() {
  console.log('🔧 Next.js Configuration Optimizer\n');
  
  const result = optimizeNextConfig();
  
  if (result.success) {
    console.log('\n📊 Validating configuration...');
    const validation = validateConfig();
    
    if (validation.valid) {
      console.log(`\n✅ Configuration is valid`);
      console.log(`📈 Optimizations applied: ${validation.appliedCount}/${validation.totalCount}`);
      
      if (validation.appliedCount < validation.totalCount) {
        console.log('\n⚠️  Some optimizations may not be applied:');
        validation.optimizations.forEach(opt => {
          if (!opt.found) {
            console.log(`   • ${opt.name}: Not found`);
          }
        });
      }
    } else {
      console.log(`\n❌ Validation failed: ${validation.message}`);
    }
  } else {
    console.log(`\n❌ Optimization failed: ${result.message}`);
  }
  
  return result.success;
}

if (require.main === module) {
  const success = main();
  process.exit(success ? 0 : 1);
}

module.exports = { optimizeNextConfig, validateConfig };