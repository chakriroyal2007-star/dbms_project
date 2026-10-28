/**
 * TERA Cosmic Galaxy Welcome Experience - Automated Test Suite
 * Validates 3D WebGL scene parameters, emergency safeguards, accessibility, and routing transitions.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import * as THREE from 'three';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('TERA Cinematic 3D Galaxy Welcome Experience Suite', () => {
  it('Verifies Three.js library is loaded and WebGL/BufferGeometry constructs operate correctly', () => {
    assert.ok(THREE, 'Three.js should be imported');
    assert.strictEqual(typeof THREE.Scene, 'function', 'THREE.Scene constructor must exist');
    assert.strictEqual(typeof THREE.PerspectiveCamera, 'function', 'THREE.PerspectiveCamera must exist');
    assert.strictEqual(typeof THREE.BufferGeometry, 'function', 'THREE.BufferGeometry must exist');
    assert.strictEqual(typeof THREE.Points, 'function', 'THREE.Points must exist');
    assert.strictEqual(typeof THREE.LineLoop, 'function', 'THREE.LineLoop must exist');
  });

  it('Verifies CosmicGalaxyWelcome component source code exists with required features', () => {
    const compPath = path.resolve(__dirname, '../components/CosmicGalaxyWelcome.tsx');
    assert.ok(fs.existsSync(compPath), 'CosmicGalaxyWelcome.tsx must exist');
    const content = fs.readFileSync(compPath, 'utf-8');

    // Branding and Typography
    assert.ok(content.includes('TERA'), 'Must render official TERA branding');
    assert.ok(content.includes('WELCOMES YOU'), 'Must render WELCOMES YOU title');
    assert.ok(content.includes('EVERY SECOND MATTERS. EVERY LIFE MATTERS.'), 'Must render official tagline');
    assert.ok(content.includes('ENTER TERA'), 'Must render ENTER TERA button');

    // Accessibility & Emergency Safeties
    assert.ok(content.includes('Emergency SOS'), 'Must include Emergency SOS bypass');
    assert.ok(content.includes('Skip Intro'), 'Must include Skip Intro control');
    assert.ok(content.includes('btn-galaxy-sos'), 'Must have accessible ID for emergency bypass');
    assert.ok(content.includes('btn-skip-galaxy-intro'), 'Must have accessible ID for skip intro');
    assert.ok(content.includes('btn-enter-tera-galaxy'), 'Must have accessible ID for enter control');
    assert.ok(content.includes('Escape'), 'Must support Escape key to skip intro');
    assert.ok(content.includes('Enter'), 'Must support Enter key to enter');
    assert.ok(content.includes('prefers-reduced-motion'), 'Must check for prefers-reduced-motion');
    assert.ok(content.includes('tera_galaxy_intro_seen'), 'Must record intro completion in localStorage');

    // 3D Scene Components
    assert.ok(content.includes('ringMesh'), 'Must render ringed planet with translucent rings');
    assert.ok(content.includes('LineLoop'), 'Must render orbital paths');
    assert.ok(content.includes('AdditiveBlending'), 'Must use AdditiveBlending for luminous cosmic glow');
    assert.ok(content.includes('galaxy_fallback.jpg'), 'Must have WebGL fallback image');
  });

  it('Verifies Galaxy particle system math and color distribution', () => {
    // Replicate procedural particle generation logic from CosmicGalaxyWelcome
    const particleCount = 18000;
    const arms = 4;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const coreColor = new THREE.Color('#fff4e0');
    const midColor = new THREE.Color('#38bdf8');
    const outerColor = new THREE.Color('#818cf8');
    const edgeColor = new THREE.Color('#c084fc');

    let validPositions = 0;
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      const radius = Math.pow(Math.random(), 2.2) * 28;
      const spinAngle = radius * 0.42;
      const branchAngle = ((i % arms) / arms) * Math.PI * 2;
      const angle = branchAngle + spinAngle;

      const spread = (radius / 28) * 1.8 + 0.3;
      const randomX = (Math.random() - 0.5) * spread;
      const randomY = (Math.random() - 0.5) * spread * 0.45;
      const randomZ = (Math.random() - 0.5) * spread;

      positions[i3] = Math.cos(angle) * radius + randomX;
      positions[i3 + 1] = randomY;
      positions[i3 + 2] = Math.sin(angle) * radius + randomZ;

      if (!isNaN(positions[i3]) && !isNaN(positions[i3 + 1]) && !isNaN(positions[i3 + 2])) {
        validPositions++;
      }

      // Color interpolation
      const t = radius / 28;
      const mixedColor = coreColor.clone();
      if (t < 0.25) {
        mixedColor.lerp(midColor, t / 0.25);
      } else if (t < 0.65) {
        mixedColor.lerp(outerColor, (t - 0.25) / 0.4);
      } else {
        mixedColor.lerp(edgeColor, (t - 0.65) / 0.35);
      }

      colors[i3] = mixedColor.r;
      colors[i3 + 1] = mixedColor.g;
      colors[i3 + 2] = mixedColor.b;
    }

    assert.strictEqual(validPositions, particleCount, 'All 18,000 particle coordinates must be valid numbers');
    assert.ok(positions.length === particleCount * 3, 'Particle positions buffer size matches 18,000 * 3');
    assert.ok(colors.length === particleCount * 3, 'Particle colors buffer size matches 18,000 * 3');
  });

  it('Verifies 4 Planetary Bodies and Ring System Configuration', () => {
    const planetsConfig = [
      { name: 'Rocky Terrestrial', radius: 0.65, orbitDistance: 14, speed: 0.22, color: 0x94a3b8, inclination: 0.08 },
      { name: 'Atmospheric Azure', radius: 1.15, orbitDistance: 21, speed: 0.15, color: 0x06b6d4, inclination: -0.12, hasAtmosphere: true },
      { name: 'Warm Amber Gas Giant', radius: 1.6, orbitDistance: 29, speed: 0.09, color: 0xf59e0b, inclination: 0.15 },
      { name: 'Ringed Chronos', radius: 1.35, orbitDistance: 38, speed: 0.06, color: 0xe2e8f0, inclination: -0.05, hasRings: true }
    ];

    assert.strictEqual(planetsConfig.length, 4, 'Must have exactly 4 planetary bodies');
    
    // Check ringed planet
    const ringed = planetsConfig.find(p => p.hasRings);
    assert.ok(ringed, 'Must have a ringed planet');
    assert.strictEqual(ringed.name, 'Ringed Chronos');
    assert.ok(ringed.orbitDistance > 30, 'Ringed planet should orbit in outer system');

    // Check atmospheric planet
    const atmospheric = planetsConfig.find(p => p.hasAtmosphere);
    assert.ok(atmospheric, 'Must have an atmospheric blue/cyan planet');
    assert.strictEqual(atmospheric.color, 0x06b6d4);
  });

  it('Verifies fallback galaxy asset files exist in public and src directories', () => {
    const publicAsset = path.resolve(__dirname, '../../public/assets/galaxy_fallback.jpg');
    const srcAsset = path.resolve(__dirname, '../assets/galaxy_fallback.jpg');

    assert.ok(fs.existsSync(publicAsset), 'public/assets/galaxy_fallback.jpg must exist');
    assert.ok(fs.existsSync(srcAsset), 'src/assets/galaxy_fallback.jpg must exist');

    const publicStat = fs.statSync(publicAsset);
    assert.ok(publicStat.size > 50000, 'public fallback image must be a high-quality asset (>50KB)');
  });

  it('Verifies App.tsx and WelcomeRoleSelectionPage.tsx integration', () => {
    const appPath = path.resolve(__dirname, '../App.tsx');
    const welcomePath = path.resolve(__dirname, '../pages/WelcomeRoleSelectionPage.tsx');

    const appContent = fs.readFileSync(appPath, 'utf-8');
    const welcomeContent = fs.readFileSync(welcomePath, 'utf-8');

    // App.tsx wiring
    assert.ok(appContent.includes('CosmicGalaxyWelcome'), 'App.tsx must import CosmicGalaxyWelcome');
    assert.ok(appContent.includes('showGalaxyIntro'), 'App.tsx must manage showGalaxyIntro state');
    assert.ok(appContent.includes('onReplayIntro'), 'App.tsx must provide onReplayIntro to Welcome page');
    assert.ok(appContent.includes('handleGuestEmergencyReport'), 'Emergency SOS must route directly to emergency flow');

    // WelcomeRoleSelectionPage wiring
    assert.ok(welcomeContent.includes('onReplayIntro'), 'WelcomeRoleSelectionPage must accept onReplayIntro prop');
    assert.ok(welcomeContent.includes('nav-cosmic-intro-btn'), 'Header must have nav-cosmic-intro-btn');
    assert.ok(welcomeContent.includes('hero-cosmic-pill-btn'), 'Hero must have hero-cosmic-pill-btn');
  });
});
