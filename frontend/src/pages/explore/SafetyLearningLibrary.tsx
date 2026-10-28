import React, { useState } from 'react';
import { 
  BookOpen, ShieldCheck, Gauge, EyeOff, CloudRain, 
  HelpCircle, CheckCircle2, ChevronRight, Award, 
  Info, ExternalLink, Zap, HeartHandshake, Car
} from 'lucide-react';

interface SafetyLearningLibraryProps {
  onCompleteModule?: (moduleId: string, xpEarned: number) => void;
  onExit?: () => void;
}

interface LearningModule {
  id: string;
  title: string;
  subtitle: string;
  icon: any;
  category: string;
  readTime: string;
  summary: string;
  physicsPrinciple: string;
  bestPractices: string[];
  citation: string;
}

const MODULES: LearningModule[] = [
  {
    id: 'stopping_distance',
    title: 'Stopping Distance & Deceleration Dynamics',
    subtitle: 'Why speed multiplies braking distance non-linearly (E = ½mv²)',
    icon: Gauge,
    category: 'Physics of Motion',
    readTime: '4 min',
    summary: 'Total stopping distance consists of two distinct physical phases: Thinking/Reaction Distance (distance travelled during the driver’s 1.5-second neurological perception delay) plus Braking Distance (kinetic energy dissipated by brake friction into heat). Doubling your speed quadruples your braking distance.',
    physicsPrinciple: 'Kinetic energy increases with the square of velocity. When speed increases from 40 km/h to 80 km/h, the kinetic energy that brakes must dissipate increases by 400%, extending braking distance from ~9 meters to over ~36 meters on dry tarmac.',
    bestPractices: [
      'Maintain the 3-Second Rule in dry conditions; extend to 6 seconds in rain or dusk.',
      'Anticipate hazards 15 seconds ahead rather than staring at the bumper immediately in front.',
      'Avoid abrupt panic braking on non-ABS motorcycles; apply progressive front brake pressure (70/30 ratio).'
    ],
    citation: 'WHO Road Safety Speed Management Manual & MoRTH Driver Training Guidelines'
  },
  {
    id: 'helmet_physics',
    title: 'Helmets & Cranial Impact Dissipation',
    subtitle: 'How EPS liners compress to prevent brain shearing injuries',
    icon: ShieldCheck,
    category: 'Protective Equipment',
    readTime: '3 min',
    summary: 'During a motorcycle collision, the head undergoes severe acceleration. The certified helmet shell deflects sharp debris, while the expanded polystyrene (EPS) liner crushes progressively under impact, extending deceleration time from 2 milliseconds to 6 milliseconds. This reduces the peak G-forces transmitted to brain tissue below lethal thresholds.',
    physicsPrinciple: 'Impulse-momentum theorem (F = Δp / Δt). By cushioning the impact and lengthening the duration of deceleration (Δt), the peak force (F) experienced by the skull and cervical vertebrae is dramatically dampened.',
    bestPractices: [
      'Ensure the helmet carries BIS IS 4151:2015 certification sticker on the rear outer shell.',
      'Fasten the chinstrap firmly—allow no more than two fingers between strap and jaw.',
      'Replace any helmet that has sustained an impact or is older than 5 years (UV degradation degrades EPS foam).'
    ],
    citation: 'Bureau of Indian Standards IS 4151:2015 & UNECE Regulation 22.06'
  },
  {
    id: 'truck_blind_spots',
    title: 'Commercial Heavy Vehicle "No Zones"',
    subtitle: 'Navigating blind spots around buses and multi-axle freight trucks',
    icon: EyeOff,
    category: 'Defensive Driving',
    readTime: '3 min',
    summary: 'Heavy freight trucks and intercity buses have massive visual blind spots ("No-Zones") where smaller vehicles, two-wheelers, and pedestrians are completely invisible to the driver. The four main blind spots are directly in front (up to 6 meters), directly behind (up to 60 meters), and along both side flanks, with the left/passenger side being the largest.',
    physicsPrinciple: 'Cabin height and long chassis geometries create acute line-of-sight obstruction angles. Furthermore, heavy vehicles require 40% longer stopping distances and make wide right/left swing turns.',
    bestPractices: [
      'If you cannot see the truck driver’s face in their side mirror, the truck driver CANNOT see you.',
      'Never linger alongside a heavy truck on curves or highway interchanges.',
      'Overtake only from the right side with headlight flash and horn acknowledgement.'
    ],
    citation: 'MoRTH Guidelines for Commercial Vehicle Highway Operations'
  },
  {
    id: 'rain_aquaplaning',
    title: 'Monsoon Aquaplaning & Wet Road Traction',
    subtitle: 'Preventing hydrodynamic tyre lift on waterlogged highways',
    icon: CloudRain,
    category: 'Weather Safety',
    readTime: '4 min',
    summary: 'Aquaplaning (hydroplaning) occurs when a tyre encounters more standing water than its tread grooves can displace. Water pressure builds under the front contact patch, lifting the tyre completely off the asphalt onto a film of water. When this occurs, steering control and braking friction drop to virtually zero.',
    physicsPrinciple: 'Tyre tread evacuation capacity is limited by water depth and rotational velocity. Above critical speeds (often 60–75 km/h on 3mm standing water), hydrodynamic lift separates rubber from asphalt, causing immediate loss of directional control.',
    bestPractices: [
      'Inspect tyre tread depth before the monsoon; replace tyres with tread depth below 2.0 mm.',
      'If you experience aquaplaning, DO NOT slam the brakes or jerk the steering wheel; smoothly ease off the accelerator until tyres regain contact.',
      'Turn on headlights (low beam) in rain to maximize visibility to oncoming traffic.'
    ],
    citation: 'Central Road Research Institute (CRRI) Wet Weather Driving Protocols'
  },
  {
    id: 'good_samaritan',
    title: 'The Good Samaritan Law & Emergency First Aid',
    subtitle: 'Legal immunity and rights when assisting road accident victims',
    icon: HeartHandshake,
    category: 'Legal & Emergency Care',
    readTime: '3 min',
    summary: 'Section 134A of the Motor Vehicles (Amendment) Act 2019 legally protects any citizen who renders emergency medical or non-medical assistance to an accident victim. Good Samaritans cannot be held civilly or criminally liable, cannot be forced to disclose identity, and cannot be harassed by police or hospital authorities.',
    physicsPrinciple: 'The "Golden Hour"—the first 60 minutes post-trauma—determines whether severe traumatic haemorrhage or asphyxia becomes fatal. Rapid airway clearing and bystander call to emergency services (TERA / 108) doubles survival rates.',
    bestPractices: [
      'Call emergency dispatch immediately via TERA SOS or 108 / 112.',
      'Never move an unconscious victim violently unless there is imminent fire or explosion risk (protect cervical spine).',
      'Hospitals are mandated by law to provide immediate emergency stabilisation without demanding advance payment or police formalities.'
    ],
    citation: 'Supreme Court of India Good Samaritan Guidelines & Motor Vehicles Act Section 134A'
  }
];

export const SafetyLearningLibrary: React.FC<SafetyLearningLibraryProps> = ({ onCompleteModule, onExit }) => {
  const [selectedModule, setSelectedModule] = useState<LearningModule>(MODULES[0]);

  // Stopping Distance Calculator State
  const [calcSpeed, setCalcSpeed] = useState<number>(60); // km/h
  const [calcRoadCondition, setCalcRoadCondition] = useState<'dry' | 'wet' | 'gravel'>('dry');

  // Physics Calculations
  // Speed in m/s = speed * 1000 / 3600 = speed / 3.6
  const speedMs = calcSpeed / 3.6;
  // Reaction time: 1.5 seconds average
  const reactionDist = Number((speedMs * 1.5).toFixed(1));
  
  // Friction coefficient
  const frictionMap = { dry: 0.7, wet: 0.4, gravel: 0.35 };
  const friction = frictionMap[calcRoadCondition];
  // Braking distance: d = v^2 / (2 * friction * g), g = 9.81
  const brakingDist = Number(((speedMs * speedMs) / (2 * friction * 9.81)).toFixed(1));
  const totalStoppingDist = Number((reactionDist + brakingDist).toFixed(1));

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950/60 to-slate-900 border border-teal-500/20 rounded-2xl p-6 text-white relative overflow-hidden shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-teal-400 text-xs font-semibold mb-2">
              <BookOpen className="w-4 h-4" />
              <span>DEFENSIVE ROAD SAFETY ENCYCLOPEDIA</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Accident Prevention Library</h1>
            <p className="text-slate-300 text-xs mt-1 max-w-xl">
              Scientific, legal, and operational knowledge to understand road dynamics, protect passengers, and react safely in crisis situations.
            </p>
          </div>
          {onExit && (
            <button 
              onClick={onExit}
              className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-xs text-slate-300 hover:text-white transition"
            >
              Back to Explore
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Module Nav Cards (Left Column) */}
        <div className="lg:col-span-4 space-y-2.5">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            Curated Safety Modules
          </h2>

          {MODULES.map(module => {
            const Icon = module.icon;
            const isSelected = selectedModule.id === module.id;

            return (
              <div
                key={module.id}
                onClick={() => setSelectedModule(module)}
                className={`p-4 rounded-xl border cursor-pointer transition text-left space-y-1 ${
                  isSelected
                    ? 'bg-teal-950/40 border-teal-500/50 text-white shadow-sm'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-teal-400 uppercase tracking-wider">
                    {module.category}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {module.readTime}
                  </span>
                </div>
                <div className="flex items-center gap-2.5 pt-1">
                  <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-teal-400' : 'text-slate-400'}`} />
                  <h3 className="font-semibold text-xs md:text-sm leading-snug">{module.title}</h3>
                </div>
              </div>
            );
          })}
        </div>

        {/* Module Content Reader (Right Column) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-6">
            <div className="border-b border-slate-800 pb-4 space-y-1">
              <span className="text-xs font-bold text-teal-400 uppercase tracking-wider">
                {selectedModule.category} • Certified Reference
              </span>
              <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                {selectedModule.title}
              </h2>
              <p className="text-xs text-slate-400">
                {selectedModule.subtitle}
              </p>
            </div>

            {/* Core Summary */}
            <div className="text-xs md:text-sm text-slate-300 leading-relaxed space-y-3">
              <p>{selectedModule.summary}</p>
            </div>

            {/* Scientific Principle Box */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-teal-300">
                <Zap className="w-3.5 h-3.5 text-teal-400" />
                <span>The Physics Behind It:</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-mono">
                {selectedModule.physicsPrinciple}
              </p>
            </div>

            {/* Best Practices Checklist */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Defensive Action Checklist:
              </h4>
              <div className="space-y-2">
                {selectedModule.bestPractices.map((practice, idx) => (
                  <div key={idx} className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 flex items-start gap-3 text-xs text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                    <span>{practice}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Citation */}
            <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-500 font-mono flex items-center justify-between">
              <span>Authority: {selectedModule.citation}</span>
              <span className="text-teal-400 font-bold">+25 XP Read</span>
            </div>
          </div>

          {/* INTERACTIVE STOPPING DISTANCE SIMULATOR WIDGET */}
          {selectedModule.id === 'stopping_distance' && (
            <div className="bg-slate-900 border border-teal-500/30 rounded-2xl p-6 space-y-5 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Gauge className="w-4 h-4 text-teal-400" />
                    Interactive Braking & Stopping Distance Lab
                  </h3>
                  <p className="text-xs text-slate-400">
                    Observe how human perception delay and vehicle braking physics interact at different velocities.
                  </p>
                </div>
                <span className="bg-teal-500/20 text-teal-300 border border-teal-500/40 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                  Physics Lab
                </span>
              </div>

              {/* Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400 font-medium">Vehicle Velocity:</span>
                    <strong className="text-teal-400 font-mono text-sm">{calcSpeed} km/h</strong>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="120"
                    step="5"
                    value={calcSpeed}
                    onChange={(e) => setCalcSpeed(Number(e.target.value))}
                    className="w-full accent-teal-400 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-600 font-mono">
                    <span>20 km/h (School zone)</span>
                    <span>120 km/h (Expressway)</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-xs text-slate-400 font-medium block">Road Surface Quality:</span>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    {[
                      { id: 'dry', label: 'Dry Asphalt (μ=0.7)' },
                      { id: 'wet', label: 'Wet Road (μ=0.4)' },
                      { id: 'gravel', label: 'Loose Gravel (μ=0.35)' }
                    ].map(cond => (
                      <button
                        key={cond.id}
                        onClick={() => setCalcRoadCondition(cond.id as any)}
                        className={`p-2 rounded-lg text-center font-medium transition text-[11px] ${
                          calcRoadCondition === cond.id
                            ? 'bg-teal-500/20 text-teal-300 border border-teal-500/50'
                            : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
                        }`}
                      >
                        {cond.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Metric Breakdown */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-medium">Reaction Distance</span>
                  <div className="text-base md:text-lg font-bold text-amber-400 font-mono mt-0.5">
                    {reactionDist} m
                  </div>
                  <span className="text-[9px] text-slate-500">During 1.5s perception delay</span>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-medium">Braking Distance</span>
                  <div className="text-base md:text-lg font-bold text-rose-400 font-mono mt-0.5">
                    {brakingDist} m
                  </div>
                  <span className="text-[9px] text-slate-500">Mechanical friction phase</span>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-teal-500/30">
                  <span className="text-[10px] text-teal-400 uppercase font-bold">Total Stopping Distance</span>
                  <div className="text-base md:text-xl font-bold text-teal-300 font-mono mt-0.5">
                    {totalStoppingDist} m
                  </div>
                  <span className="text-[9px] text-slate-400">~{Math.round(totalStoppingDist / 4.5)} car lengths</span>
                </div>
              </div>

              {/* Visual Distance Bar */}
              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Vehicle Starting Point</span>
                  <span>Vehicle At Complete Stop ({totalStoppingDist} meters)</span>
                </div>
                <div className="h-6 w-full bg-slate-950 rounded-xl overflow-hidden flex border border-slate-800">
                  <div 
                    style={{ width: `${(reactionDist / totalStoppingDist) * 100}%` }}
                    className="bg-amber-500/70 h-full flex items-center justify-center text-[10px] text-slate-950 font-bold px-1 overflow-hidden"
                    title={`Thinking distance: ${reactionDist}m`}
                  >
                    Thinking ({reactionDist}m)
                  </div>
                  <div 
                    style={{ width: `${(brakingDist / totalStoppingDist) * 100}%` }}
                    className="bg-rose-500/70 h-full flex items-center justify-center text-[10px] text-white font-bold px-1 overflow-hidden"
                    title={`Braking distance: ${brakingDist}m`}
                  >
                    Braking ({brakingDist}m)
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
