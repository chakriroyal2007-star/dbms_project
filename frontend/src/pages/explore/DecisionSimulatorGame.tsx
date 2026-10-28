import React, { useState } from 'react';
import { 
  ShieldCheck, AlertTriangle, ArrowRight, RotateCcw, 
  CheckCircle2, XCircle, Award, Compass, Sparkles, Brain, Car, Eye
} from 'lucide-react';
import { exploreApi } from '../../services/api';

interface Choice {
  text: string;
  is_safe: boolean;
  feedback: string;
  safety_takeaway: string;
  xp: number;
}

interface Scenario {
  id: string;
  title: string;
  category: string;
  environment: string;
  situation: string;
  illustration_theme: string;
  choices: Choice[];
  safest_choice_index: number;
}

export interface DecisionSimulatorProps {
  scenarios?: Scenario[];
  onComplete?: (score: number, xp: number) => void;
  onCompleteActivity?: (xp: number, activityId: string, passed: boolean) => void;
  onExit?: () => void;
}

const DEFAULT_SCENARIOS: Scenario[] = [
  {
    id: "sc_phone_call",
    title: "The Unexpected Phone Call",
    category: "distraction",
    environment: "Urban Two-Way Arterial",
    situation: "You are riding your motorcycle home at 45 km/h. Your smartphone buzzes with an incoming call in your pocket as you approach a busy unsignalized intersection with merging autorickshaws.",
    illustration_theme: "motorcycle_urban",
    choices: [
      {
        text: "Answer immediately by wedging the phone inside your helmet chinstrap while riding.",
        is_safe: false,
        feedback: "Severe hazard! Head tilt compromises peripheral field of vision by 40% and shifts cognitive attention away from merging cross-traffic.",
        safety_takeaway: "Handling phones while riding increases crash risk by over 400%. Never compromise balance or visual focus.",
        xp: 10
      },
      {
        text: "Look down briefly at your pocket to see who is calling before deciding whether to stop.",
        is_safe: false,
        feedback: "Dangerous! At 45 km/h, looking down for just 2 seconds means traveling 25 meters completely blind into the intersection.",
        safety_takeaway: "Two seconds of visual distraction is sufficient to miss an unexpected pedestrian or braking vehicle.",
        xp: 15
      },
      {
        text: "Keep eyes on the road, maintain lane position, signal, and pull over safely to the curb before answering.",
        is_safe: true,
        feedback: "Correct defensive action! You eliminated cognitive distraction and prioritized road positioning before attending to communication.",
        safety_takeaway: "No phone call is worth a life. Someone is waiting for you at home; reach there safely first.",
        xp: 50
      },
      {
        text: "Accelerate quickly to clear the intersection faster so you can answer sooner.",
        is_safe: false,
        feedback: "Critical failure! Accelerating into a dilemma zone robs you of braking reaction distance and compounds collision severity.",
        safety_takeaway: "Speed multiplies kinetic energy exponentially (E = 1/2 mv²). Never accelerate through uncertainty.",
        xp: 5
      }
    ],
    safest_choice_index: 2
  },
  {
    id: "sc_monsoon_rain",
    title: "Heavy Monsoon Torrent & Aquaplaning Risk",
    category: "weather",
    environment: "Four-Lane Divided Highway (NH-71)",
    situation: "Sudden torrential monsoon rain reduces visibility to 40 meters. Sheets of water collect in the outer lane. You are driving at 80 km/h and feel slight steering lightness.",
    illustration_theme: "highway_rain",
    choices: [
      {
        text: "Slam the brakes forcefully to stop as quickly as possible.",
        is_safe: false,
        feedback: "Severe danger! Hard braking during hydroplaning locks the wheels and causes an immediate uncontrolled skid or spin-out.",
        safety_takeaway: "Abrupt inputs break surface adhesion. Smooth, progressive driving saves lives on wet asphalt.",
        xp: 10
      },
      {
        text: "Smoothly ease off the accelerator, keep steering wheel straight, switch on low-beam headlights and increase headway.",
        is_safe: true,
        feedback: "Excellent physics response! Allowing tires to naturally displace water restores mechanical friction without triggering a skid.",
        safety_takeaway: "When hydroplaning occurs, do not panic. Smooth deceleration and low beams give you and following drivers crucial reaction time.",
        xp: 50
      },
      {
        text: "Turn on hazard flashers and continue driving at 80 km/h in the fast lane.",
        is_safe: false,
        feedback: "Misleading! Hazard lights while moving confuse trailing drivers who cannot determine if you are stationary or changing lanes.",
        safety_takeaway: "Use hazard flashers only when immobilized on the shoulder. Use low-beams and reduce speed in rain.",
        xp: 15
      }
    ],
    safest_choice_index: 1
  }
];

export const DecisionSimulatorGame: React.FC<DecisionSimulatorProps> = ({
  scenarios: propScenarios,
  onComplete,
  onCompleteActivity,
  onExit
}) => {
  const [activeScenarios, setActiveScenarios] = useState<Scenario[]>(propScenarios || DEFAULT_SCENARIOS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedChoiceIndex, setSelectedChoiceIndex] = useState<number | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [totalScore, setTotalScore] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  React.useEffect(() => {
    if (!propScenarios || propScenarios.length === 0) {
      exploreApi.getScenarios().then((data: any) => {
        if (data && data.length > 0) setActiveScenarios(data);
      }).catch(() => {});
    }
  }, [propScenarios]);

  const currentScenario = activeScenarios[currentIndex] || activeScenarios[0];

  const handleSelectChoice = (index: number) => {
    if (hasAnswered || !currentScenario) return;
    setSelectedChoiceIndex(index);
    setHasAnswered(true);

    const choice = currentScenario.choices[index];
    const earned = choice.is_safe ? choice.xp : Math.max(5, choice.xp);
    setTotalScore(prev => prev + earned);

    if (onCompleteActivity) {
      onCompleteActivity(earned, currentScenario.id, choice.is_safe);
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 < activeScenarios.length) {
      setCurrentIndex(prev => prev + 1);
      setSelectedChoiceIndex(null);
      setHasAnswered(false);
    } else {
      setIsCompleted(true);
      if (onComplete) {
        onComplete(totalScore, totalScore);
      }
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedChoiceIndex(null);
    setHasAnswered(false);
    setTotalScore(0);
    setIsCompleted(false);
  };

  if (!currentScenario) {
    return (
      <div className="p-8 text-center text-zinc-400 font-mono">
        Loading road safety scenarios...
      </div>
    );
  }

  if (isCompleted) {
    const perfectScore = activeScenarios.length * 50;
    const percentage = Math.round((totalScore / perfectScore) * 100);

    return (
      <div className="p-8 rounded-3xl bg-gradient-to-b from-[#0E1626] to-[#0A0F1D] border border-cyan-800/40 text-center space-y-6 max-w-2xl mx-auto shadow-2xl animate-in zoom-in-95">
        <div className="w-20 h-20 mx-auto rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
          <Award className="w-10 h-10 animate-bounce" />
        </div>
        <div className="space-y-2">
          <span className="text-xs font-mono font-bold tracking-widest text-cyan-400 uppercase bg-cyan-950/80 px-3 py-1 rounded-full border border-cyan-700/40">
            SIMULATION COMPLETE
          </span>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Defensive Decision Master</h2>
          <p className="text-sm text-zinc-400 max-w-md mx-auto font-sans leading-relaxed">
            You made defensive choices across {activeScenarios.length} high-stakes road situations. Your choices reflect the discipline that brings families home safe.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto font-mono text-left">
          <div className="p-4 rounded-xl bg-black/40 border border-cyan-900/50">
            <span className="text-[10px] text-zinc-500 uppercase block">Total Safety XP</span>
            <span className="text-2xl font-black text-cyan-400">+{totalScore} XP</span>
          </div>
          <div className="p-4 rounded-xl bg-black/40 border border-cyan-900/50">
            <span className="text-[10px] text-zinc-500 uppercase block">Defensive Index</span>
            <span className="text-2xl font-black text-emerald-400">{percentage}%</span>
          </div>
        </div>

        <button
          onClick={handleRestart}
          className="px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold font-mono text-xs transition-all shadow-lg shadow-cyan-500/20 inline-flex items-center gap-2 cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Replay Scenarios</span>
        </button>
      </div>
    );
  }

  const selectedChoice = selectedChoiceIndex !== null ? currentScenario.choices[selectedChoiceIndex] : null;

  return (
    <div className="space-y-6 max-w-4xl mx-auto font-sans">
      {/* Top Scenario Tracker Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800 font-mono text-xs">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-md bg-cyan-950 text-cyan-300 border border-cyan-800/40 font-bold text-[10px] uppercase">
            SCENARIO {currentIndex + 1} OF {activeScenarios.length}
          </span>
          <span className="text-zinc-500">•</span>
          <span className="text-zinc-400 flex items-center gap-1">
            <Compass className="w-3.5 h-3.5 text-zinc-500" />
            {currentScenario.environment}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-cyan-400 font-bold">XP: {totalScore}</span>
        </div>
      </div>

      {/* Main Scenario Visual Canvas & Narrative */}
      <div className="rounded-2xl overflow-hidden bg-[#0A0F1D] border border-[#1E293B] shadow-2xl">
        {/* Scenario Header with Ambient Visual Theme */}
        <div className="p-6 sm:p-8 bg-gradient-to-r from-[#0C1527] via-[#0F1B33] to-[#0A0F1D] border-b border-zinc-800/80 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono tracking-widest text-amber-400 uppercase bg-amber-950/60 px-2.5 py-0.5 rounded border border-amber-800/40">
              {currentScenario.category.replace(/_/g, ' ')}
            </span>
            <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-mono">
              <Brain className="w-4 h-4 text-cyan-400" />
              <span>Decide Safely</span>
            </div>
          </div>

          <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-snug">
            {currentScenario.title}
          </h3>

          <p className="text-zinc-300 text-sm sm:text-base leading-relaxed font-sans bg-black/30 p-4 rounded-xl border border-zinc-800/60">
            {currentScenario.situation}
          </p>
        </div>

        {/* Tactical Choices Section */}
        <div className="p-6 sm:p-8 space-y-4 bg-[#070B14]">
          <span className="text-xs font-mono font-bold tracking-wider text-zinc-400 uppercase block mb-2">
            What is your immediate tactical action?
          </span>

          <div className="space-y-3">
            {currentScenario.choices.map((choice, idx) => {
              const isSelected = selectedChoiceIndex === idx;
              let choiceStyle = "bg-[#0E1524] hover:bg-[#141E33] border-zinc-800 text-zinc-200";

              if (hasAnswered) {
                if (choice.is_safe) {
                  choiceStyle = "bg-emerald-950/60 border-emerald-600/70 text-emerald-200 font-semibold";
                } else if (isSelected) {
                  choiceStyle = "bg-rose-950/60 border-rose-600/70 text-rose-200";
                } else {
                  choiceStyle = "opacity-40 border-zinc-900 text-zinc-500 cursor-not-allowed";
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleSelectChoice(idx)}
                  disabled={hasAnswered}
                  className={`w-full p-4 sm:p-5 rounded-xl border text-left transition-all flex items-start gap-3.5 text-xs sm:text-sm cursor-pointer ${choiceStyle}`}
                >
                  <span className="w-6 h-6 rounded-lg bg-black/40 border border-zinc-700 font-mono font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <div className="flex-1 leading-relaxed">
                    {choice.text}
                  </div>
                  {hasAnswered && choice.is_safe && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  )}
                  {hasAnswered && isSelected && !choice.is_safe && (
                    <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Deep Educational Feedback Accordion */}
          {hasAnswered && selectedChoice && (
            <div className={`p-5 rounded-xl border mt-6 space-y-3 animate-in fade-in slide-in-from-top-2 ${
              selectedChoice.is_safe ? 'bg-emerald-950/30 border-emerald-800/40' : 'bg-amber-950/30 border-amber-800/40'
            }`}>
              <div className="flex items-center gap-2">
                {selectedChoice.is_safe ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                )}
                <span className={`text-xs font-mono font-bold uppercase tracking-wider ${
                  selectedChoice.is_safe ? 'text-emerald-400' : 'text-amber-400'
                }`}>
                  {selectedChoice.is_safe ? 'Safe Defensive Choice (+50 XP)' : 'Risky Decision — Review Safety Analysis'}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed font-sans">
                {selectedChoice.feedback}
              </p>

              <div className="p-3 rounded-lg bg-black/40 border border-zinc-800/60 flex items-start gap-2.5 text-xs text-cyan-200 font-mono">
                <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <span><strong className="text-white">Safety Principle:</strong> {selectedChoice.safety_takeaway}</span>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleNext}
                  className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold font-mono text-xs transition-all flex items-center gap-2 shadow-lg shadow-cyan-500/20 cursor-pointer"
                >
                  <span>{currentIndex + 1 < activeScenarios.length ? 'Next Scenario' : 'View Mission Report'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
