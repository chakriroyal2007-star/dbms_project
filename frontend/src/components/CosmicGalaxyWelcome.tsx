import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { ArrowRight, AlertTriangle, Radio, Sparkles, Volume2, VolumeX, EyeOff, RotateCcw } from 'lucide-react';

interface CosmicGalaxyWelcomeProps {
  onEnter: () => void;
  onEmergencySOS?: () => void;
  onSkip?: () => void;
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
  const animationFrameRef = useRef<number | null>(null);

  // References for camera transition
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const transitionProgressRef = useRef<number>(0);
  const isEnteringRef = useRef<boolean>(false);

  // Mouse parallax state
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });

  // Handle Enter Activation with Cinematic Camera Warp
  const handleEnterTera = useCallback(() => {
    if (isEnteringRef.current) return;
    isEnteringRef.current = true;
    setIsTransitioning(true);
    localStorage.setItem('tera_galaxy_intro_seen', 'true');

    // Camera accelerates toward core over 1.2s then calls onEnter
    setTimeout(() => {
      onEnter();
    }, 1100);
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

  // Keyboard accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleEnterTera();
      } else if (e.key === 'Escape') {
        handleSkipIntro();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleEnterTera, handleSkipIntro]);

  // Subtle reveal of UI overlay after initial scene mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setIntroRevealed(true);
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  // Three.js Scene Setup
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

    // 1. Scene & Camera Setup
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.fog = new THREE.FogExp2(0x020409, 0.008);

    const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 1500);
    camera.position.set(0, 8, 48);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x020409, 1);
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    // 2. Helper: Circular Soft Particle Texture
    const createStarTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
      grad.addColorStop(0.2, 'rgba(190, 230, 255, 0.85)');
      grad.addColorStop(0.5, 'rgba(120, 160, 255, 0.35)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 64, 64);

      const texture = new THREE.CanvasTexture(canvas);
      texture.wrapS = THREE.ClampToEdgeWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;
      return texture;
    };

    const starTexture = createStarTexture();

    // 3. Spiral Galaxy Particle Geometry
    const isMobile = width < 768;
    const particleCount = isMobile ? 8000 : 18000;
    const galaxyRadius = 32;
    const arms = 4;
    const spin = 1.4;

    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const scales = new Float32Array(particleCount);

    const coreColor = new THREE.Color(0xfff3d1);      // Warm white-gold core
    const cyanColor = new THREE.Color(0x38bdf8);      // Electric cyan inner arms
    const violetColor = new THREE.Color(0xa855f7);    // Deep violet mid arms
    const magentaColor = new THREE.Color(0xec4899);   // Magenta outer nebula
    const dustColor = new THREE.Color(0x0f172a);      // Contrast dust lanes

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;

      // Distance from center (power curve for core concentration)
      const r = Math.pow(Math.random(), 1.6) * galaxyRadius;
      const armAngle = ((i % arms) * 2 * Math.PI) / arms;
      const spiralAngle = armAngle + (r * spin * 0.12);

      // Random scatter spread (closer to core = spherical, further = flat disc)
      const coreFactor = Math.max(0, 1 - r / (galaxyRadius * 0.3));
      const scatterSpread = THREE.MathUtils.lerp(0.6, 2.2, r / galaxyRadius);

      const randomX = (Math.random() - 0.5) * scatterSpread * 2.2;
      const randomY = (Math.random() - 0.5) * THREE.MathUtils.lerp(2.5, 0.8, r / galaxyRadius) + (coreFactor * (Math.random() - 0.5) * 4);
      const randomZ = (Math.random() - 0.5) * scatterSpread * 2.2;

      positions[i3] = Math.cos(spiralAngle) * r + randomX;
      positions[i3 + 1] = randomY;
      positions[i3 + 2] = Math.sin(spiralAngle) * r + randomZ;

      // Color distribution based on radius and dust lanes
      const mixRatio = Math.min(1, r / (galaxyRadius * 0.85));
      let particleColor = coreColor.clone();

      if (r < galaxyRadius * 0.22) {
        // Galactic nucleus
        particleColor.lerp(coreColor, 0.9);
      } else if (r < galaxyRadius * 0.5) {
        // Inner spiral arms: Cyan to Violet
        particleColor.copy(cyanColor).lerp(violetColor, (r - galaxyRadius * 0.22) / (galaxyRadius * 0.28));
      } else {
        // Outer spiral arms: Violet to Magenta
        particleColor.copy(violetColor).lerp(magentaColor, (r - galaxyRadius * 0.5) / (galaxyRadius * 0.5));
      }

      // Add occasional darker dust lanes
      if (Math.random() < 0.08) {
        particleColor.lerp(dustColor, 0.8);
      }

      colors[i3] = particleColor.r;
      colors[i3 + 1] = particleColor.g;
      colors[i3 + 2] = particleColor.b;

      // Varying particle sizes
      scales[i] = (Math.random() * 0.7 + 0.3) * (r < 6 ? 1.6 : 1.0);
    }

    const galaxyGeometry = new THREE.BufferGeometry();
    galaxyGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    galaxyGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    galaxyGeometry.setAttribute('scale', new THREE.BufferAttribute(scales, 1));

    const galaxyMaterial = new THREE.PointsMaterial({
      size: isMobile ? 0.32 : 0.42,
      map: starTexture || undefined,
      transparent: true,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const galaxyPoints = new THREE.Points(galaxyGeometry, galaxyMaterial);
    // Tilt the galaxy plane slightly for a cinematic three-quarters perspective
    galaxyPoints.rotation.x = 0.45;
    galaxyPoints.rotation.z = -0.15;
    scene.add(galaxyPoints);

    // 4. Luminous Galactic Core Flare
    const coreGlowGeo = new THREE.SphereGeometry(2.5, 32, 32);
    const coreGlowMat = new THREE.MeshBasicMaterial({
      color: 0xfff7db,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending
    });
    const coreGlow = new THREE.Mesh(coreGlowGeo, coreGlowMat);
    galaxyPoints.add(coreGlow);

    const outerGlowGeo = new THREE.SphereGeometry(6.5, 32, 32);
    const outerGlowMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.22,
      blending: THREE.AdditiveBlending
    });
    const outerGlow = new THREE.Mesh(outerGlowGeo, outerGlowMat);
    galaxyPoints.add(outerGlow);

    // 5. Deep Space Background Starfield
    const bgStarCount = isMobile ? 1500 : 3500;
    const bgPositions = new Float32Array(bgStarCount * 3);
    const bgColors = new Float32Array(bgStarCount * 3);

    for (let i = 0; i < bgStarCount; i++) {
      const i3 = i * 3;
      const dist = THREE.MathUtils.randFloat(180, 500);
      const theta = THREE.MathUtils.randFloat(0, Math.PI * 2);
      const phi = THREE.MathUtils.randFloat(0, Math.PI);

      bgPositions[i3] = dist * Math.sin(phi) * Math.cos(theta);
      bgPositions[i3 + 1] = dist * Math.sin(phi) * Math.sin(theta);
      bgPositions[i3 + 2] = dist * Math.cos(phi);

      // Star colors: faint blue-white to subtle warm stars
      const tint = Math.random();
      if (tint > 0.8) {
        bgColors[i3] = 1.0; bgColors[i3 + 1] = 0.9; bgColors[i3 + 2] = 0.8;
      } else if (tint > 0.4) {
        bgColors[i3] = 0.7; bgColors[i3 + 1] = 0.85; bgColors[i3 + 2] = 1.0;
      } else {
        bgColors[i3] = 0.9; bgColors[i3 + 1] = 0.95; bgColors[i3 + 2] = 1.0;
      }
    }

    const bgStarGeo = new THREE.BufferGeometry();
    bgStarGeo.setAttribute('position', new THREE.BufferAttribute(bgPositions, 3));
    bgStarGeo.setAttribute('color', new THREE.BufferAttribute(bgColors, 3));

    const bgStarMat = new THREE.PointsMaterial({
      size: 0.5,
      map: starTexture || undefined,
      transparent: true,
      opacity: 0.7,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const bgStars = new THREE.Points(bgStarGeo, bgStarMat);
    scene.add(bgStars);

    // 6. Orbital Planetary System
    interface OrbitingPlanet {
      pivot: THREE.Group;
      mesh: THREE.Mesh;
      ring?: THREE.Mesh;
      radius: number;
      speed: number;
      angle: number;
    }

    const planets: OrbitingPlanet[] = [];

    // Helper: Create Luminous Orbital Path Rings
    const createOrbitLine = (radius: number, colorHex: number = 0x38bdf8, opacity: number = 0.18) => {
      const segments = 128;
      const pts = [];
      for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        pts.push(new THREE.Vector3(Math.cos(theta) * radius, 0, Math.sin(theta) * radius));
      }
      const orbitGeo = new THREE.BufferGeometry().setFromPoints(pts);
      const orbitMat = new THREE.LineBasicMaterial({
        color: colorHex,
        transparent: true,
        opacity: opacity,
        blending: THREE.AdditiveBlending
      });
      const orbitLine = new THREE.LineLoop(orbitGeo, orbitMat);
      orbitLine.rotation.x = 0.45;
      orbitLine.rotation.z = -0.15;
      scene.add(orbitLine);
      return orbitLine;
    };

    // Planet 1: Rocky Terrestrial Planet (Fast inner orbit)
    createOrbitLine(12, 0x38bdf8, 0.16);
    const p1Pivot = new THREE.Group();
    p1Pivot.rotation.x = 0.45;
    p1Pivot.rotation.z = -0.15;
    scene.add(p1Pivot);

    const p1Geo = new THREE.SphereGeometry(0.7, 32, 32);
    const p1Mat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.8,
      metalness: 0.2
    });
    const p1Mesh = new THREE.Mesh(p1Geo, p1Mat);
    p1Mesh.position.x = 12;
    p1Pivot.add(p1Mesh);
    planets.push({ pivot: p1Pivot, mesh: p1Mesh, radius: 12, speed: 0.008, angle: 0.8 });

    // Planet 2: Vibrant Blue-Cyan Planet with Atmosphere
    createOrbitLine(18, 0x06b6d4, 0.22);
    const p2Pivot = new THREE.Group();
    p2Pivot.rotation.x = 0.45;
    p2Pivot.rotation.z = -0.15;
    scene.add(p2Pivot);

    const p2Geo = new THREE.SphereGeometry(1.4, 32, 32);
    const p2Mat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.5,
      metalness: 0.1
    });
    const p2Mesh = new THREE.Mesh(p2Geo, p2Mat);
    p2Mesh.position.x = 18;
    p2Pivot.add(p2Mesh);

    // Atmospheric rim glow for Planet 2
    const p2AtmGeo = new THREE.SphereGeometry(1.55, 32, 32);
    const p2AtmMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.25,
      blending: THREE.AdditiveBlending
    });
    const p2Atm = new THREE.Mesh(p2AtmGeo, p2AtmMat);
    p2Mesh.add(p2Atm);
    planets.push({ pivot: p2Pivot, mesh: p2Mesh, radius: 18, speed: 0.005, angle: 2.4 });

    // Planet 3: Warm Golden Terrestrial Planet
    createOrbitLine(25, 0xf59e0b, 0.18);
    const p3Pivot = new THREE.Group();
    p3Pivot.rotation.x = 0.45;
    p3Pivot.rotation.z = -0.15;
    scene.add(p3Pivot);

    const p3Geo = new THREE.SphereGeometry(1.0, 32, 32);
    const p3Mat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      roughness: 0.7,
      metalness: 0.2
    });
    const p3Mesh = new THREE.Mesh(p3Geo, p3Mat);
    p3Mesh.position.x = 25;
    p3Pivot.add(p3Mesh);
    planets.push({ pivot: p3Pivot, mesh: p3Mesh, radius: 25, speed: 0.0035, angle: 4.1 });

    // Planet 4: Majestic Ringed Saturn-like Planet
    createOrbitLine(34, 0xa855f7, 0.2);
    const p4Pivot = new THREE.Group();
    p4Pivot.rotation.x = 0.45;
    p4Pivot.rotation.z = -0.15;
    scene.add(p4Pivot);

    const p4Geo = new THREE.SphereGeometry(1.8, 32, 32);
    const p4Mat = new THREE.MeshStandardMaterial({
      color: 0xc084fc,
      roughness: 0.6,
      metalness: 0.15
    });
    const p4Mesh = new THREE.Mesh(p4Geo, p4Mat);
    p4Mesh.position.x = 34;
    p4Pivot.add(p4Mesh);

    // Translucent Saturnian Planetary Rings
    const ringGeo = new THREE.RingGeometry(2.3, 4.2, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xe9d5ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI / 2.3;
    ringMesh.rotation.y = 0.2;
    p4Mesh.add(ringMesh);
    planets.push({ pivot: p4Pivot, mesh: p4Mesh, ring: ringMesh, radius: 34, speed: 0.002, angle: 5.2 });

    // 7. Lighting
    const coreLight = new THREE.PointLight(0xfff7ed, 3.5, 120);
    coreLight.position.set(0, 0, 0);
    scene.add(coreLight);

    const cyanRimLight = new THREE.DirectionalLight(0x06b6d4, 1.2);
    cyanRimLight.position.set(-20, 25, 30);
    scene.add(cyanRimLight);

    const ambientLight = new THREE.AmbientLight(0x0f172a, 0.9);
    scene.add(ambientLight);

    const prefersReducedMotion = typeof window !== 'undefined' && 
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // 8. Mouse Parallax Listeners
    const handleMouseMove = (e: MouseEvent) => {
      if (prefersReducedMotion) return;
      const normX = (e.clientX / window.innerWidth) * 2 - 1;
      const normY = -(e.clientY / window.innerHeight) * 2 + 1;
      mouseRef.current.targetX = normX * 4.5;
      mouseRef.current.targetY = normY * 3.0;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // 9. Resize Listener
    const handleResize = () => {
      if (!mountRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = mountRef.current.clientWidth || window.innerWidth;
      const h = mountRef.current.clientHeight || window.innerHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    // 10. Animation Loop
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();
      const speedFactor = prefersReducedMotion ? 0.15 : 1.0;

      // Smooth mouse parallax damping
      if (!prefersReducedMotion) {
        mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.04;
        mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.04;
      }

      // Gentle galaxy rotation
      galaxyPoints.rotation.y += 0.0012 * speedFactor;
      bgStars.rotation.y += 0.0003 * speedFactor;

      // Gentle pulse on core flare
      const corePulse = 1 + Math.sin(elapsed * 2.0) * 0.06;
      coreGlow.scale.set(corePulse, corePulse, corePulse);

      // Revolve planets along their orbits
      planets.forEach((p) => {
        p.angle += p.speed;
        p.mesh.position.x = Math.cos(p.angle) * p.radius;
        p.mesh.position.z = Math.sin(p.angle) * p.radius;
        // Planet self-rotation
        p.mesh.rotation.y += 0.015;
      });

      // Handle Warp Camera Transition on Enter TERA
      if (isEnteringRef.current) {
        transitionProgressRef.current += delta * 1.5;
        const t = Math.min(1, transitionProgressRef.current);
        // Exponential ease-in forward camera glide straight through galactic core
        const easeIn = Math.pow(t, 2.5);
        camera.position.z = THREE.MathUtils.lerp(48, 1.2, easeIn);
        camera.position.y = THREE.MathUtils.lerp(8, 0, easeIn);
        camera.position.x = THREE.MathUtils.lerp(camera.position.x, 0, easeIn);

        // Core light intensifies into blinding white flash
        coreLight.intensity = THREE.MathUtils.lerp(3.5, 30.0, easeIn);
        outerGlow.scale.multiplyScalar(1.03);
      } else {
        // Natural camera hover float
        const hoverX = Math.sin(elapsed * 0.4) * 0.8 + mouseRef.current.x;
        const hoverY = 8 + Math.cos(elapsed * 0.3) * 0.6 + mouseRef.current.y;
        camera.position.x += (hoverX - camera.position.x) * 0.05;
        camera.position.y += (hoverY - camera.position.y) * 0.05;
        camera.lookAt(0, 0, 0);
      }

      renderer.render(scene, camera);
    };

    animate();

    // 11. Complete Cleanup on Unmount
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);

      // Dispose Three.js objects to prevent GPU memory leaks
      galaxyGeometry.dispose();
      galaxyMaterial.dispose();
      bgStarGeo.dispose();
      bgStarMat.dispose();
      coreGlowGeo.dispose();
      coreGlowMat.dispose();
      outerGlowGeo.dispose();
      outerGlowMat.dispose();
      p1Geo.dispose();
      p1Mat.dispose();
      p2Geo.dispose();
      p2Mat.dispose();
      p2AtmGeo.dispose();
      p2AtmMat.dispose();
      p3Geo.dispose();
      p3Mat.dispose();
      p4Geo.dispose();
      p4Mat.dispose();
      ringGeo.dispose();
      ringMat.dispose();

      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-[#020409] select-none text-white font-sans">
      {/* 1. THREE.JS 3D WEBGL CANVAS MOUNT */}
      <div 
        ref={mountRef} 
        className="absolute inset-0 z-0 pointer-events-auto cursor-grab active:cursor-grabbing"
      />

      {/* 2. HIGH-RES PROCEDURAL BACKDROP FALLBACK (Active if WebGL fails or as atmospheric ambient) */}
      {!webGlSupported && (
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center transition-opacity duration-1000"
          style={{ backgroundImage: `url('/assets/galaxy_fallback.jpg')` }}
        />
      )}

      {/* Vignette & Deep Space Radial Falloff */}
      <div className="absolute inset-0 z-10 pointer-events-none bg-[radial-gradient(circle_at_50%_50%,rgba(0,0,0,0)_35%,rgba(2,4,9,0.75)_80%,rgba(2,4,9,0.98)_100%)]" />

      {/* 3. TOP EMERGENCY & ACCESSIBILITY CONTROLS */}
      <header className="relative z-30 flex items-center justify-between p-6 md:p-8 max-w-7xl mx-auto w-full">
        {/* Urgent Emergency SOS Direct Bypass */}
        <button
          onClick={onEmergencySOS || handleEnterTera}
          className="group flex items-center gap-2.5 px-4 py-2 rounded-full bg-rose-600/20 hover:bg-rose-600/40 border border-rose-500/50 hover:border-rose-400 text-rose-200 text-xs font-semibold tracking-wider uppercase transition shadow-lg shadow-rose-600/20 backdrop-blur-md"
          id="btn-galaxy-sos"
          title="Immediate Emergency Assistance Bypass"
        >
          <Radio className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
          <span>Emergency SOS</span>
        </button>

        {/* Skip Intro & Keyboard Hint */}
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline-block text-[11px] text-slate-400 font-mono">
            Press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700">Enter</kbd> or <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700">Esc</kbd>
          </span>
          <button
            onClick={handleSkipIntro}
            className="px-4 py-2 rounded-full bg-slate-900/60 hover:bg-slate-800/80 border border-slate-700/60 hover:border-cyan-500/50 text-slate-300 hover:text-white text-xs font-semibold tracking-wide transition backdrop-blur-md"
            id="btn-skip-galaxy-intro"
          >
            Skip Intro
          </button>
        </div>
      </header>

      {/* 4. CINEMATIC TERA BRANDING OVERLAY */}
      <main className={`relative z-20 flex-1 flex flex-col items-center justify-center text-center px-4 max-w-4xl mx-auto min-h-[calc(100vh-160px)] transition-all duration-1000 ${
        introRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}>
        {/* Subtle Brand Star Crest */}
        <div className="mb-4 inline-flex items-center justify-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500/20 via-teal-400/20 to-emerald-400/20 border border-cyan-400/40 p-0.5 shadow-[0_0_25px_rgba(6,182,212,0.4)] backdrop-blur-md">
            <div className="w-full h-full bg-[#030611]/80 rounded-[14px] flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-cyan-300 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Official Geometric TERA Brand Title */}
        <h1 
          className="text-6xl sm:text-8xl md:text-9xl font-black tracking-[0.18em] uppercase text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-100 to-cyan-300 drop-shadow-[0_0_35px_rgba(6,182,212,0.6)] leading-none select-none"
          style={{
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            textShadow: '0 0 40px rgba(6, 182, 212, 0.45), 0 0 80px rgba(168, 85, 247, 0.25)'
          }}
        >
          TERA
        </h1>

        {/* WELCOMES YOU */}
        <div className="mt-3 flex items-center justify-center gap-3 w-full max-w-md">
          <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-cyan-400/40 to-cyan-400/80" />
          <h2 className="text-xs sm:text-sm md:text-base font-light tracking-[0.38em] uppercase text-cyan-200 drop-shadow-[0_0_15px_rgba(6,182,212,0.6)] whitespace-nowrap px-2">
            WELCOMES YOU
          </h2>
          <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent via-cyan-400/40 to-cyan-400/80" />
        </div>

        {/* Tagline */}
        <p className="mt-6 text-[11px] sm:text-xs md:text-sm font-mono tracking-[0.22em] text-slate-300 uppercase max-w-lg leading-relaxed">
          EVERY SECOND MATTERS. EVERY LIFE MATTERS.
        </p>

        {/* Subtitle / System Identification */}
        <p className="mt-1 text-[10px] text-cyan-400/80 font-mono tracking-wider">
          Tirupati Emergency Resource Allocation & Multi-Agency Coordination Platform
        </p>

        {/* 5. GLOWING INTERACTIVE ENTER CONTROL */}
        <div className="mt-12">
          <button
            onClick={handleEnterTera}
            disabled={isTransitioning}
            className="group relative inline-flex items-center gap-3 px-8 py-3.5 rounded-full bg-slate-950/80 hover:bg-slate-900 border border-cyan-400/60 hover:border-cyan-300 text-white font-bold text-xs sm:text-sm tracking-[0.2em] uppercase transition-all duration-300 shadow-[0_0_30px_rgba(6,182,212,0.35)] hover:shadow-[0_0_50px_rgba(6,182,212,0.7)] hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-md"
            id="btn-enter-tera-galaxy"
          >
            {/* Concentric Glow Halo */}
            <span className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-500/20 to-purple-500/20 blur-md group-hover:blur-lg transition-all" />

            <span className="relative z-10 text-white group-hover:text-cyan-200 transition">
              ENTER TERA
            </span>
            <ArrowRight className="relative z-10 w-4 h-4 text-cyan-400 group-hover:translate-x-1.5 transition-transform duration-300" />
          </button>
        </div>
      </main>

      {/* 6. CINEMATIC FLASH / HYPERSPACE TRANSITION OVERLAY */}
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
