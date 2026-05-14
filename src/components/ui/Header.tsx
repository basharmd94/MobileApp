import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

interface HeaderProps {
  title: string;
  bgColor?: string;       // Tailwind class e.g. 'bg-white' or 'bg-blue-500'
  textColor?: string;     // Tailwind class e.g. 'text-gray-900' or 'text-white'
  iconColor?: string;     // Tailwind class for back button icon color
  children?: React.ReactNode; // Extra content below the title row (e.g. tabs, filters)
}

/**
 * Reusable page header with back button and title.
 * Optionally accepts children for sub-header content (tabs, filters, etc.)
 */
const Header: React.FC<HeaderProps> = ({
  title,
  bgColor = 'bg-white',
  textColor = 'text-text-main',
  iconColor = 'text-text-secondary',
  children,
}) => {
  const navigate = useNavigate();

  return (
    <header className={`flex flex-col px-4 pt-8 pb-3 ${bgColor} shadow-[0_2px_10px_rgb(0,0,0,0.02)] z-10 rounded-b-2xl shrink-0`}>
      <div className="flex items-center">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-bg-base text-text-secondary active:scale-95 transition-transform"
        >
          <ChevronLeft className={`w-5 h-5 ${iconColor}`} />
        </button>

        {/* Title */}
        <h1 className={`flex-1 text-center text-[14px] font-bold ${textColor} pr-8`}>
          {title}
        </h1>
      </div>
      {children}
    </header>
  );
};

export default Header;