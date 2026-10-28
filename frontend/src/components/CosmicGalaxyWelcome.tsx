import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { Radio, Compass, RotateCcw } from 'lucide-react';

interface CosmicGalaxyWelcomeProps {
  onEnter: () => void;
  onEmergencySOS?: () => void;
  onSkip?: () => void;
}

interface PlanetInfo {
  id: string;
  name: string;
  type: string;
  distance: string;
  details: string;
}

export const CosmicGalaxyWelcome: React.FC<CosmicGalaxyWelcomeProps> = ({
  onEnter,
  onEmergencySOS,
  onSkip
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [webGlSupported, setWebGlSupported] = useState<boolean>(true);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const [introRevealed, setIntroRevealed] = useState<boolean>(false);
  const [hasInteracted, setHasInteracted] = useState<boolean>(false);
  const [hoveredPlanet, setHoveredPlanet] = useState<PlanetInfo | null>(null);
  const [focusedPlanet, setFocusedPlanet] = useState<PlanetInfo | null>(null);

  const animationFrameRef = useRef<number | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const galaxyGroupRef = useRef<THREE.Group | null>(null);
  const warpStreaksRef = useRef<THREE.LineSegments | null>(null);
  const isEnteringRef = useRef<boolean>(false);
  const transitionProgressRef = useRef<number>(0);
  const openingTimeRef = useRef<number>(0);

  // Drag interaction state
  const dragRef = useRef({
    isDown: false,
    startX: 0,
    startY: 0,
    lastX: 0,
    lastY: 0,
    dragDistance: 0,
    rotX: 0.38,
    rotY: 0,
    targetRotX: 0.38,
    targetRotY: 0,
    velocityX: 0,
    velocityY: 0
  });

  // Mouse parallax state
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });

  // Camera targets for reset or planet focus
  const cameraTargetRef = useRef({
    x: 0,
    y: 7,
    z: 42,
    lookX: 0,
    lookY: 0,
    lookZ: 0
  });

  // Planet meshes for raycasting
  const planetMeshesRef = useRef<Map<THREE.Mesh, PlanetInfo>>(new Map());

  // Handle Enter Activation with Cinematic Hyperspace Warp
  const handleEnterTera = useCallback(() => {
    if (isEnteringRef.current) return;
    isEnteringRef.current = true;
    setIsTransitioning(true);
    localStorage.setItem('tera_galaxy_intro_seen', 'true');

    // Camera accelerates toward core over 1.6s then calls onEnter
    setTimeout(() => {
      onEnter();
    }, 1600);
  }, [onEnter]);

  // Handle Immediate Skip
  const handleSkipIntro = useCallback(() => {
    localStorage.setItem('tera_galaxy_intro_seen', 'true');
    if (onSkip) {
      onSkip();
    } else {
      onEnter();
    }
  }, [onSkip, onEnter]);

  // Reset Camera View to Hero Composition
  const handleResetCamera = useCallback(() => {
    setFocusedPlanet(null);
    cameraTargetRef.current = {
      x: 0,
      y: 7,
      z: 42,
      lookX: 0,
      lookY: 0,
      lookZ: 0
    };
  }, []);

  // Keyboard accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (e.key === 'Enter') {
        handleEnterTera();
      } else if (e.key === 'Escape') {
        handleSkipIntro();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleEnterTera, handleSkipIntro]);

  // Reveal UI typography sequence after initial scene mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setIntroRevealed(true);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  // Three.js Scene Setup & Drag-to-Explore Engine
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Check WebGL availability
    try {
      const testCanvas = document.createElement('canvas');
      const gl = testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl');
      if (!gl) {
        setWebGlSupported(false);
        return;
      }
    } catch {
      setWebGlSupported(false);
      return;
    }

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    const isMobile = width < 768;

    const prefersReducedMotion = typeof window !== 'undefined' && 
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // 1. Scene, Camera, & High-Performance Renderer
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.fog = new THREE.FogExp2(0x010206, 0.0055);

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 2500);
    // Initial cinematic glide starting position
    camera.position.set(0, 14, prefersReducedMotion ? 42 : 75);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: !isMobile,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x010206, 1);
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    // 2. Procedural Textures Helper Functions
    const createStarTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
      grad.addColorStop(0.15, 'rgba(235, 248, 255, 0.95)');
      grad.addColorStop(0.4, 'rgba(56, 189, 248, 0.45)');
      grad.addColorStop(0.7, 'rgba(129, 140, 248, 0.15)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 64, 64);

      const texture = new THREE.CanvasTexture(canvas);
      texture.wrapS = THREE.ClampToEdgeWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;
      return texture;
    };

    const createNebulaTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 128;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
      grad.addColorStop(0.25, 'rgba(168, 85, 247, 0.45)');
      grad.addColorStop(0.55, 'rgba(56, 189, 248, 0.2)');
      grad.addColorStop(0.8, 'rgba(15, 23, 42, 0.05)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 128, 128);

      const texture = new THREE.CanvasTexture(canvas);
      return texture;
    };

    const createAzurePlanetTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 128;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      // Deep ocean blue base
      ctx.fillStyle = '#0369a1';
      ctx.fillRect(0, 0, 256, 128);

      // Continent shapes
      ctx.fillStyle = '#059669';
      for (let i = 0; i < 7; i++) {
        ctx.beginPath();
        const cx = 35 + i * 36;
        const cy = 40 + (i % 3) * 22;
        ctx.arc(cx, cy, 18 + (i % 4) * 4, 0, Math.PI * 2);
        ctx.fill();
      }

      // Swirling white clouds
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      for (let i = 0; i < 12; i++) {
        ctx.beginPath();
        ctx.ellipse(20 + i * 22, 25 + (i % 5) * 18, 25, 7, (i * 0.2), 0, Math.PI * 2);
        ctx.fill();
      }

      return new THREE.CanvasTexture(canvas);
    };

    const createRockyPlanetTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 128;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      // Warm terracotta base
      ctx.fillStyle = '#b45309';
      ctx.fillRect(0, 0, 256, 128);

      // Dark volcanic basalt patches
      ctx.fillStyle = '#78350f';
      for (let i = 0; i < 16; i++) {
        ctx.beginPath();
        ctx.arc(15 + i * 16, 20 + (i % 6) * 16, 8 + (i % 5) * 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // Bright impact craters
      ctx.fillStyle = '#fde68a';
      for (let i = 0; i < 10; i++) {
        ctx.beginPath();
        ctx.arc(25 + i * 24, 30 + (i % 4) * 20, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      return new THREE.CanvasTexture(canvas);
    };

    const createGasGiantTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 128;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      const bands = [
        '#6366f1', '#4f46e5', '#8b5cf6', '#a855f7',
        '#f59e0b', '#d97706', '#7c3aed', '#4338ca'
      ];
      const bandHeight = 128 / bands.length;
      bands.forEach((color, idx) => {
        ctx.fillStyle = color;
        ctx.fillRect(0, idx * bandHeight, 256, bandHeight);
      });

      // Great Storm Oval
      ctx.fillStyle = '#f43f5e';
      ctx.beginPath();
      ctx.ellipse(140, 75, 24, 12, 0, 0, Math.PI * 2);
      ctx.fill();

      return new THREE.CanvasTexture(canvas);
    };

    const createRingTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 32;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      const grad = ctx.createLinearGradient(0, 0, 256, 0);
      grad.addColorStop(0, 'rgba(226, 232, 240, 0)');
      grad.addColorStop(0.12, 'rgba(203, 213, 225, 0.75)');
      grad.addColorStop(0.48, 'rgba(254, 243, 199, 0.9)');
      // Cassini Division gap
      grad.addColorStop(0.55, 'rgba(15, 23, 42, 0.1)');
      grad.addColorStop(0.62, 'rgba(186, 230, 253, 0.8)');
      grad.addColorStop(0.92, 'rgba(226, 232, 240, 0.45)');
      grad.addColorStop(1, 'rgba(226, 232, 240, 0)');

      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 256, 32);

      return new THREE.CanvasTexture(canvas);
    };

    const starTexture = createStarTexture();
    const nebulaTexture = createNebulaTexture();
    const azureTexture = createAzurePlanetTexture();
    const rockyTexture = createRockyPlanetTexture();
    const gasGiantTexture = createGasGiantTexture();
    const ringTexture = createRingTexture();

    // 3. MASTER GALAXY UNIVERSE GROUP (Rotates smoothly during drag-to-explore)
    const galaxyUniverseGroup = new THREE.Group();
    galaxyGroupRef.current = galaxyUniverseGroup;
    galaxyUniverseGroup.rotation.x = dragRef.current.rotX;
    galaxyUniverseGroup.rotation.y = dragRef.current.rotY;
    scene.add(galaxyUniverseGroup);

    // 4. CORE GALAXY BULGE (Dense Radiant White-Gold & Cyan Corona)
    const coreParticleCount = isMobile ? 6000 : 16000;
    const corePositions = new Float32Array(coreParticleCount * 3);
    const coreColors = new Float32Array(coreParticleCount * 3);
    const coreColor = new THREE.Color('#fffdf0');     // Radiant white-gold
    const warmGold = new THREE.Color('#fef08a');      // Warm champagne gold
    const cyanCoreColor = new THREE.Color('#38bdf8'); // Cyan corona

    for (let i = 0; i < coreParticleCount; i++) {
      const i3 = i * 3;
      // Exponential distribution toward exact center
      const r = Math.pow(Math.random(), 3.0) * 16;
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI;

      // Spheroidal bulge with vertical compression
      const x = r * Math.cos(theta) * Math.cos(phi);
      const y = r * Math.sin(phi) * 0.48;
      const z = r * Math.sin(theta) * Math.cos(phi);

      corePositions[i3] = x;
      corePositions[i3 + 1] = y;
      corePositions[i3 + 2] = z;

      const t = Math.min(1, r / 16);
      const pColor = coreColor.clone();
      if (t < 0.3) {
        pColor.lerp(warmGold, t / 0.3);
      } else {
        pColor.copy(warmGold).lerp(cyanCoreColor, (t - 0.3) / 0.7);
      }

      coreColors[i3] = pColor.r;
      coreColors[i3 + 1] = pColor.g;
      coreColors[i3 + 2] = pColor.b;
    }

    const coreGeometry = new THREE.BufferGeometry();
    coreGeometry.setAttribute('position', new THREE.BufferAttribute(corePositions, 3));
    coreGeometry.setAttribute('color', new THREE.BufferAttribute(coreColors, 3));

    const coreMaterial = new THREE.PointsMaterial({
      size: isMobile ? 0.5 : 0.75,
      map: starTexture || undefined,
      transparent: true,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const corePoints = new THREE.Points(coreGeometry, coreMaterial);
    galaxyUniverseGroup.add(corePoints);

    // 5. ENORMOUS SPIRAL ARMS (4 Sweeping Arms + 2 Spurs Extending across Viewport)
    const armParticleCount = isMobile ? 18000 : 48000;
    const galaxyRadius = 88;
    const arms = 4;
    const armPositions = new Float32Array(armParticleCount * 3);
    const armColors = new Float32Array(armParticleCount * 3);

    const goldMidColor = new THREE.Color('#fef08a');
    const cyanArmColor = new THREE.Color('#38bdf8');
    const indigoArmColor = new THREE.Color('#818cf8');
    const violetArmColor = new THREE.Color('#c084fc');
    const magentaEdgeColor = new THREE.Color('#f43f5e');
    const darkDustColor = new THREE.Color('#030712');

    for (let i = 0; i < armParticleCount; i++) {
      const i3 = i * 3;
      // Power curve for natural spiral arm density distribution
      const r = Math.pow(Math.random(), 1.4) * galaxyRadius + 3.5;
      const armIndex = i % arms;
      const armOffsetAngle = (armIndex * 2 * Math.PI) / arms;
      // Logarithmic spiral angle calculation
      const spiralAngle = armOffsetAngle + Math.log(r / 3.8 + 1) * 2.45;

      // Natural arm dispersion that widens outwards
      const spread = (r / galaxyRadius) * 4.2 + 0.7;
      const randomX = (Math.random() - 0.5) * spread * 2.2;
      // Vertical thickness tapers from thick center to thin edges with 3D galactic warp
      const verticalThickness = Math.max(0.6, (1 - r / galaxyRadius) * 4.8);
      const warp = Math.sin(spiralAngle) * Math.pow(r / galaxyRadius, 2) * 4.0;
      const randomY = (Math.random() - 0.5) * verticalThickness + warp;
      const randomZ = (Math.random() - 0.5) * spread * 2.2;

      armPositions[i3] = Math.cos(spiralAngle) * r + randomX;
      armPositions[i3 + 1] = randomY;
      armPositions[i3 + 2] = Math.sin(spiralAngle) * r + randomZ;

      // Progressive color transition across the galaxy disk
      const t = r / galaxyRadius;
      let pColor = cyanArmColor.clone();

      if (t < 0.16) {
        pColor.copy(goldMidColor).lerp(cyanArmColor, t / 0.16);
      } else if (t < 0.48) {
        pColor.copy(cyanArmColor).lerp(indigoArmColor, (t - 0.16) / 0.32);
      } else if (t < 0.78) {
        pColor.copy(indigoArmColor).lerp(violetArmColor, (t - 0.48) / 0.3);
      } else {
        pColor.copy(violetArmColor).lerp(magentaEdgeColor, (t - 0.78) / 0.22);
      }

      // 10% dark interstellar dust lane particles
      if (Math.random() < 0.11) {
        pColor.lerp(darkDustColor, 0.9);
      }

      armColors[i3] = pColor.r;
      armColors[i3 + 1] = pColor.g;
      armColors[i3 + 2] = pColor.b;
    }

    const armGeometry = new THREE.BufferGeometry();
    armGeometry.setAttribute('position', new THREE.BufferAttribute(armPositions, 3));
    armGeometry.setAttribute('color', new THREE.BufferAttribute(armColors, 3));

    const armMaterial = new THREE.PointsMaterial({
      size: isMobile ? 0.42 : 0.58,
      map: starTexture || undefined,
      transparent: true,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const armPoints = new THREE.Points(armGeometry, armMaterial);
    galaxyUniverseGroup.add(armPoints);

    // 6. VOLUMETRIC NEBULA CLOUDS (Layered Depth Across Arms)
    const nebulaCount = isMobile ? 1500 : 4000;
    const nebPositions = new Float32Array(nebulaCount * 3);
    const nebColors = new Float32Array(nebulaCount * 3);

    for (let i = 0; i < nebulaCount; i++) {
      const i3 = i * 3;
      const r = Math.pow(Math.random(), 1.25) * (galaxyRadius * 0.95) + 6;
      const armIndex = i % arms;
      const armOffsetAngle = (armIndex * 2 * Math.PI) / arms;
      const spiralAngle = armOffsetAngle + Math.log(r / 3.8 + 1) * 2.45 + (Math.random() - 0.5) * 0.3;

      const spread = (r / galaxyRadius) * 5.2 + 1.5;
      nebPositions[i3] = Math.cos(spiralAngle) * r + (Math.random() - 0.5) * spread;
      nebPositions[i3 + 1] = (Math.random() - 0.5) * 4.2;
      nebPositions[i3 + 2] = Math.sin(spiralAngle) * r + (Math.random() - 0.5) * spread;

      const t = r / galaxyRadius;
      const nColor = t < 0.5 
        ? cyanArmColor.clone().lerp(violetArmColor, t * 2) 
        : violetArmColor.clone().lerp(magentaEdgeColor, (t - 0.5) * 2);
      nebColors[i3] = nColor.r;
      nebColors[i3 + 1] = nColor.g;
      nebColors[i3 + 2] = nColor.b;
    }

    const nebGeometry = new THREE.BufferGeometry();
    nebGeometry.setAttribute('position', new THREE.BufferAttribute(nebPositions, 3));
    nebGeometry.setAttribute('color', new THREE.BufferAttribute(nebColors, 3));

    const nebMaterial = new THREE.PointsMaterial({
      size: isMobile ? 1.5 : 2.8,
      map: nebulaTexture || starTexture || undefined,
      transparent: true,
      opacity: 0.32,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const nebPoints = new THREE.Points(nebGeometry, nebMaterial);
    galaxyUniverseGroup.add(nebPoints);

    // 7. LUMINOUS GALACTIC CORE FLARINGS & MULTI-TIER HALOS
    const coreGlowGeo = new THREE.SphereGeometry(4.2, 32, 32);
    const coreGlowMat = new THREE.MeshBasicMaterial({
      color: 0xfffae8,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending
    });
    const coreGlow = new THREE.Mesh(coreGlowGeo, coreGlowMat);
    galaxyUniverseGroup.add(coreGlow);

    const midGlowGeo = new THREE.SphereGeometry(10.5, 32, 32);
    const midGlowMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.42,
      blending: THREE.AdditiveBlending
    });
    const midGlow = new THREE.Mesh(midGlowGeo, midGlowMat);
    galaxyUniverseGroup.add(midGlow);

    const outerGlowGeo = new THREE.SphereGeometry(24.0, 32, 32);
    const outerGlowMat = new THREE.MeshBasicMaterial({
      color: 0x6366f1,
      transparent: true,
      opacity: 0.22,
      blending: THREE.AdditiveBlending
    });
    const outerGlow = new THREE.Mesh(outerGlowGeo, outerGlowMat);
    galaxyUniverseGroup.add(outerGlow);

    // 8. 3D FOREGROUND STARS (High Parallax on Drag) & DEEP BACKGROUND FIELD
    const fgStarCount = isMobile ? 2500 : 6000;
    const fgPositions = new Float32Array(fgStarCount * 3);
    const fgColors = new Float32Array(fgStarCount * 3);

    for (let i = 0; i < fgStarCount; i++) {
      const i3 = i * 3;
      const dist = 18 + Math.random() * 160;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      fgPositions[i3] = dist * Math.sin(phi) * Math.cos(theta);
      fgPositions[i3 + 1] = dist * Math.sin(phi) * Math.sin(theta);
      fgPositions[i3 + 2] = dist * Math.cos(phi);

      const isCyan = Math.random() > 0.45;
      fgColors[i3] = isCyan ? 0.75 : 1.0;
      fgColors[i3 + 1] = isCyan ? 0.92 : 0.98;
      fgColors[i3 + 2] = isCyan ? 1.0 : 0.85;
    }

    const fgGeometry = new THREE.BufferGeometry();
    fgGeometry.setAttribute('position', new THREE.BufferAttribute(fgPositions, 3));
    fgGeometry.setAttribute('color', new THREE.BufferAttribute(fgColors, 3));

    const fgMaterial = new THREE.PointsMaterial({
      size: isMobile ? 0.35 : 0.5,
      map: starTexture || undefined,
      transparent: true,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const fgStars = new THREE.Points(fgGeometry, fgMaterial);
    galaxyUniverseGroup.add(fgStars);

    // Deep Space Background Starfield
    const bgStarCount = isMobile ? 2500 : 5000;
    const bgPositions = new Float32Array(bgStarCount * 3);
    const bgColors = new Float32Array(bgStarCount * 3);

    for (let i = 0; i < bgStarCount; i++) {
      const i3 = i * 3;
      const dist = 120 + Math.random() * 400;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      bgPositions[i3] = dist * Math.sin(phi) * Math.cos(theta);
      bgPositions[i3 + 1] = dist * Math.sin(phi) * Math.sin(theta);
      bgPositions[i3 + 2] = dist * Math.cos(phi);

      const isBlue = Math.random() > 0.5;
      bgColors[i3] = isBlue ? 0.7 : 1.0;
      bgColors[i3 + 1] = isBlue ? 0.85 : 0.95;
      bgColors[i3 + 2] = isBlue ? 1.0 : 0.9;
    }

    const bgGeometry = new THREE.BufferGeometry();
    bgGeometry.setAttribute('position', new THREE.BufferAttribute(bgPositions, 3));
    bgGeometry.setAttribute('color', new THREE.BufferAttribute(bgColors, 3));

    const bgMaterial = new THREE.PointsMaterial({
      size: isMobile ? 0.28 : 0.42,
      map: starTexture || undefined,
      transparent: true,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const bgStars = new THREE.Points(bgGeometry, bgMaterial);
    scene.add(bgStars);

    // 9. HYPERSPACE WARP STREAKS (Activates on Enter TERA)
    const warpStreakCount = 600;
    const warpPositions = new Float32Array(warpStreakCount * 6);
    const warpSpeeds = new Float32Array(warpStreakCount);

    for (let i = 0; i < warpStreakCount; i++) {
      const i6 = i * 6;
      const x = (Math.random() - 0.5) * 90;
      const y = (Math.random() - 0.5) * 70;
      const z = (Math.random() - 0.5) * 120 - 20;

      warpPositions[i6] = x;
      warpPositions[i6 + 1] = y;
      warpPositions[i6 + 2] = z;

      warpPositions[i6 + 3] = x;
      warpPositions[i6 + 4] = y;
      warpPositions[i6 + 5] = z - 2.8;

      warpSpeeds[i] = 1.2 + Math.random() * 3.0;
    }

    const warpGeometry = new THREE.BufferGeometry();
    warpGeometry.setAttribute('position', new THREE.BufferAttribute(warpPositions, 3));

    const warpMaterial = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending
    });

    const warpStreaks = new THREE.LineSegments(warpGeometry, warpMaterial);
    warpStreaksRef.current = warpStreaks;
    scene.add(warpStreaks);

    // 10. PLANETARY ORBITAL SYSTEM (Procedurally Textured Bodies + Ringed Chronos)
    interface PlanetRuntime {
      info: PlanetInfo;
      mesh: THREE.Mesh;
      radius: number;
      orbitRadius: number;
      speed: number;
      angle: number;
      inclination: number;
      glowMesh?: THREE.Mesh;
    }

    const planetsData: PlanetRuntime[] = [];
    const planetsConfig = [
      {
        info: {
          id: 'terra-nova',
          name: 'Terra Nova',
          type: 'Atmospheric Azure Terrestrial',
          distance: '24 AU • Sector 1',
          details: 'Cyan atmospheric scattering with ocean continents and dynamic cloud systems.'
        },
        radius: 1.6,
        orbitRadius: 24,
        speed: 0.16,
        inclination: 0.08,
        color: 0x06b6d4,
        map: azureTexture,
        roughness: 0.35,
        hasAtmosphere: true
      },
      {
        info: {
          id: 'ignis-prime',
          name: 'Ignis Prime',
          type: 'Warm Rocky Terrestrial',
          distance: '34 AU • Sector 2',
          details: 'Terracotta basalt crust with volcanic canyons and cratered highlands.'
        },
        radius: 1.1,
        orbitRadius: 34,
        speed: 0.11,
        inclination: -0.12,
        color: 0xf59e0b,
        map: rockyTexture,
        roughness: 0.85
      },
      {
        info: {
          id: 'astraea',
          name: 'Astraea',
          type: 'Banded Jovian Gas Giant',
          distance: '46 AU • Sector 3',
          details: 'Spectacular multi-hued atmospheric cloud bands with turbulent storm vortices.'
        },
        radius: 2.3,
        orbitRadius: 46,
        speed: 0.07,
        inclination: 0.14,
        color: 0x8b5cf6,
        map: gasGiantTexture,
        roughness: 0.5
      },
      {
        info: {
          id: 'chronos',
          name: 'Chronos',
          type: 'Dual-Ring Giant',
          distance: '58 AU • Sector 4',
          details: 'Majestic ice-gold planet surrounded by translucent concentric ring bands.'
        },
        radius: 1.85,
        orbitRadius: 58,
        speed: 0.045,
        inclination: -0.06,
        color: 0xe2e8f0,
        roughness: 0.4,
        hasRings: true
      },
      {
        info: {
          id: 'caelum-prime',
          name: 'Caelum Prime',
          type: 'Icy Outer Dwarf',
          distance: '70 AU • Sector 5',
          details: 'Distant silicate ice body marking the outer boundaries of the orbital system.'
        },
        radius: 0.75,
        orbitRadius: 70,
        speed: 0.03,
        inclination: 0.18,
        color: 0x93c5fd,
        roughness: 0.3
      }
    ];

    planetMeshesRef.current.clear();

    planetsConfig.forEach((cfg, idx) => {
      // 1. Planet Sphere with procedural map or color
      const sphereGeo = new THREE.SphereGeometry(cfg.radius, 32, 32);
      const sphereMat = new THREE.MeshStandardMaterial({
        color: cfg.color,
        map: cfg.map || undefined,
        roughness: cfg.roughness,
        metalness: 0.15
      });
      const planetMesh = new THREE.Mesh(sphereGeo, sphereMat);
      planetMesh.castShadow = true;
      planetMesh.receiveShadow = true;

      // 2. Atmospheric rim glow for Azure
      let glowMesh: THREE.Mesh | undefined;
      if (cfg.hasAtmosphere) {
        const glowGeo = new THREE.SphereGeometry(cfg.radius * 1.25, 32, 32);
        const glowMat = new THREE.MeshBasicMaterial({
          color: 0x38bdf8,
          transparent: true,
          opacity: 0.4,
          blending: THREE.AdditiveBlending,
          side: THREE.BackSide
        });
        glowMesh = new THREE.Mesh(glowGeo, glowMat);
        planetMesh.add(glowMesh);
      }

      // 3. Ring System for Chronos
      if (cfg.hasRings) {
        const ringGeo = new THREE.RingGeometry(cfg.radius * 1.45, cfg.radius * 2.9, 96);
        const ringMat = new THREE.MeshStandardMaterial({
          color: 0xcfd8dc,
          map: ringTexture || undefined,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.85,
          roughness: 0.65
        });
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.rotation.x = Math.PI * 0.44;
        ringMesh.rotation.y = Math.PI * 0.14;
        planetMesh.add(ringMesh);
      }

      // 4. Luminous Orbit Path Ring
      const orbitPoints: THREE.Vector3[] = [];
      const segments = 140;
      for (let s = 0; s <= segments; s++) {
        const theta = (s / segments) * Math.PI * 2;
        const ox = Math.cos(theta) * cfg.orbitRadius;
        const oz = Math.sin(theta) * cfg.orbitRadius;
        const oy = Math.sin(theta) * (cfg.orbitRadius * cfg.inclination);
        orbitPoints.push(new THREE.Vector3(ox, oy, oz));
      }
      const orbitGeo = new THREE.BufferGeometry().setFromPoints(orbitPoints);
      const orbitMat = new THREE.LineBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.22
      });
      const orbitLine = new THREE.LineLoop(orbitGeo, orbitMat);
      galaxyUniverseGroup.add(orbitLine);

      // Register for raycasting & animation
      planetMeshesRef.current.set(planetMesh, cfg.info);
      galaxyUniverseGroup.add(planetMesh);

      planetsData.push({
        info: cfg.info,
        mesh: planetMesh,
        radius: cfg.radius,
        orbitRadius: cfg.orbitRadius,
        speed: cfg.speed * 0.008,
        angle: (idx * Math.PI * 2) / planetsConfig.length,
        inclination: cfg.inclination,
        glowMesh
      });
    });

    // 11. LIGHTING (Central Point Core + Rim Lighting)
    const coreLight = new THREE.PointLight(0xfffaea, 5.0, 250, 1.1);
    coreLight.position.set(0, 0, 0);
    galaxyUniverseGroup.add(coreLight);

    const cyanRimLight = new THREE.DirectionalLight(0x38bdf8, 2.0);
    cyanRimLight.position.set(45, 30, 35);
    scene.add(cyanRimLight);

    const violetFillLight = new THREE.DirectionalLight(0x818cf8, 1.4);
    violetFillLight.position.set(-45, -20, -25);
    scene.add(violetFillLight);

    const ambientLight = new THREE.AmbientLight(0x0a101f, 1.2);
    scene.add(ambientLight);

    // 12. RAYCASTER FOR PLANET HOVER & FOCUS
    const raycaster = new THREE.Raycaster();
    const mouseCoord = new THREE.Vector2();

    // 13. DRAG-TO-EXPLORE POINTER EVENT HANDLERS
    const handlePointerDown = (e: PointerEvent) => {
      // Don't initiate drag if clicking buttons or links
      if ((e.target as HTMLElement).closest('button, a, input')) return;

      dragRef.current.isDown = true;
      dragRef.current.startX = e.clientX;
      dragRef.current.startY = e.clientY;
      dragRef.current.lastX = e.clientX;
      dragRef.current.lastY = e.clientY;
      dragRef.current.dragDistance = 0;
      dragRef.current.velocityX = 0;
      dragRef.current.velocityY = 0;

      container.setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: PointerEvent) => {
      // Smooth pointer parallax on desktop
      if (!prefersReducedMotion) {
        const normX = (e.clientX / window.innerWidth) * 2 - 1;
        const normY = -(e.clientY / window.innerHeight) * 2 + 1;
        mouseRef.current.targetX = normX * 4.0;
        mouseRef.current.targetY = normY * 2.5;
      }

      if (dragRef.current.isDown) {
        const deltaX = e.clientX - dragRef.current.lastX;
        const deltaY = e.clientY - dragRef.current.lastY;

        dragRef.current.dragDistance += Math.hypot(deltaX, deltaY);
        dragRef.current.lastX = e.clientX;
        dragRef.current.lastY = e.clientY;

        // Rotate galaxy group horizontally around Y and tilt vertically around X
        const sensitivity = isMobile ? 0.0075 : 0.0055;
        dragRef.current.targetRotY += deltaX * sensitivity;
        dragRef.current.targetRotX = THREE.MathUtils.clamp(
          dragRef.current.targetRotX + deltaY * (sensitivity * 0.8),
          -0.70,
          0.70
        );

        dragRef.current.velocityX = deltaX * (sensitivity * 0.85);
        dragRef.current.velocityY = deltaY * (sensitivity * 0.65);

        if (dragRef.current.dragDistance > 6 && !hasInteracted) {
          setHasInteracted(true);
        }
      } else {
        // Planet raycasting on hover when not actively dragging
        mouseCoord.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouseCoord.y = -(e.clientY / window.innerHeight) * 2 + 1;
        raycaster.setFromCamera(mouseCoord, camera);

        const meshes = Array.from(planetMeshesRef.current.keys());
        const intersects = raycaster.intersectObjects(meshes, false);

        if (intersects.length > 0) {
          const hitMesh = intersects[0].object as THREE.Mesh;
          const info = planetMeshesRef.current.get(hitMesh);
          if (info) {
            setHoveredPlanet(info);
            container.style.cursor = 'pointer';
            return;
          }
        }
        setHoveredPlanet(null);
        container.style.cursor = dragRef.current.isDown ? 'grabbing' : 'grab';
      }
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (dragRef.current.isDown) {
        dragRef.current.isDown = false;
        try {
          container.releasePointerCapture(e.pointerId);
        } catch {
          // ignore if already released
        }

        // If it was a clean click without significant dragging, check for planet selection
        if (dragRef.current.dragDistance < 5) {
          mouseCoord.x = (e.clientX / window.innerWidth) * 2 - 1;
          mouseCoord.y = -(e.clientY / window.innerHeight) * 2 + 1;
          raycaster.setFromCamera(mouseCoord, camera);

          const meshes = Array.from(planetMeshesRef.current.keys());
          const intersects = raycaster.intersectObjects(meshes, false);

          if (intersects.length > 0) {
            const hitMesh = intersects[0].object as THREE.Mesh;
            const info = planetMeshesRef.current.get(hitMesh);
            if (info) {
              setFocusedPlanet(info);
              const worldPos = new THREE.Vector3();
              hitMesh.getWorldPosition(worldPos);
              cameraTargetRef.current = {
                x: worldPos.x + 4.5,
                y: worldPos.y + 2.5,
                z: worldPos.z + 9.5,
                lookX: worldPos.x,
                lookY: worldPos.y,
                lookZ: worldPos.z
              };
              return;
            }
          }
        }
      }
    };

    container.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);

    // 14. Responsive Resize Listener
    const handleResize = () => {
      if (!mountRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = mountRef.current.clientWidth || window.innerWidth;
      const h = mountRef.current.clientHeight || window.innerHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    // 15. MAIN ANIMATION LOOP
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      const delta = Math.min(clock.getDelta(), 0.1);
      const elapsed = clock.getElapsedTime();
      const speedFactor = prefersReducedMotion ? 0.15 : 1.0;

      // Opening glide camera sequence (glides smoothly from Z=75 to Z=42)
      if (openingTimeRef.current < 4.2 && !prefersReducedMotion && !isEnteringRef.current) {
        openingTimeRef.current += delta;
        const openT = Math.min(1, openingTimeRef.current / 4.2);
        // Smooth ease-out cubic curve
        const easeOut = 1 - Math.pow(1 - openT, 3);
        camera.position.z = THREE.MathUtils.lerp(75, 42, easeOut);
        camera.position.y = THREE.MathUtils.lerp(14, 7, easeOut);
      }

      // Parallax damping
      if (!prefersReducedMotion && !isEnteringRef.current) {
        mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.05;
        mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.05;
      }

      // Inertia & Organic Majestic Galaxy Rotation
      if (!dragRef.current.isDown) {
        dragRef.current.targetRotY += dragRef.current.velocityX;
        dragRef.current.targetRotX += dragRef.current.velocityY;
        dragRef.current.velocityX *= 0.94;
        dragRef.current.velocityY *= 0.94;

        // When inertia settles, maintain majestic baseline idle rotation
        const idleRotationSpeed = isEnteringRef.current ? 0.02 : (0.00075 * speedFactor);
        dragRef.current.targetRotY += idleRotationSpeed;
      }

      // Smooth interpolation of galaxy rotation
      dragRef.current.rotX += (dragRef.current.targetRotX - dragRef.current.rotX) * 0.08;
      dragRef.current.rotY += (dragRef.current.targetRotY - dragRef.current.rotY) * 0.08;
      galaxyUniverseGroup.rotation.x = dragRef.current.rotX;
      galaxyUniverseGroup.rotation.y = dragRef.current.rotY;

      // Background stars slow drift
      bgStars.rotation.y += 0.00012 * speedFactor;

      // Gentle rhythmic breathing pulse on galactic core
      const corePulse = 1 + Math.sin(elapsed * 2.0) * 0.07;
      coreGlow.scale.set(corePulse, corePulse, corePulse);
      midGlow.scale.set(corePulse * 1.02, corePulse * 1.02, corePulse * 1.02);

      // Revolve planets along their inclined orbital paths
      planetsData.forEach((p) => {
        p.angle += p.speed * speedFactor;
        const px = Math.cos(p.angle) * p.orbitRadius;
        const pz = Math.sin(p.angle) * p.orbitRadius;
        const py = Math.sin(p.angle) * (p.orbitRadius * p.inclination);

        p.mesh.position.set(px, py, pz);
        p.mesh.rotation.y += 0.015 * speedFactor;
      });

      // Smooth camera interpolation toward target
      if (!isEnteringRef.current) {
        const hoverX = cameraTargetRef.current.x + (prefersReducedMotion ? 0 : mouseRef.current.x * 0.6);
        const hoverY = cameraTargetRef.current.y + (prefersReducedMotion ? 0 : mouseRef.current.y * 0.6);
        camera.position.x += (hoverX - camera.position.x) * 0.06;
        camera.position.y += (hoverY - camera.position.y) * 0.06;
        camera.position.z += (cameraTargetRef.current.z - camera.position.z) * 0.06;

        camera.lookAt(
          cameraTargetRef.current.lookX,
          cameraTargetRef.current.lookY,
          cameraTargetRef.current.lookZ
        );
      }

      // 16. CINEMATIC HYPERSPACE WARP TRANSITION ON ENTER TERA
      if (isEnteringRef.current) {
        transitionProgressRef.current += delta * 1.15;
        const t = Math.min(1, transitionProgressRef.current);
        const easeIn = Math.pow(t, 2.6);

        // Camera accelerates directly into the brilliant galactic core
        camera.position.z = THREE.MathUtils.lerp(camera.position.z, 0.4, easeIn);
        camera.position.y = THREE.MathUtils.lerp(camera.position.y, 0, easeIn);
        camera.position.x = THREE.MathUtils.lerp(camera.position.x, 0, easeIn);
        camera.lookAt(0, 0, 0);

        // Core light intensifies into blinding radiant flare
        coreLight.intensity = THREE.MathUtils.lerp(5.0, 42.0, easeIn);
        coreGlow.scale.multiplyScalar(1.05);
        midGlow.scale.multiplyScalar(1.04);
        outerGlow.scale.multiplyScalar(1.03);

        // Hyperspace warp lines activate and streak past camera
        if (warpStreaksRef.current) {
          const warpMat = warpStreaksRef.current.material as THREE.LineBasicMaterial;
          warpMat.opacity = Math.min(0.95, t * 1.6);

          const positionsAttr = warpGeometry.attributes.position as THREE.BufferAttribute;
          const posArray = positionsAttr.array as Float32Array;

          for (let i = 0; i < warpStreakCount; i++) {
            const i6 = i * 6;
            posArray[i6 + 2] += warpSpeeds[i] * 4.8;
            posArray[i6 + 5] += warpSpeeds[i] * 4.8;

            // Loop warp lines around camera
            if (posArray[i6 + 2] > 60) {
              posArray[i6 + 2] = -70;
              posArray[i6 + 5] = -72.8;
            }
          }
          positionsAttr.needsUpdate = true;
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    // 17. COMPLETE CLEANUP ON UNMOUNT
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      container.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
      window.removeEventListener('resize', handleResize);

      // Dispose Geometries and Materials
      coreGeometry.dispose();
      coreMaterial.dispose();
      armGeometry.dispose();
      armMaterial.dispose();
      nebGeometry.dispose();
      nebMaterial.dispose();
      fgGeometry.dispose();
      fgMaterial.dispose();
      bgGeometry.dispose();
      bgMaterial.dispose();
      warpGeometry.dispose();
      warpMaterial.dispose();
      coreGlowGeo.dispose();
      coreGlowMat.dispose();
      midGlowGeo.dispose();
      midGlowMat.dispose();
      outerGlowGeo.dispose();
      outerGlowMat.dispose();

      planetsData.forEach((p) => {
        p.mesh.geometry.dispose();
        if (Array.isArray(p.mesh.material)) {
          p.mesh.material.forEach((m) => m.dispose());
        } else {
          p.mesh.material.dispose();
        }
      });

      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-[#010206] select-none text-white font-sans flex flex-col justify-between">
      {/* 1. THREE.JS 3D WEBGL INTERACTION CANVAS */}
      <div 
        ref={mountRef} 
        className="absolute inset-0 z-0 touch-none cursor-grab active:cursor-grabbing"
      />

      {/* 2. HIGH-RES FALLBACK (Active if WebGL fails) */}
      {!webGlSupported && (
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center"
          style={{ backgroundImage: `url('/assets/galaxy_fallback.jpg')` }}
        />
      )}

      {/* Deep Space Vignette & Ambient Radial Shading */}
      <div className="absolute inset-0 z-10 pointer-events-none bg-[radial-gradient(circle_at_50%_50%,rgba(0,0,0,0)_25%,rgba(1,2,6,0.65)_70%,rgba(1,2,6,0.96)_100%)]" />

      {/* 3. TOP CONTROLS: EMERGENCY SOS & SKIP INTRO */}
      <header className="relative z-30 flex items-center justify-between p-5 sm:p-7 md:p-8 max-w-7xl mx-auto w-full pointer-events-none">
        {/* Urgent Emergency SOS Direct Bypass */}
        <button
          onClick={onEmergencySOS || handleEnterTera}
          className="pointer-events-auto group flex items-center gap-2.5 px-4 py-2 sm:px-5 sm:py-2.5 rounded-full bg-rose-600/25 hover:bg-rose-600/45 border border-rose-500/60 hover:border-rose-400 text-rose-200 hover:text-white text-xs font-semibold tracking-wider uppercase transition-all shadow-[0_0_20px_rgba(244,63,94,0.3)] backdrop-blur-md cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
          id="btn-galaxy-sos"
          title="Immediate Emergency Assistance Bypass"
        >
          <Radio className="w-3.5 h-3.5 text-rose-400 group-hover:scale-110 animate-pulse" />
          <span>Emergency SOS</span>
        </button>

        {/* Skip Intro & Keyboard Hint */}
        <div className="pointer-events-auto flex items-center gap-3">
          <span className="hidden sm:inline-block text-[11px] text-slate-400 font-mono">
            Press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700">Enter</kbd> or <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700">Esc</kbd>
          </span>
          <button
            onClick={handleSkipIntro}
            className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-full bg-slate-900/70 hover:bg-slate-800/90 border border-slate-700/70 hover:border-cyan-500/60 text-slate-300 hover:text-white text-xs font-semibold tracking-wide transition-all backdrop-blur-md cursor-pointer hover:shadow-[0_0_15px_rgba(6,182,212,0.25)]"
            id="btn-skip-galaxy-intro"
          >
            Skip Intro
          </button>
        </div>
      </header>

      {/* 4. MATHEMATICALLY ALIGNED SEMANTIC TERA TYPOGRAPHY OVERLAY */}
      <main 
        className={`relative z-20 flex-1 flex flex-col items-center justify-center text-center px-4 max-w-4xl mx-auto w-full pointer-events-none transition-all duration-1000 ${
          introRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        <div className="flex flex-col items-center justify-center space-y-3 sm:space-y-4 w-full">
          {/* 1. Large TERA Geometric Title */}
          <h1 
            className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-[0.25em] -mr-[0.25em] uppercase text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-100 to-cyan-200 drop-shadow-[0_0_40px_rgba(6,182,212,0.65)] leading-none select-none text-center"
            style={{
              fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
              textShadow: '0 0 50px rgba(6, 182, 212, 0.5), 0 0 95px rgba(129, 140, 248, 0.3)'
            }}
          >
            TERA
          </h1>

          {/* 2. Subtitle: WELCOMES YOU */}
          <h2 className="text-xs sm:text-sm md:text-base font-light tracking-[0.40em] -mr-[0.40em] uppercase text-cyan-200 drop-shadow-[0_0_15px_rgba(6,182,212,0.6)] text-center whitespace-nowrap">
            WELCOMES YOU
          </h2>

          {/* 3. Main Tagline */}
          <p className="pt-2 sm:pt-3 text-xs sm:text-sm md:text-base font-semibold tracking-[0.15em] -mr-[0.15em] text-slate-200 uppercase max-w-2xl leading-relaxed text-center">
            EVERY SECOND MATTERS. EVERY LIFE MATTERS.
          </p>

          {/* 4. Official Product Full Form (Exact, Legible, Wrapped Naturally) */}
          <p className="text-xs sm:text-sm md:text-base font-medium tracking-wide text-cyan-300/90 max-w-xl leading-relaxed text-center px-2">
            Temporal Emergency Resource Allocation &amp; Coordination Platform
          </p>

          {/* 5. Glowing Interactive ENTER TERA → Control */}
          <div className="pt-4 sm:pt-6 pointer-events-auto">
            <button
              onClick={handleEnterTera}
              disabled={isTransitioning}
              className="group relative inline-flex items-center gap-3 px-8 py-3.5 sm:px-10 sm:py-4 rounded-full bg-slate-950/85 hover:bg-slate-900 border border-cyan-400/60 hover:border-cyan-300 text-white font-bold text-xs sm:text-sm tracking-[0.22em] uppercase transition-all duration-300 shadow-[0_0_30px_rgba(6,182,212,0.35)] hover:shadow-[0_0_55px_rgba(6,182,212,0.75)] hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-cyan-400"
              id="btn-enter-tera-galaxy"
            >
              {/* Concentric Glow Halo */}
              <span className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-500/25 via-teal-500/20 to-purple-500/25 blur-md group-hover:blur-lg transition-all" />

              <span className="relative z-10 text-white group-hover:text-cyan-200 transition flex items-center gap-2">
                <span>ENTER TERA →</span>
              </span>
            </button>
          </div>
        </div>
      </main>

      {/* 5. FOOTER CONTROLS: INTERACTIVE DRAG HINT & PLANET HUD */}
      <footer className="relative z-30 flex items-center justify-between p-4 sm:p-6 max-w-7xl mx-auto w-full pointer-events-none">
        {/* Subtle Drag-To-Explore Hint (fades out after first interaction) */}
        <div 
          className={`transition-opacity duration-700 flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-950/60 border border-slate-800 text-[11px] font-mono text-slate-400 backdrop-blur-sm ${
            hasInteracted ? 'opacity-0 pointer-events-none' : 'opacity-85'
          }`}
        >
          <Compass className="w-3.5 h-3.5 text-cyan-400 animate-spin" style={{ animationDuration: '8s' }} />
          <span>DRAG TO EXPLORE</span>
        </div>

        {/* Hovered or Focused Planet Info HUD */}
        {(hoveredPlanet || focusedPlanet) && (
          <div className="pointer-events-auto flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-slate-950/90 border border-cyan-500/40 text-left shadow-[0_0_25px_rgba(6,182,212,0.25)] backdrop-blur-md">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                <span className="text-xs font-bold text-white tracking-wide">
                  {(focusedPlanet || hoveredPlanet)?.name}
                </span>
                <span className="text-[10px] text-cyan-400 font-mono">
                  {(focusedPlanet || hoveredPlanet)?.type}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 font-mono">
                {(focusedPlanet || hoveredPlanet)?.distance}
              </p>
            </div>

            {focusedPlanet && (
              <button
                onClick={handleResetCamera}
                className="px-2.5 py-1.5 rounded-lg bg-cyan-950/60 hover:bg-cyan-900 border border-cyan-500/50 text-cyan-300 hover:text-white text-[10px] font-mono flex items-center gap-1 transition cursor-pointer"
                title="Reset Camera View"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset View</span>
              </button>
            )}
          </div>
        )}
      </footer>

      {/* 6. CINEMATIC HYPERSPACE CORE DISSOLVE FLASH */}
      <div 
        className={`fixed inset-0 z-50 pointer-events-none transition-opacity duration-1000 ${
          isTransitioning 
            ? 'opacity-100 bg-gradient-to-b from-white via-cyan-100 to-slate-950' 
            : 'opacity-0'
        }`}
      />
    </div>
  );
};

export default CosmicGalaxyWelcome;
