import React, { useState } from 'react';
import { 
  Eye, CheckCircle2, AlertTriangle, ArrowRight, RotateCcw, 
  Sparkles, Award, Compass, ShieldCheck, HelpCircle
} from 'lucide-react';

interface Hazard {
  id: string;
  name: string;
  box: { x: number; y: number; w: number; h: number };
  danger_reason: string;
  safe_reaction: string;
}

interface HazardLevel {
  level_id: string;
  title: string;
  difficulty: string;
  scene_description: string;
  time_of_day: string;
  weather: string;
  hazards: Hazard[];
}

export interface SpotTheHazardProps {
  levels?: HazardLevel[];
  onCompleteLevel?: (level: number, xp: number) => void;
  onCompleteActivity?: (xp: number, activityId: string, passed: boolean) => void;
  onExit?: () => void;
}

const DEFAULT_LEVELS: HazardLevel[] = [
  {
    level_id: "lvl_urban_crossing",
    title: "Level 1: Alipiri Road Pedestrian Dilemma",
    difficulty: "EASY",
    scene_description: "Busy urban junction near pedestrian crossing with merging auto-rickshaws and school children.",
    time_of_day: "Daylight (08:30 AM)",
    weather: "Clear",
    hazards: [
      {
        id: "hz_child_cross",
        name: "Child Crossing Near Blind Spot",
        box: { x: 320, y: 340, w: 80, h: 90 },
        danger_reason: "A small child is stepping off the curb between parked autorickshaws without adult supervision.",
        safe_reaction: "Immediately decelerate, cover the brake, and maintain a 3-meter safety cushion."
      },
      {
        id: "hz_door_open",
        name: "Parked Vehicle Door Opening",
        box: { x: 120, y: 380, w: 90, h: 80 },
        danger_reason: "Driver in stationary taxi is opening the right-side door into the active flow of cyclists.",
        safe_reaction: "Leave at least 1 door-width distance (1.5m) when passing parked vehicles."
      },
      {
        id: "hz_tailgater",
        name: "Aggressive Tailgating Two-Wheeler",
        box: { x: 620, y: 410, w: 70, h: 80 },
        danger_reason: "Following scooter is within 1 meter of your rear bumper at 40 km/h.",
        safe_reaction: "Gradually ease speed to encourage them to pass safely; do not brake check."
      }
    ]
  }
];

export const SpotTheHazardGame: React.FC<SpotTheHazardProps> = ({
  levels: propLevels,
  onCompleteLevel,
  onCompleteActivity,
  onExit
}) => {
  const [activeLevels, setActiveLevels] = useState<HazardLevel[]>(propLevels || DEFAULT_LEVELS);
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
  const [foundHazardIds, setFoundHazardIds] = useState<string[]>([]);
  const [activeHazardInfo, setActiveHazardInfo] = useState<Hazard | null>(null);
  const [totalXp, setTotalXp] = useState(0);
  const [hintActive, setHintActive] = useState(false);

  const currentLevel = activeLevels[currentLevelIndex] || activeLevels[0];

  const handleSpotHazard = (hazard: Hazard) => {
    if (foundHazardIds.includes(hazard.id)) {
      setActiveHazardInfo(hazard);
      return;
    }

    const updated = [...foundHazardIds, hazard.id];
    setFoundHazardIds(updated);
    setActiveHazardInfo(hazard);
    setTotalXp(prev => prev + 25);

    if (onCompleteActivity) {
      onCompleteActivity(25, hazard.id, true);
    }

    if (updated.length === currentLevel.hazards.length) {
      if (onCompleteActivity) {
        onCompleteActivity(50, currentLevel.level_id, true);
      }
      if (onCompleteLevel) {
        onCompleteLevel(currentLevelIndex + 1, 75);
      }
    }
  };

  const handleNextLevel = () => {
    if (currentLevelIndex + 1 < activeLevels.length) {
      setCurrentLevelIndex(prev => prev + 1);
      setFoundHazardIds([]);
      setActiveHazardInfo(null);
      setHintActive(false);
    }
  };

  const handleRestartLevel = () => {
    setFoundHazardIds([]);
    setActiveHazardInfo(null);
    setHintActive(false);
  };

  if (!currentLevel) {
    return <div className="p-8 text-center text-zinc-400 font-mono">Loading hazard levels...</div>;
  }

  const isLevelCompleted = foundHazardIds.length === currentLevel.hazards.length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto font-sans">
      {/* Top Header & Level Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-800 font-mono text-xs">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded bg-amber-950 text-amber-300 border border-amber-800/40 font-bold text-[10px] uppercase">
            LEVEL {currentLevelIndex + 1}: {currentLevel.difficulty}
          </span>
          <span className="text-zinc-500">•</span>
          <span className="text-zinc-300 font-semibold">{currentLevel.title}</span>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-zinc-400 text-[11px]">
            Found: <strong className="text-cyan-400">{foundHazardIds.length}</strong> / {currentLevel.hazards.length} Hazards
          </span>
          <button
            onClick={() => setHintActive(!hintActive)}
            className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>{hintActive ? 'Hide Outlines' : 'Reveal Hints'}</span>
          </button>
        </div>
      </div>

      {/* Main Interactive Scene Canvas Container */}
      <div className="rounded-2xl overflow-hidden bg-[#070B14] border border-zinc-800 shadow-2xl relative select-none">
        {/* Interactive Visual Traffic Scene (Vector Canvas) */}
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-gradient-to-b from-[#09101F] via-[#0E172B] to-[#070B14]">
          {/* Ambient Scene Backdrop SVG */}
          <svg className="w-full h-full absolute inset-0" viewBox="0 0 1000 562.5" preserveAspectRatio="none">
            {/* Sky & Horizon */}
            <defs>
              <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0B1329" />
                <stop offset="60%" stopColor="#131D38" />
                <stop offset="100%" stopColor="#1A2748" />
              </linearGradient>
              <linearGradient id="roadGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1E293B" />
                <stop offset="100%" stopColor="#0F172A" />
              </linearGradient>
            </defs>
            <rect width="1000" height="300" fill="url(#skyGrad)" />
            
            {/* Distant Buildings / Horizon line */}
            <path d="M 0,260 L 50,230 L 100,240 L 140,210 L 220,250 L 320,220 L 400,255 L 520,205 L 620,245 L 750,225 L 850,250 L 1000,235 L 1000,300 L 0,300 Z" fill="#111B33" opacity="0.6" />
            
            {/* Asphalt Road Perspective */}
            <polygon points="150,562.5 850,562.5 620,280 380,280" fill="url(#roadGrad)" />
            
            {/* Road Markings / Center Dashes */}
            <line x1="500" y1="285" x2="500" y2="330" stroke="#FBBF24" strokeWidth="3" opacity="0.8" />
            <line x1="500" y1="355" x2="500" y2="420" stroke="#FBBF24" strokeWidth="5" opacity="0.8" />
            <line x1="500" y1="455" x2="500" y2="560" stroke="#FBBF24" strokeWidth="8" opacity="0.8" />

            {/* Sidewalks / Curbs */}
            <polygon points="0,562.5 150,562.5 380,280 340,280" fill="#1E293B" opacity="0.8" />
            <polygon points="850,562.5 1000,562.5 660,280 620,280" fill="#1E293B" opacity="0.8" />

            {/* Visual Graphic Representation of Elements */}
            {/* Crosswalk Zebra Stripes */}
            <polygon points="360,330 640,330 660,350 340,350" fill="#FFFFFF" opacity="0.15" />
            <polygon points="320,380 680,380 710,405 290,405" fill="#FFFFFF" opacity="0.2" />

            {/* Illustrative Car & Truck Silhouettes */}
            {/* Van / Truck ahead */}
            <rect x="420" y="240" width="160" height="90" rx="8" fill="#1E293B" stroke="#334155" strokeWidth="2" />
            <rect x="440" y="255" width="120" height="40" rx="4" fill="#0F172A" />

            {/* Left Pedestrian Area */}
            <circle cx="280" cy="380" r="16" fill="#0284C7" opacity="0.7" />
            <line x1="280" y1="396" x2="280" y2="440" stroke="#0284C7" strokeWidth="8" strokeLinecap="round" opacity="0.7" />

            {/* Right parked vehicle */}
            <rect x="680" y="340" width="160" height="100" rx="10" fill="#0F172A" stroke="#334155" strokeWidth="2" />
            {/* Open door angle */}
            <line x1="680" y1="380" x2="630" y2="410" stroke="#EF4444" strokeWidth="5" strokeLinecap="round" />
          </svg>

          {/* Interactive Clickable Hotspots overlaying the scene */}
          {currentLevel.hazards.map((hazard) => {
            const isFound = foundHazardIds.includes(hazard.id);
            const isSelected = activeHazardInfo?.id === hazard.id;

            return (
              <button
                key={hazard.id}
                onClick={() => handleSpotHazard(hazard)}
                style={{
                  left: `${hazard.box.x}%`,
                  top: `${hazard.box.y}%`,
                  width: `${hazard.box.w}%`,
                  height: `${hazard.box.h}%`,
                }}
                className={`absolute rounded-xl transition-all cursor-pointer flex items-center justify-center ${
                  isFound
                    ? 'border-2 border-emerald-400 bg-emerald-500/20 shadow-lg shadow-emerald-500/30'
                    : hintActive
                    ? 'border-2 border-dashed border-amber-400/80 bg-amber-500/10 animate-pulse'
                    : 'border border-transparent hover:border-cyan-400/60 hover:bg-cyan-500/10'
                }`}
                title={isFound ? hazard.name : "Tap to inspect hazard"}
              >
                {isFound && (
                  <div className="w-7 h-7 rounded-full bg-emerald-500 text-zinc-950 flex items-center justify-center font-bold text-xs shadow-md animate-in zoom-in-75">
                    ✓
                  </div>
                )}
              </button>
            );
          })}

          {/* Bottom HUD Overlay */}
          <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between pointer-events-none">
            <span className="text-[11px] font-mono text-zinc-300 bg-black/70 px-3 py-1 rounded-lg backdrop-blur-md border border-zinc-800">
              💡 Scan the scene: Tap potential hazards before they cause an accident
            </span>
            <span className="text-[11px] font-mono font-bold text-cyan-400 bg-black/70 px-3 py-1 rounded-lg backdrop-blur-md border border-cyan-800/40">
              Score: +{totalXp} XP
            </span>
          </div>
        </div>

        {/* Hazard Detail Drawer / Callout when tapped */}
        {activeHazardInfo && (
          <div className="p-5 sm:p-6 bg-[#0E1526] border-t border-zinc-800 space-y-3 animate-in slide-in-from-bottom-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <h4 className="text-base font-bold text-white tracking-tight">
                  {activeHazardInfo.name}
                </h4>
              </div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded border border-emerald-800/40">
                HAZARD IDENTIFIED (+25 XP)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
              <div className="p-3.5 rounded-xl bg-black/40 border border-zinc-800/80 space-y-1">
                <span className="text-[10px] font-mono font-bold text-rose-400 uppercase tracking-wider block">
                  The Hidden Danger:
                </span>
                <p className="text-zinc-300 leading-relaxed">
                  {activeHazardInfo.danger_reason}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-black/40 border border-cyan-900/40 space-y-1">
                <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider block">
                  Defensive Action:
                </span>
                <p className="text-cyan-100 leading-relaxed font-mono">
                  {activeHazardInfo.safe_reaction}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Level Complete Banner */}
        {isLevelCompleted && (
          <div className="p-6 bg-gradient-to-r from-emerald-950/60 via-[#0E1E26] to-cyan-950/60 border-t border-emerald-600/40 flex flex-wrap items-center justify-between gap-4 animate-in fade-in">
            <div className="flex items-center gap-3">
              <Award className="w-8 h-8 text-emerald-400 shrink-0" />
              <div>
                <h4 className="text-base font-bold text-white font-mono">
                  ALL HAZARDS IDENTIFIED IN THIS SCENE!
                </h4>
                <p className="text-xs text-zinc-300 font-sans">
                  You spotted all {currentLevel.hazards.length} hazards in {currentLevel.title}. Excellent hazard perception!
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 font-mono text-xs">
              <button
                onClick={handleRestartLevel}
                className="px-3.5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Replay</span>
              </button>
              {currentLevelIndex + 1 < activeLevels.length && (
                <button
                  onClick={handleNextLevel}
                  className="px-5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold transition-all shadow-lg shadow-cyan-500/20 flex items-center gap-2 cursor-pointer"
                >
                  <span>Next Level</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
