import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, User, Hash, Calendar, TrendingUp, Truck, CreditCard } from 'lucide-react';

export default function PayDate() {
  const location = useLocation();
  const navigate = useNavigate();
  const order = location.state?.order;

  // Date states
  const [deliveryDate, setDeliveryDate] = useState(order?.xdate || '');
  const [payDate, setPayDate] = useState(order?.xdatepay || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getBusinessName = (zid: string | number) => {
    if (String(zid) === '100001') return 'HMBR';
    if (String(zid) === '100000') return 'GI';
    if (String(zid) === '100005') return 'Zepto';
    return String(zid);
  };

  const handleUpdate = async () => {
    if (!deliveryDate || !payDate) return;
    
    setIsSubmitting(true);
    
    // API Call logic to be implemented later
    const payload = {
      xdornum: order.xdornum,
      xdate: deliveryDate,
      xdatepay: payDate
    };
    
    console.log('Updating dates:', payload);
    
    // Simulate API call
    setTimeout(() => {
      alert(`Dates updated successfully!\nDelivery: ${deliveryDate}\nPay: ${payDate}`);
      setIsSubmitting(false);
      navigate(-1);
    }, 500);
  };

  if (!order) {
    return (
      <div className="h-[100dvh] flex flex-col items-center justify-center p-4 bg-bg-base">
        <p className="text-text-secondary">No order data provided.</p>
        <button onClick={() => navigate(-1)} className="mt-4 px-4 py-2 bg-bg-card border border-ui-border rounded-lg text-text-main">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] bg-bg-base flex flex-col relative max-w-md mx-auto shadow-2xl overflow-hidden md:max-w-full">
      {/* Header */}
      <header className="flex flex-col px-4 pt-8 pb-3 bg-bg-card shadow-[0_2px_10px_rgb(0,0,0,0.02)] z-10 rounded-b-2xl shrink-0">
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

      {/* Main scrollable area */}
      <main className="flex-1 p-4 overflow-y-auto w-full md:max-w-3xl md:mx-auto pb-28 space-y-4">
        
        {/* Order Info Card */}
        <div className="bg-primary-light/15 backdrop-blur-sm border border-primary-light rounded-[16px] p-3.5 shadow-sm">
          <div className="flex justify-between items-start mb-3">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[10px] font-bold text-primary bg-primary-light/50 px-2 py-0.5 rounded-full border border-primary-light">
                  {order.zid} - {getBusinessName(order.zid)}
                </span>
              </div>
              <h3 className="text-[13px] font-bold text-text-main flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-primary" />
                {order.xshort || order.xcus}
              </h3>
              <p className="text-[10px] text-text-muted ml-5">{order.xadd1}</p>
            </div>
            <div className="text-right">
              <span className="text-[12px] font-bold text-success bg-success/10 px-2 py-1 rounded-lg border border-success/20 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                ৳{order.netamt?.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-1.5 p-2.5 bg-bg-card/80 rounded-[12px] border border-primary-light/30">
            <div className="flex justify-between">
              <div className="flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-primary/70 shrink-0" />
                <span className="text-[10px] font-medium text-text-secondary truncate">
                  DO: <span className="font-bold text-text-main">{order.xdornum}</span>
                </span>
              </div>
              {order.xdate && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-primary/70 shrink-0" />
                  <span className="text-[10px] font-medium text-text-secondary">{order.xdate}</span>
                </div>
              )}
            </div>
            {order.xordernum && (
              <div className="flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-primary/70 shrink-0" />
                <span className="text-[10px] font-medium text-text-secondary truncate">
                  Order: <span className="font-bold text-text-main">{order.xordernum}</span>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Date Inputs Card */}
        <div className="bg-bg-card border border-ui-border rounded-[16px] p-4 shadow-sm">
          <h3 className="text-[12px] font-bold text-text-main mb-4 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-primary" />
            Update Dates
          </h3>

          <div className="space-y-4">
            {/* Delivery Date */}
            <div>
              <label className="flex items-center gap-2 text-[11px] font-bold text-text-main mb-2">
                <Truck className="w-3.5 h-3.5 text-teal-500" />
                Delivery Date <span className="text-error">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="w-full h-[42px] px-3 py-2 text-[13px] bg-bg-base border border-ui-border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-300 transition-all text-text-main appearance-none"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2314B8A6' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='4' width='18' height='18' rx='2' ry='2'%3E%3C/rect%3E%3Cline x1='16' y1='2' x2='16' y2='6'%3E%3C/line%3E%3Cline x1='8' y1='2' x2='8' y2='6'%3E%3C/line%3E%3Cline x1='3' y1='10' x2='21' y2='10'%3E%3C/line%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 12px center',
                    paddingRight: '40px'
                  }}
                />
              </div>
            </div>

            {/* Pay Date */}
            <div>
              <label className="flex items-center gap-2 text-[11px] font-bold text-text-main mb-2">
                <CreditCard className="w-3.5 h-3.5 text-purple-500" />
                Pay Date <span className="text-error">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={payDate}
                  onChange={(e) => setPayDate(e.target.value)}
                  className="w-full h-[42px] px-3 py-2 text-[13px] bg-bg-base border border-ui-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-300 transition-all text-text-main appearance-none"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%238B5CF6' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='4' width='18' height='18' rx='2' ry='2'%3E%3C/rect%3E%3Cline x1='16' y1='2' x2='16' y2='6'%3E%3C/line%3E%3Cline x1='8' y1='2' x2='8' y2='6'%3E%3C/line%3E%3Cline x1='3' y1='10' x2='21' y2='10'%3E%3C/line%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 12px center',
                    paddingRight: '40px'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Date Summary */}
          {(deliveryDate || payDate) && (
            <div className="mt-4 p-3 bg-bg-base rounded-lg border border-ui-border space-y-2">
              {deliveryDate && (
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-medium text-text-secondary flex items-center gap-1.5">
                    <Truck className="w-3 h-3 text-teal-500" />
                    Delivery Date
                  </span>
                  <span className="text-[11px] font-bold text-teal-600">{deliveryDate}</span>
                </div>
              )}
              {payDate && (
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-medium text-text-secondary flex items-center gap-1.5">
                    <CreditCard className="w-3 h-3 text-purple-500" />
                    Pay Date
                  </span>
                  <span className="text-[11px] font-bold text-purple-600">{payDate}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Current Status Info */}
        <div className="bg-teal-50/50 border border-teal-100 rounded-[16px] p-4 shadow-sm">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-[10px] font-medium text-text-secondary">Status</span>
              <p className="text-[12px] font-bold text-teal-700 mt-0.5">{order.xstatusdor || 'N/A'}</p>
            </div>
            <div>
              <span className="text-[10px] font-medium text-text-secondary">Items</span>
              <p className="text-[12px] font-bold text-text-main mt-0.5">{order.items?.length || 0} items</p>
            </div>
          </div>
        </div>

      </main>

      {/* Footer Update Button */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-bg-card border-t border-ui-border shadow-[0_-4px_10px_rgb(0,0,0,0.02)] z-10 w-full md:max-w-3xl md:mx-auto">
        <button 
          onClick={handleUpdate}
          disabled={!deliveryDate || !payDate || isSubmitting}
          className="w-full h-[48px] flex items-center justify-center gap-2 bg-primary text-white text-[13px] font-bold rounded-xl shadow-md shadow-primary/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100 hover:bg-primary-hover"
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Updating...
            </>
          ) : (
            'Update Dates'
          )}
        </button>
      </div>
    </div>
  );
}