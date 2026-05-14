import { useNavigate } from 'react-router-dom';
import type { ActionConfig } from './dashboard-actions';

const COLOR_MAP = {
  blue:   { bg: 'bg-blue-100',   text: 'text-blue-700',   hover: 'hover:bg-blue-50   hover:border-blue-200' },
  orange: { bg: 'bg-orange-100', text: 'text-orange-700', hover: 'hover:bg-orange-50 hover:border-orange-200' },
  purple: { bg: 'bg-purple-100', text: 'text-purple-700', hover: 'hover:bg-purple-50 hover:border-purple-200' },
  yellow: { bg: 'bg-amber-100',  text: 'text-amber-700',  hover: 'hover:bg-amber-50  hover:border-amber-200' },
  green:  { bg: 'bg-emerald-100',text: 'text-emerald-800',hover: 'hover:bg-emerald-50 hover:border-emerald-200' },
  red:    { bg: 'bg-red-100',    text: 'text-red-700',    hover: 'hover:bg-red-50    hover:border-red-200' },
  cyan:   { bg: 'bg-cyan-100',   text: 'text-cyan-700',   hover: 'hover:bg-cyan-50   hover:border-cyan-200' },
  teal:   { bg: 'bg-teal-100',   text: 'text-teal-700',   hover: 'hover:bg-teal-50   hover:border-teal-200' },
  indigo: { bg: 'bg-indigo-100', text: 'text-indigo-700', hover: 'hover:bg-indigo-50 hover:border-indigo-200' },
} as const;

export default function ActionButton({ config }: { config: ActionConfig }) {
  const navigate = useNavigate();
  const colors = COLOR_MAP[config.color];

  const handleClick = () => {
    if (config.onClick) {
      config.onClick();
    } else if (config.route) {
      navigate(config.route);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`flex flex-col items-center justify-center bg-[#fafaf9] px-2 py-3.5
        rounded-[14px] border border-[#f0ece7]
        ${colors.hover} transition-all duration-150
        hover:-translate-y-0.5 hover:shadow-[0_5px_14px_rgba(0,0,0,0.07)]
        active:scale-95 active:translate-y-0`}
    >
      <div className={`w-[42px] h-[42px] rounded-full ${colors.bg} ${colors.text} flex items-center justify-center mb-1.5`}>
        <config.icon className="w-[17px] h-[17px]" strokeWidth={2.2} />
      </div>
      <span className="text-[9.5px] font-bold text-[#4a3f35] leading-tight tracking-wide">
        {config.label}
      </span>
    </button>
  );
}