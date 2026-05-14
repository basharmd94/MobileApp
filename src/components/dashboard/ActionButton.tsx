import { useNavigate } from 'react-router-dom';
import type { ActionConfig } from './dashboard-actions';

const COLOR_MAP = {
  blue:    { bg: 'bg-blue-100/80',    text: 'text-blue-600',    hover: 'hover:bg-blue-50/50 hover:border-blue-200' },
  orange:  { bg: 'bg-orange-100/80',  text: 'text-orange-600',  hover: 'hover:bg-orange-50/50 hover:border-orange-200' },
  purple:  { bg: 'bg-purple-100/80',  text: 'text-purple-600',  hover: 'hover:bg-purple-50/50 hover:border-purple-200' },
  yellow:  { bg: 'bg-yellow-100/80',  text: 'text-yellow-600',  hover: 'hover:bg-yellow-50/50 hover:border-yellow-200' },
  green:   { bg: 'bg-green-100/80',   text: 'text-green-600',   hover: 'hover:bg-green-50/50 hover:border-green-200' },
  red:     { bg: 'bg-red-100/80',     text: 'text-red-600',     hover: 'hover:bg-red-50/50 hover:border-red-200' },
  cyan:    { bg: 'bg-cyan-100/80',    text: 'text-cyan-600',    hover: 'hover:bg-cyan-50/50 hover:border-cyan-200' },
  teal:    { bg: 'bg-teal-100/80',    text: 'text-teal-600',    hover: 'hover:bg-teal-50/50 hover:border-teal-200' },
  indigo:  { bg: 'bg-indigo-100/80',  text: 'text-indigo-600',  hover: 'hover:bg-indigo-50/50 hover:border-indigo-200' },
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
      className={`flex flex-col items-center justify-center bg-white p-3 rounded-xl 
        shadow-[0_1px_4px_rgb(0,0,0,0.02)] border border-[#e2e8f0]/60 
        ${colors.hover} transition-all active:scale-95`}
    >
      <div className={`w-10 h-10 rounded-full ${colors.bg} ${colors.text} flex items-center justify-center mb-2`}>
        <config.icon className="w-4 h-4" strokeWidth={2.5} />
      </div>
      <span className="text-[10px] font-bold text-slate-700 leading-tight">
        {config.label}
      </span>
    </button>
  );
}