import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

interface HeaderProps {
  title: string;
  bgColor?: string;       // Tailwind class e.g. 'bg-white' or 'bg-blue-500'
  textColor?: string;     // Tailwind class e.g. 'text-gray-900' or 'text-white'
  iconColor?: string;     // Tailwind class for back button icon color
}

const Header: React.FC<HeaderProps> = ({
  title,
  bgColor = 'bg-white',
  textColor = 'text-text-main',
  iconColor = 'text-text-secondary'
}) => {
  const navigate = useNavigate();

  return (
    <header className={`flex items-center px-4 pt-8 pb-3 ${bgColor} z-20 shrink-0`}>
      {/* Back Button */}
      <button 
        onClick={() => navigate(-1)}
        className={`w-8 h-8 flex items-center justify-center rounded-full bg-bg-base/20 active:scale-95 transition-transform`}
      >
        <ChevronLeft className={`w-5 h-5 ${iconColor}`} />
      </button>

      {/* Title */}
      <h1 className={`flex-1 text-center text-[14px] font-bold ${textColor} pr-8`}>
        {title}
      </h1>
    </header>
  );
};

export default Header;