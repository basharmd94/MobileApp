import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Building2, Briefcase, Building, ChevronRight } from 'lucide-react';
import { Card } from '../components';

export default function BusinessSelect() {
  const navigate = useNavigate();

  const businesses = [
    { id: 'gi', name: 'GI', icon: Building2, color: 'text-secondary-blue', bg: 'bg-secondary-blue/10' },
    { id: 'hmbr', name: 'HMBR', icon: Briefcase, color: 'text-primary', bg: 'bg-primary/10' },
    { id: 'zepto', name: 'Zepto', icon: Building, color: 'text-secondary-teal', bg: 'bg-secondary-teal/10' },
  ];

  return (
    <div className="min-h-[100dvh] bg-bg-base flex flex-col relative max-w-md mx-auto shadow-2xl overflow-hidden md:max-w-full">
      {/* App Bar */}
      <header className="flex items-center px-4 pt-8 pb-3 bg-bg-card shadow-[0_2px_10px_rgb(0,0,0,0.02)] z-10 rounded-b-2xl shrink-0">
        <button 
          onClick={() => navigate(-1)}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-bg-base text-text-secondary active:scale-95 transition-transform"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="flex-1 text-center text-[13px] font-bold text-text-main pr-8">Select Business</h1>
      </header>

      <main className="flex-1 p-4 overflow-y-auto">
        <div className="mb-5">
          <h2 className="text-lg font-bold text-text-main mb-0.5">Choose Business</h2>
          <p className="text-[11px] text-text-muted font-medium">Select a business to proceed with</p>
        </div>

        <div className="space-y-3">
          {businesses.map((business) => (
            <Card
              key={business.id}
              activeScale
              className="flex items-center gap-3 !p-3"
              onClick={() => {
                if (business.id === 'hmbr') {
                  navigate('/hmbr');
                } else if (business.id === 'gi') {
                  navigate('/gi');
                } else if (business.id === 'zepto') {
                  navigate('/zepto');
                } else {
                  navigate('/');
                }
              }}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${business.bg} ${business.color}`}>
                <business.icon className="w-5 h-5" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="text-sm font-bold text-text-main">{business.name}</h3>
                <p className="text-[9px] text-text-secondary font-medium mt-0.5 uppercase tracking-wide">Business Entity</p>
              </div>
              <div className="w-6 h-6 flex items-center justify-center text-ui-border">
                <ChevronRight className="w-4 h-4" />
              </div>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
