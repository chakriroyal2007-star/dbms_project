import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  icon?: LucideIcon;
  variant?: 'default' | 'danger' | 'warning' | 'success' | 'info';
  statusText?: string;
  onClick?: () => void;
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  subValue,
  icon: Icon,
  variant = 'default',
  statusText,
  onClick,
  className = ''
}) => {
  const getAccent = () => {
    switch (variant) {
      case 'danger':
        return {
          border: 'border-rose-500/20',
          indicator: 'bg-rose-500',
          text: 'text-rose-400',
          iconColor: 'text-rose-400'
        };
      case 'warning':
        return {
          border: 'border-amber-500/20',
          indicator: 'bg-amber-400',
          text: 'text-amber-400',
          iconColor: 'text-amber-400'
        };
      case 'success':
        return {
          border: 'border-emerald-500/20',
          indicator: 'bg-emerald-400',
          text: 'text-emerald-400',
          iconColor: 'text-emerald-400'
        };
      case 'info':
        return {
          border: 'border-sky-500/20',
          indicator: 'bg-sky-400',
          text: 'text-sky-400',
          iconColor: 'text-sky-400'
        };
      default:
        return {
          border: 'border-zinc-800/80',
          indicator: 'bg-zinc-600',
          text: 'text-zinc-100',
          iconColor: 'text-zinc-400'
        };
    }
  };

  const accent = getAccent();

  return (
    <div
      onClick={onClick}
      className={`relative p-4 rounded-xl bg-[#121215] border ${accent.border} shadow-sm ${
        onClick ? 'cursor-pointer hover:bg-[#18181b] transition-all' : ''
      } ${className}`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-medium tracking-wide uppercase text-zinc-400 font-mono">
          {label}
        </span>
        {Icon && <Icon className={`w-4 h-4 ${accent.iconColor}`} />}
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-100 font-mono">
          {value}
        </span>
        {subValue && (
          <span className="text-xs font-normal text-zinc-500 font-mono">
            {subValue}
          </span>
        )}
      </div>

      {statusText && (
        <div className="mt-2 text-[11px] text-zinc-400 flex items-center gap-1.5 font-sans">
          <span className={`w-1.5 h-1.5 rounded-full ${accent.indicator}`} />
          <span>{statusText}</span>
        </div>
      )}
    </div>
  );
};
