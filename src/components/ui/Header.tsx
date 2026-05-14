import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

interface HeaderProps {
  title: string;
  bgColor?: string;
  textColor?: string;
  iconColor?: string;
  children?: React.ReactNode;
}

const Header: React.FC<HeaderProps> = ({ title, children }) => {
  const navigate = useNavigate();

  return (
    <header className="flex flex-col px-4 pt-10 pb-3 bg-white z-10 shrink-0 rounded-b-[28px] shadow-[0_6px_24px_rgba(249,115,22,0.13)] border-b border-primary-100">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-primary-50 border border-primary-200 text-primary-600 shrink-0 transition-all active:scale-90 hover:bg-primary-100"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="flex-1 text-[15px] font-bold text-text-main tracking-tight pr-8">
          {title}
        </h1>
      </div>

      {children && (
        <div className="mt-2">
          {children}
        </div>
      )}
    </header>
  );
};

export default Header;