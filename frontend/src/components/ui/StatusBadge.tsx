import React from 'react';

export type StatusType = 
  | 'RECEIVED' | 'VERIFIED' | 'ACTIVE' | 'CONTAINED' | 'RESOLVED' | 'REJECTED' | 'CANCELLED'
  | 'AVAILABLE' | 'DISPATCHED' | 'EN_ROUTE' | 'ON_SCENE' | 'TRANSPORTING' | 'AT_HOSPITAL' | 'MAINTENANCE' | 'OFFLINE'
  | 'CRITICAL' | 'HIGH' | 'SERIOUS' | 'MEDIUM' | 'MODERATE' | 'LOW' | 'MINOR'
  | 'LEVEL_1' | 'LEVEL_2' | 'LEVEL_3' | 'COMMUNITY'
  | 'RED' | 'YELLOW' | 'GREEN' | 'BLACK';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
  showDot?: boolean;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  showDot = true,
  className = ''
}) => {
  const normalized = (status || '').toUpperCase();

  const getStyle = (): { bg: string; text: string; border: string; dot: string; ping?: boolean } => {
    switch (normalized) {
      // Emergency Life Cycle
      case 'RECEIVED':
        return {
          bg: 'bg-rose-500/10',
          text: 'text-rose-400',
          border: 'border-rose-500/20',
          dot: 'bg-rose-500',
          ping: true
        };
      case 'VERIFIED':
        return {
          bg: 'bg-amber-500/10',
          text: 'text-amber-400',
          border: 'border-amber-500/20',
          dot: 'bg-amber-400'
        };
      case 'ACTIVE':
        return {
          bg: 'bg-sky-500/10',
          text: 'text-sky-400',
          border: 'border-sky-500/20',
          dot: 'bg-sky-400',
          ping: true
        };
      case 'CONTAINED':
        return {
          bg: 'bg-emerald-500/10',
          text: 'text-emerald-400',
          border: 'border-emerald-500/20',
          dot: 'bg-emerald-400'
        };
      case 'RESOLVED':
        return {
          bg: 'bg-zinc-500/10',
          text: 'text-zinc-400',
          border: 'border-zinc-500/20',
          dot: 'bg-zinc-400'
        };
      case 'REJECTED':
      case 'CANCELLED':
        return {
          bg: 'bg-zinc-800',
          text: 'text-zinc-500',
          border: 'border-zinc-700',
          dot: 'bg-zinc-600'
        };

      // Severity / Triage Priority
      case 'CRITICAL':
      case 'RED':
        return {
          bg: 'bg-rose-950/60',
          text: 'text-rose-300',
          border: 'border-rose-500/30',
          dot: 'bg-rose-500',
          ping: true
        };
      case 'HIGH':
      case 'SERIOUS':
      case 'YELLOW':
        return {
          bg: 'bg-amber-950/60',
          text: 'text-amber-300',
          border: 'border-amber-500/30',
          dot: 'bg-amber-400'
        };
      case 'MEDIUM':
      case 'MODERATE':
      case 'GREEN':
        return {
          bg: 'bg-emerald-950/60',
          text: 'text-emerald-300',
          border: 'border-emerald-500/30',
          dot: 'bg-emerald-400'
        };
      case 'LOW':
      case 'MINOR':
        return {
          bg: 'bg-zinc-900',
          text: 'text-zinc-300',
          border: 'border-zinc-700',
          dot: 'bg-zinc-400'
        };
      case 'BLACK':
        return {
          bg: 'bg-black',
          text: 'text-zinc-400',
          border: 'border-zinc-800',
          dot: 'bg-zinc-600'
        };

      // Resource / Ambulance States
      case 'AVAILABLE':
        return {
          bg: 'bg-emerald-500/10',
          text: 'text-emerald-400',
          border: 'border-emerald-500/20',
          dot: 'bg-emerald-400'
        };
      case 'DISPATCHED':
      case 'EN_ROUTE':
      case 'TRANSPORTING':
      case 'DEPLOYED':
        return {
          bg: 'bg-sky-500/10',
          text: 'text-sky-400',
          border: 'border-sky-500/20',
          dot: 'bg-sky-400',
          ping: true
        };
      case 'ON_SCENE':
        return {
          bg: 'bg-amber-500/10',
          text: 'text-amber-400',
          border: 'border-amber-500/20',
          dot: 'bg-amber-400'
        };

      default:
        return {
          bg: 'bg-zinc-800/80',
          text: 'text-zinc-300',
          border: 'border-zinc-700',
          dot: 'bg-zinc-400'
        };
    }
  };

  const style = getStyle();

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 font-medium',
    md: 'text-xs px-2.5 py-1 font-medium',
    lg: 'text-sm px-3 py-1.5 font-semibold'
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${style.bg} ${style.text} ${style.border} ${sizeClasses[size]} ${className} font-mono tracking-tight`}
    >
      {showDot && (
        <span className="relative flex h-1.5 w-1.5">
          {style.ping && (
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${style.dot} opacity-75`} />
          )}
          <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${style.dot}`} />
        </span>
      )}
      <span>{normalized.replace(/_/g, ' ')}</span>
    </span>
  );
};
