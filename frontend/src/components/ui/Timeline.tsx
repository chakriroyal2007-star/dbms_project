import React from 'react';
import { CheckCircle2, Clock, Activity, AlertCircle, ShieldCheck } from 'lucide-react';

export interface TimelineStep {
  id: string;
  label: string;
  description?: string;
  status: 'completed' | 'current' | 'upcoming' | 'rejected';
  timestamp?: string;
}

interface TimelineProps {
  currentStatus: string;
  createdAt?: string;
  updatedAt?: string;
  className?: string;
}

export const Timeline: React.FC<TimelineProps> = ({
  currentStatus,
  createdAt,
  updatedAt,
  className = ''
}) => {
  const norm = (currentStatus || 'RECEIVED').toUpperCase();

  const getStepStatus = (stepStage: number): 'completed' | 'current' | 'upcoming' | 'rejected' => {
    if (norm === 'REJECTED' || norm === 'CANCELLED') {
      return stepStage === 0 ? 'completed' : 'rejected';
    }

    const stages: Record<string, number> = {
      RECEIVED: 1,
      VERIFIED: 2,
      ACTIVE: 3,
      CONTAINED: 4,
      RESOLVED: 5
    };

    const currentStageNum = stages[norm] || 1;

    if (stepStage < currentStageNum) return 'completed';
    if (stepStage === currentStageNum) return 'current';
    return 'upcoming';
  };

  const steps: TimelineStep[] = [
    {
      id: 'step_1',
      label: '1. Report Received in DB',
      description: 'Logged with relational ACID transaction & tracking code issued.',
      status: getStepStatus(1),
      timestamp: createdAt ? new Date(createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined
    },
    {
      id: 'step_2',
      label: '2. EOC Verification & Triage',
      description: 'Dispatcher verified severity & initiated capacity solver.',
      status: getStepStatus(2)
    },
    {
      id: 'step_3',
      label: '3. Resources Dispatched',
      description: 'Fleet ambulances and hospital trauma beds reserved.',
      status: getStepStatus(3),
      timestamp: norm !== 'RECEIVED' && norm !== 'VERIFIED' && updatedAt ? new Date(updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined
    },
    {
      id: 'step_4',
      label: '4. Containment on Scene',
      description: 'Casualties transported and trauma admissions in progress.',
      status: getStepStatus(4)
    },
    {
      id: 'step_5',
      label: '5. Incident Resolved',
      description: 'All patients admitted and fleet units released back to grid.',
      status: getStepStatus(5)
    }
  ];

  return (
    <div className={`space-y-4 font-mono ${className}`}>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {steps.map((step, idx) => {
          const isCurrent = step.status === 'current';
          const isCompleted = step.status === 'completed';
          const isRejected = step.status === 'rejected';

          return (
            <div
              key={step.id}
              className={`p-3.5 rounded-xl border transition-all relative ${
                isCurrent
                  ? 'bg-sky-950/40 border-sky-500/50 shadow-md shadow-sky-950/50'
                  : isCompleted
                  ? 'bg-emerald-950/20 border-emerald-500/30 text-zinc-300'
                  : isRejected
                  ? 'bg-rose-950/20 border-rose-500/30 opacity-60'
                  : 'bg-zinc-900/40 border-zinc-800 text-zinc-500 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  Stage {idx + 1}
                </span>
                {isCompleted && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                {isCurrent && <Activity className="w-4 h-4 text-sky-400 animate-spin" />}
                {isRejected && <AlertCircle className="w-4 h-4 text-rose-400" />}
                {!isCompleted && !isCurrent && !isRejected && <Clock className="w-4 h-4 text-zinc-600" />}
              </div>

              <div className={`text-xs font-bold ${isCurrent ? 'text-sky-300' : isCompleted ? 'text-zinc-100' : 'text-zinc-400'}`}>
                {step.label}
              </div>

              <p className="text-[10px] text-zinc-400 font-sans mt-1 leading-snug">
                {step.description}
              </p>

              {step.timestamp && (
                <div className="mt-2 text-[9px] text-zinc-500 font-mono">
                  Recorded: {step.timestamp}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
