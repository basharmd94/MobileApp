import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

export default function PayDate() {
  const location = useLocation();
  const navigate = useNavigate();
  const order = location.state?.order;

  return (
    <div className="h-[100dvh] bg-bg-base flex flex-col relative max-w-md mx-auto shadow-2xl overflow-hidden md:max-w-full">
      <header className="flex flex-col px-4 pt-8 pb-3 bg-white shadow-[0_2px_10px_rgb(0,0,0,0.02)] z-10 rounded-b-2xl shrink-0">
        <div className="flex items-center">
          <button 
            onClick={() => navigate(-1)}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-bg-base text-text-secondary active:scale-95 transition-transform"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="flex-1 text-center text-[14px] font-bold text-text-main pr-8">Pay Date</h1>
        </div>
      </header>

      <main className="flex-1 p-4 overflow-y-auto w-full md:max-w-3xl md:mx-auto pb-24">
         <div className="bg-white p-4 rounded-xl border border-ui-border overflow-x-auto shadow-sm">
            <h2 className="text-[12px] font-bold mb-2">Order Data</h2>
            <pre className="text-[10px] text-text-secondary bg-gray-50 p-2 rounded">
              {JSON.stringify(order, null, 2)}
            </pre>
         </div>
         <p className="text-[11px] text-text-muted mt-4 text-center">To be implemented...</p>
      </main>
    </div>
  );
}
