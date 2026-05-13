import React, { useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, Trash2, Plus, Minus, Package, User, Hash, Calendar, TrendingUp } from 'lucide-react';

export default function SalesReturn() {
  const location = useLocation();
  const navigate = useNavigate();
  const order = location.state?.order;

  // Initialize return items from the order's items
  const [returnItems, setReturnItems] = useState<any[]>(
    order?.items ? order.items.map((it: any) => ({ ...it })) : []
  );

  const updateQuantity = (index: number, delta: number) => {
    setReturnItems(prev => {
      const newItems = [...prev];
      const currentItem = newItems[index];
      const originalItem = order?.items.find((i: any) => i.xitem === currentItem.xitem);
      const maxQty = originalItem ? originalItem.xqty : currentItem.xqty;
      
      let newQty = currentItem.xqty + delta;
      if (newQty < 1) newQty = 1;
      if (newQty > maxQty) newQty = maxQty;
      
      newItems[index] = {
        ...currentItem,
        xqty: newQty,
        xlineamt: newQty * currentItem.xrate
      };
      return newItems;
    });
  };

  const handleQuantityInputChange = (index: number, value: string) => {
    setReturnItems(prev => {
      const newItems = [...prev];
      const currentItem = newItems[index];

      if (value === '') {
         newItems[index] = {
           ...currentItem,
           xqty: 0,
           xlineamt: 0
         };
         return newItems;
      }

      let newQty = parseInt(value, 10);
      if (isNaN(newQty)) newQty = 0;

      const originalItem = order?.items.find((i: any) => i.xitem === currentItem.xitem);
      const maxQty = originalItem ? originalItem.xqty : currentItem.xqty;
      
      if (newQty > maxQty) newQty = maxQty;
      
      newItems[index] = {
        ...currentItem,
        xqty: newQty,
        xlineamt: newQty * currentItem.xrate
      };
      return newItems;
    });
  };

  const handleQuantityInputBlur = (index: number) => {
    setReturnItems(prev => {
       const newItems = [...prev];
       const currentItem = newItems[index];
       if (currentItem.xqty < 1) {
         newItems[index] = {
           ...currentItem,
           xqty: 1,
           xlineamt: currentItem.xrate
         };
       }
       return newItems;
    });
  };

  const removeItem = (index: number) => {
    setReturnItems(prev => prev.filter((_, i) => i !== index));
  };

  const totals = useMemo(() => {
    const totalQty = returnItems.reduce((sum, item) => sum + item.xqty, 0);
    const totalAmount = returnItems.reduce((sum, item) => sum + item.xlineamt, 0);
    return { totalQty, totalAmount };
  }, [returnItems]);

  const getBusinessName = (zid: string | number) => {
    if (String(zid) === '100001') return 'HMBR';
    if (String(zid) === '100000') return 'GI';
    if (String(zid) === '100005') return 'Zepto';
    return String(zid);
  };

  const handleReturn = () => {
    if (returnItems.length === 0) return;
    // API Call logic to be implemented later
    alert(`Returning ${returnItems.length} items with gross amount ৳ ${totals.totalAmount}`);
    navigate(-1);
  };

  if (!order) {
    return (
      <div className="h-[100dvh] flex flex-col items-center justify-center p-4">
        <p>No order data provided.</p>
        <button onClick={() => navigate(-1)} className="mt-4 px-4 py-2 bg-slate-200 rounded">Go Back</button>
      </div>
    );
  }

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
          <h1 className="flex-1 text-center text-[14px] font-bold text-text-main pr-8">Sales Return</h1>
        </div>
      </header>

      <main className="flex-1 p-4 overflow-y-auto w-full md:max-w-3xl md:mx-auto pb-24 space-y-4">
        
        {/* Order Info Card */}
        <div className="bg-[#fff7ed] border border-orange-100 p-3.5 rounded-[16px] shadow-[0_2px_10px_rgb(0,0,0,0.03)]">
          <div className="flex justify-between items-start mb-3">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                 <span className="text-[10px] font-bold text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full border border-orange-200">
                   {order.zid} - {getBusinessName(order.zid)}
                 </span>
              </div>
              <h3 className="text-[13px] font-bold text-text-main flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-orange-400" />
                {order.xshort || order.xcus}
              </h3>
              <p className="text-[10px] text-text-muted ml-5">{order.xadd1}</p>
            </div>
            <div className="text-right">
              <span className="text-[12px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                ৳{order.netamt?.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-1.5 p-2.5 bg-white/60 rounded-[12px] border border-orange-50">
            <div className="flex justify-between">
               <div className="flex items-center gap-1.5">
                 <Hash className="w-3.5 h-3.5 text-orange-400/70 shrink-0" />
                 <span className="text-[10px] font-medium text-text-secondary truncate">
                   DO: <span className="font-bold text-text-main">{order.xdornum}</span>
                 </span>
               </div>
               {order.xdate && (
                 <div className="flex items-center gap-1.5">
                   <Calendar className="w-3.5 h-3.5 text-orange-400/70 shrink-0" />
                   <span className="text-[10px] font-medium text-text-secondary">{order.xdate}</span>
                 </div>
               )}
            </div>
          </div>
        </div>

        {/* Return Items List */}
        <div className="bg-white border border-ui-border rounded-[16px] shadow-sm overflow-hidden">
          <div className="p-3 bg-gray-50/50 border-b border-ui-border flex items-center justify-between">
            <h3 className="text-[12px] font-bold text-text-main flex items-center gap-1.5">
              <Package className="w-4 h-4 text-orange-500" />
              Return Items ({returnItems.length})
            </h3>
          </div>
          
          <div className="divide-y divide-ui-border/50">
            {returnItems.map((item, idx) => (
              <div key={idx} className="p-3">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1 pr-2">
                    <div className="text-[11px] font-bold text-text-main leading-tight mb-1.5">{item.xdesc}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-100">Item: {item.xitem}</span>
                      <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-100">Rate: ৳{item.xrate}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => removeItem(idx)}
                    className="p-1.5 text-red-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-2 border border-gray-200 rounded-lg p-0.5 shadow-sm bg-white">
                    <button 
                      onClick={() => updateQuantity(idx, -1)}
                      className="w-8 h-8 flex items-center justify-center bg-gray-50 text-gray-600 rounded-md hover:bg-gray-100 active:scale-95 transition-all"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <input 
                      type="number"
                      value={item.xqty === 0 ? '' : item.xqty}
                      onChange={(e) => handleQuantityInputChange(idx, e.target.value)}
                      onBlur={() => handleQuantityInputBlur(idx)}
                      className="w-12 h-8 text-center text-[13px] font-bold bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-orange-100 rounded"
                    />
                    <button 
                      onClick={() => updateQuantity(idx, 1)}
                      className="w-8 h-8 flex items-center justify-center bg-gray-50 text-gray-600 rounded-md hover:bg-gray-100 active:scale-95 transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <span className="text-[12px] font-bold text-orange-600">
                    ৳{item.xlineamt?.toLocaleString()}
                  </span>
                </div>
              </div>
            ))}

            {returnItems.length === 0 && (
              <div className="p-6 text-center text-text-muted text-[11px]">
                No items left to return
              </div>
            )}
          </div>
        </div>

        {/* Totals Summary */}
        <div className="bg-orange-50 border border-orange-100 rounded-[16px] p-4 text-[12px]">
           <div className="flex justify-between mb-2">
             <span className="text-text-secondary font-medium">Return Quantity</span>
             <span className="font-bold text-text-main">{totals.totalQty}</span>
           </div>
           <div className="flex justify-between font-bold text-[14px]">
             <span className="text-text-main">Total Refund</span>
             <span className="text-emerald-600">৳{totals.totalAmount.toLocaleString()}</span>
           </div>
        </div>

      </main>

      {/* Footer Return Button */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-ui-border shadow-[0_-4px_10px_rgb(0,0,0,0.02)] z-10 w-full md:max-w-3xl md:mx-auto">
        <button 
          onClick={handleReturn}
          disabled={returnItems.length === 0}
          className="w-full h-[44px] flex items-center justify-center bg-orange-500 text-white text-[13px] font-bold rounded-xl shadow-md shadow-orange-500/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100"
        >
          Confirm Return
        </button>
      </div>
    </div>
  );
}
