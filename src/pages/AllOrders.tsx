import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ShoppingBag } from 'lucide-react';
import { Card } from '../components';

export default function AllOrders() {
  const navigate = useNavigate();

  return (
    <div className="h-[100dvh] bg-bg-base flex flex-col relative max-w-md mx-auto shadow-2xl overflow-hidden md:max-w-full">
      <header className="flex items-center px-4 pt-8 pb-3 bg-bg-card shadow-[0_2px_10px_rgb(0,0,0,0.02)] z-10 rounded-b-2xl shrink-0">
        <button 
          onClick={() => navigate(-1)}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-bg-base text-text-secondary active:scale-95 transition-transform"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="flex-1 text-center text-[13px] font-bold text-text-main pr-8">All Orders</h1>
      </header>

      <main className="flex-1 p-4 overflow-y-auto w-full md:max-w-3xl md:mx-auto pb-24">
         <div className="flex flex-col items-center justify-center h-48 py-12 text-center mt-12">
            <Card className="!p-6 !rounded-2xl border-dashed border-2 border-ui-border/60 bg-bg-base/50 flex flex-col items-center">
              <ShoppingBag className="w-12 h-12 text-primary/40 mb-3" />
              <p className="text-[14px] font-bold text-text-main mb-1">All Orders Module</p>
              <p className="text-[11px] text-text-muted max-w-[200px]">This module is coming soon.</p>
            </Card>
          </div>
      </main>
    </div>
  );
}
