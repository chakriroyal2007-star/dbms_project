import React, { useState } from 'react';
import { 
  Compass, ShieldCheck, Car, Bike, AlertTriangle, 
  CheckCircle2, ArrowRight, RotateCcw, Sparkles, Award, MapPin
} from 'lucide-react';

interface JourneyStep {
  category: string;
  question: string;
  options: {
    title: string;
    description: string;
    safetyPoints: number;
    feedback: string;
  }[];
}

const JOURNEY_STEPS: JourneyStep[] = [
  {
    category: "1. PROTECTIVE RESTRAINT & GEAR",
    question: "What protective gear and restraint configuration do you verify before departure?",
    options: [
      {
        title: "Full ISI/ECE Helmet Fastened / All Occupants Buckled",
        description: "Front and rear passengers wear 3-point belts; children secured in rear ISOFIX seats; two-wheeler riders wear strapped helmets.",
        safetyPoints: 20,
        feedback: "Gold standard! Rear seatbelts prevent occupants from becoming human projectiles, reducing fatal ejection risk by 85%."
      },
      {
        title: "Front Belts Only / Open Chin Strap",
        description: "Driver wears belt; rear passengers ride unbuckled; helmet resting loosely on head.",
        safetyPoints: 5,
        feedback: "High risk: In a 50 km/h collision, an unstrapped helmet flies off before impact, and unbuckled rear occupants crush front seat occupants."
      }
    ]
  },
  {
    category: "2. VEHICLE READINESS & TIRES",
    question: "How do you inspect the vehicle's roadworthiness before hitting the highway?",
    options: [
      {
        title: "Cold Tire Pressure, Tread Depth & Fluid Verification",
        description: "Check tire pressures (including spare), verify minimum 2.5mm tread depth, check brake fluid and washer fluid.",
        safetyPoints: 20,
        feedback: "Crucial! Underinflated tires generate excessive heat at highway speeds, leading to tread separation and fatal blowouts."
      },
      {
        title: "Visual Glance at Bodywork Only",
        description: "Check fuel level and drive off immediately without checking tire pressure or brake fluid.",
        safetyPoints: 5,
        feedback: "Worn or underinflated tires account for over 30% of expressway rollover crashes during high-speed travel."
      }
    ]
  },
  {
    category: "3. DRIVER REST & COGNITIVE READINESS",
    question: "What is your sleep and physical preparation prior to the trip?",
    options: [
      {
        title: "7-8 Hours Restful Sleep & Zero Alcohol Commitment",
        description: "Fully rested, hydrated, zero alcohol consumed in previous 24 hours, healthy light meal.",
        safetyPoints: 20,
        feedback: "Outstanding! A driver with fewer than 5 hours of sleep has the same cognitive reaction latency as someone driving above the legal alcohol limit."
      },
      {
        title: "Late Night Sleep (3-4 Hours) + Heavy Energy Drink",
        description: "Sleeping late after work and relying on caffeine to power through the 4-hour drive.",
        safetyPoints: 0,
        feedback: "Severe hazard! Caffeine wears off unpredictably, leading to sudden involuntary micro-sleeps behind the wheel."
      }
    ]
  },
  {
    category: "4. DISTRACTION & PHONE PROTOCOL",
    question: "How will you handle incoming phone calls, WhatsApp messages, and route navigation?",
    options: [
      {
        title: "Do Not Disturb Activated / Dashboard Phone Mount for GPS",
        description: "Navigation pre-programmed, phone audio muted, emergency calls routed through passenger or taken only when parked.",
        safetyPoints: 20,
        feedback: "Defensive excellence! Eliminates manual, visual, and cognitive distraction during critical traffic merges."
      },
      {
        title: "Holding Phone in Hand for Periodic Glance",
        description: "Glancing at messages at red lights or low-speed sections while balancing phone on lap.",
        safetyPoints: 0,
        feedback: "Extreme danger! Texting or handling a phone increases crash likelihood by over 2300% (23x)."
      }
    ]
  },
  {
    category: "5. FATIGUE MANAGEMENT & PACING",
    question: "How do you pace the 250 km highway journey?",
    options: [
      {
        title: "Planned 15-Minute Break Every 2 Hours / 120 km",
        description: "Stopping at designated service plazas to stretch, hydrate, and rest eyes before fatigue sets in.",
        safetyPoints: 20,
        feedback: "Optimal defensive pacing! Breaking monotony prevents highway hypnosis and resets visual focus."
      },
      {
        title: "Non-Stop Drive to 'Beat the Traffic'",
        description: "Pushing through without breaks to save 20 minutes of travel time.",
        safetyPoints: 0,
        feedback: "Fatigue accumulates exponentially after 90 minutes of continuous highway focus, slowing reaction speed dramatically."
      }
    ]
  }
];

export interface BuildSafeJourneyProps {
  onComplete?: (safetyIndex: number, xp: number) => void;
  onCompleteActivity?: (xp: number, activityId: string, passed: boolean) => void;
  onExit?: () => void;
}

export const BuildSafeJourneyGame: React.FC<BuildSafeJourneyProps> = ({
  onComplete,
  onCompleteActivity,
  onExit
}) => {
  const [selectedVehicle, setSelectedVehicle] = useState<'BIKE' | 'CAR' | 'SUV'>('CAR');
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [decisions, setDecisions] = useState<number[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);

  const currentStep = JOURNEY_STEPS[currentStepIndex];

  const handleSelectOption = (optionIndex: number) => {
    const updated = [...decisions, optionIndex];
    setDecisions(updated);

    if (currentStepIndex + 1 < JOURNEY_STEPS.length) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      setIsCompleted(true);
      // Calculate score
      let total = 0;
      updated.forEach((choiceIdx, stepIdx) => {
        total += JOURNEY_STEPS[stepIdx].options[choiceIdx].safetyPoints;
      });
      if (onCompleteActivity) {
        onCompleteActivity(total, "GAME_BUILD_SAFE_JOURNEY", total >= 70);
      }
      if (onComplete) {
        onComplete(total, total);
      }
    }
  };

  const handleReset = () => {
    setCurrentStepIndex(0);
    setDecisions([]);
    setIsCompleted(false);
  };

  const calculateSafetyIndex = () => {
    let score = 0;
    decisions.forEach((choiceIdx, stepIdx) => {
      score += JOURNEY_STEPS[stepIdx].options[choiceIdx].safetyPoints;
    });
    return score;
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto font-sans select-none">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-800 font-mono text-xs">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/40 font-bold text-[10px] uppercase">
            SAFE JOURNEY ARCHITECT
          </span>
          <span className="text-zinc-400">Tirupati &rarr; Bengaluru Corridor (250 km)</span>
        </div>

        {/* Vehicle Selection Chips */}
        <div className="flex items-center gap-1.5 bg-[#0A0F1D] p-1 rounded-xl border border-zinc-800">
          <button
            onClick={() => setSelectedVehicle('BIKE')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedVehicle === 'BIKE' ? 'bg-cyan-500 text-zinc-950' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Bike className="w-3.5 h-3.5" />
            <span>Two-Wheeler</span>
          </button>
          <button
            onClick={() => setSelectedVehicle('CAR')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedVehicle === 'CAR' ? 'bg-cyan-500 text-zinc-950' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Car className="w-3.5 h-3.5" />
            <span>Family Car</span>
          </button>
        </div>
      </div>

      {!isCompleted ? (
        <div className="rounded-2xl overflow-hidden bg-[#0A0F1D] border border-zinc-800 shadow-2xl">
          {/* Step Progress Header */}
          <div className="p-6 sm:p-8 bg-gradient-to-r from-[#0C1527] to-[#0A0F1D] border-b border-zinc-800 space-y-3">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">
                STAGE {currentStepIndex + 1} OF {JOURNEY_STEPS.length}
              </span>
              <span className="text-zinc-400">{currentStep.category}</span>
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {currentStep.question}
            </h3>
          </div>

          {/* Options */}
          <div className="p-6 sm:p-8 space-y-4 bg-[#070B14]">
            {currentStep.options.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectOption(idx)}
                className="w-full p-5 rounded-xl bg-[#0E1524] hover:bg-[#141E33] border border-zinc-800 hover:border-cyan-500/50 text-left transition-all cursor-pointer group space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm sm:text-base text-white group-hover:text-cyan-300 transition-colors">
                    {opt.title}
                  </span>
                  <span className="text-[10px] font-mono text-zinc-500 group-hover:text-cyan-400 transition-colors font-bold">
                    SELECT &rarr;
                  </span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                  {opt.description}
                </p>
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* Journey Complete & Safety Index Summary */
        <div className="p-8 rounded-3xl bg-gradient-to-b from-[#0E1626] to-[#0A0F1D] border border-cyan-800/40 text-center space-y-6 max-w-2xl mx-auto shadow-2xl animate-in zoom-in-95">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Award className="w-10 h-10" />
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-mono font-bold tracking-widest text-cyan-400 uppercase bg-cyan-950/80 px-3 py-1 rounded-full border border-cyan-700/40">
              TRIP READINESS AUDIT COMPLETE
            </span>
            <h2 className="text-3xl font-extrabold text-white tracking-tight">
              Journey Safety Index: {calculateSafetyIndex()}%
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto font-sans leading-relaxed">
              {calculateSafetyIndex() >= 80 
                ? "Your preparation is top-tier. Every critical safety parameter has been addressed to ensure a safe return." 
                : "You have several critical safety compromises that elevate crash vulnerability. Review the defensive guidance below."}
            </p>
          </div>

          {/* Breakdown of Choices */}
          <div className="space-y-2.5 text-left font-sans max-h-72 overflow-y-auto pr-2">
            {JOURNEY_STEPS.map((step, idx) => {
              const userChoice = step.options[decisions[idx]];
              const isSafe = userChoice.safetyPoints === 20;

              return (
                <div key={idx} className={`p-3.5 rounded-xl border text-xs space-y-1 ${
                  isSafe ? 'bg-emerald-950/20 border-emerald-800/40' : 'bg-rose-950/20 border-rose-800/40'
                }`}>
                  <div className="flex items-center justify-between font-mono">
                    <span className="font-bold text-white">{step.category}</span>
                    <span className={isSafe ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                      {isSafe ? '+20 Points' : '+0 Points'}
                    </span>
                  </div>
                  <p className="text-zinc-300 font-sans">{userChoice.feedback}</p>
                </div>
              );
            })}
          </div>

          <button
            onClick={handleReset}
            className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold font-mono text-xs transition-all shadow-lg shadow-cyan-500/20 inline-flex items-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Plan Another Journey</span>
          </button>
        </div>
      )}
    </div>
  );
};
