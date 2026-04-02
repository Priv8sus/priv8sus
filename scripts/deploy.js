#!/usr/bin/env node
import { spawn } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const ROOT_DIR = join(__dirname, '..');
const API_DIR = join(ROOT_DIR, 'api');
const FRONTEND_DIR = join(ROOT_DIR, 'frontend');
const DATA_DIR = join(API_DIR, 'data');

const commands = {
  build: 'npm run build',
  start: 'npm start',
  'build:frontend': 'npm run build:frontend',
};

function ensureDirectories() {
  console.log('📁 Ensuring directories exist...');
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
    console.log(`  Created ${DATA_DIR}`);
  }
}

function runCommand(cmd, cwd, label) {
  return new Promise((resolve, reject) => {
    console.log(`\n🚀 ${label}...`);
    const [command, ...args] = cmd.split(' ');
    const proc = spawn(command, args, { cwd, stdio: 'inherit', shell: true });

    proc.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ ${label} completed`);
        resolve(code);
      } else {
        console.error(`❌ ${label} failed with code ${code}`);
        reject(new Error(`${label} failed with code ${code}`));
      }
    });
  });
}

async function deploy(mode = 'development') {
  console.log('===========================================');
  console.log('🏀 Sports Stats Estimator Deployment');
  console.log(`   Mode: ${mode}`);
  console.log('===========================================');

  try {
    ensureDirectories();

    const env = mode === 'production' ? 'production' : 'development';
    
    await runCommand('npm run build', API_DIR, 'Building API (TypeScript → JS)');
    
    if (mode !== 'api-only') {
      await runCommand('npm run build', FRONTEND_DIR, 'Building Frontend (React)');
    }

    console.log('\n===========================================');
    console.log('✅ Build complete!');
    console.log('===========================================');
    console.log('\n📋 Next steps:');
    console.log('1. Set environment variables in .env');
    console.log('2. Run: npm start');
    console.log('3. API available at http://localhost:3000');
    console.log('\n📝 Environment variables needed:');
    console.log('   PORT (default: 3000)');
    console.log('   NODE_ENV (development/production)');
    console.log('   BALLDONTLIE_API_KEY (optional)');
    console.log('   DATABASE_PATH (default: ./data/predictions.db)');
    console.log('===========================================\n');

  } catch (error) {
    console.error('\n❌ Deployment failed:', error.message);
    process.exit(1);
  }
}

const mode = process.argv[2] || 'development';
deploy(mode);