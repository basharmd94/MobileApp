import { useNavigate } from 'react-router-dom';
import type { ActionConfig, ActionColor } from './dashboard-actions';

interface ColorTokens {
  iconBg: string;
  iconShadow: string;
  hoverBorder: string;
  softBg: string;
  labelColor: string;
}

const COLOR_MAP: Record<ActionColor, ColorTokens> = {
  blue: {
    iconBg: 'bg-gradient-to-br from-blue-400 via-blue-500 to-blue-700',
    iconShadow: 'shadow-blue-500/40',
    hoverBorder: 'hover:border-blue-300',
    softBg: 'bg-blue-100',
    labelColor: 'group-hover:text-blue-700',
  },
  orange: {
    iconBg: 'bg-gradient-to-br from-orange-400 via-orange-500 to-orange-700',
    iconShadow: 'shadow-orange-500/40',
    hoverBorder: 'hover:border-orange-300',
    softBg: 'bg-orange-100',
    labelColor: 'group-hover:text-orange-700',
  },
  purple: {
    iconBg: 'bg-gradient-to-br from-purple-400 via-purple-500 to-purple-700',
    iconShadow: 'shadow-purple-500/40',
    hoverBorder: 'hover:border-purple-300',
    softBg: 'bg-purple-100',
    labelColor: 'group-hover:text-purple-700',
  },
  yellow: {
    iconBg: 'bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600',
    iconShadow: 'shadow-amber-500/40',
    hoverBorder: 'hover:border-amber-300',
    softBg: 'bg-amber-100',
    labelColor: 'group-hover:text-amber-700',
  },
  green: {
    iconBg: 'bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-700',
    iconShadow: 'shadow-emerald-500/40',
    hoverBorder: 'hover:border-emerald-300',
    softBg: 'bg-emerald-100',
    labelColor: 'group-hover:text-emerald-700',
  },
  red: {
    iconBg: 'bg-gradient-to-br from-red-400 via-red-500 to-red-700',
    iconShadow: 'shadow-red-500/40',
    hoverBorder: 'hover:border-red-300',
    softBg: 'bg-red-100',
    labelColor: 'group-hover:text-red-700',
  },
  cyan: {
    iconBg: 'bg-gradient-to-br from-cyan-400 via-cyan-500 to-cyan-700',
    iconShadow: 'shadow-cyan-500/40',
    hoverBorder: 'hover:border-cyan-300',
    softBg: 'bg-cyan-100',
    labelColor: 'group-hover:text-cyan-700',
  },
  teal: {
    iconBg: 'bg-gradient-to-br from-teal-400 via-teal-500 to-teal-700',
    iconShadow: 'shadow-teal-500/40',
    hoverBorder: 'hover:border-teal-300',
    softBg: 'bg-teal-100',
    labelColor: 'group-hover:text-teal-700',
  },
  indigo: {
    iconBg: 'bg-gradient-to-br from-indigo-400 via-indigo-500 to-indigo-700',
    iconShadow: 'shadow-indigo-500/40',
    hoverBorder: 'hover:border-indigo-300',
    softBg: 'bg-indigo-100',
    labelColor: 'group-hover:text-indigo-700',
  },
};

export default function ActionButton({ config }: { config: ActionConfig }) {
  const navigate = useNavigate();
  const colors = COLOR_MAP[config.color];
  const Icon = config.icon;
  const isComingSoon = !!config.comingSoon;

  const handleClick = () => {
    if (isComingSoon) return;
    if (config.onClick) {
      config.onClick();
    } else if (config.route) {
      navigate(config.route);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isComingSoon}
      aria-disabled={isComingSoon}
      className={[
        'group relative flex flex-col items-center',
        'rounded-2xl p-2.5',
        'border transition-all duration-200 ease-out',
        'overflow-hidden',
        isComingSoon
          ? 'border-dashed border-ui-border/70 bg-white/60 opacity-80 cursor-not-allowed'
          : [
              'bg-white border-ui-border/60',
              colors.hoverBorder,
              'hover:-translate-y-1',
              'hover:shadow-[0_10px_24px_rgba(0,0,0,0.08)]',
              'active:translate-y-0 active:scale-[0.97]',
              'cursor-pointer',
            ].join(' '),
      ].join(' ')}
    >
      {/* Decorative corner blob — appears on hover (or always subtle for coming-soon) */}
      <div
        className={[
          'absolute -top-7 -right-7 w-16 h-16 rounded-full',
          colors.softBg,
          isComingSoon
            ? 'opacity-30'
            : 'scale-0 group-hover:scale-100 opacity-0 group-hover:opacity-60',
          'transition-all duration-300 ease-out',
        ].join(' ')}
      />

      {/* Icon container — gradient + colored shadow + lift/rotate on hover */}
      <div
        className={[
          'relative w-12 h-12 rounded-2xl flex items-center justify-center',
          'shadow-lg mb-2',
          isComingSoon
            ? 'bg-gradient-to-br from-slate-300 to-slate-500 shadow-slate-500/20'
            : [
                colors.iconBg,
                colors.iconShadow,
                'transition-transform duration-300 ease-out',
                'group-hover:scale-110 group-hover:-rotate-6',
              ].join(' '),
        ].join(' ')}
      >
        {/* Inner highlight ring */}
        <div className="absolute inset-0 rounded-2xl ring-1 ring-white/20 pointer-events-none" />
        <Icon className="w-5 h-5 text-white drop-shadow-sm" strokeWidth={2.4} />
      </div>

      {/* Label */}
      <span
        className={[
          'relative text-[11px] font-bold leading-tight tracking-tight text-center',
          'transition-colors duration-200',
          isComingSoon ? 'text-text-muted' : `text-text-main ${colors.labelColor}`,
        ].join(' ')}
      >
        {config.label}
      </span>

      {/* Coming-soon pill */}
      {isComingSoon && (
        <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-full bg-amber-100 border border-amber-200 text-[7px] font-bold text-amber-700 uppercase tracking-wider">
          Soon
        </span>
      )}
    </button>
  );
}
