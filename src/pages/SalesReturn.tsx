import React, { useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, Trash2, Plus, Minus, Package, User, Hash, Calendar, TrendingUp, AlertCircle } from 'lucide-react';

export default function SalesReturn() {
  const location = useLocation();
  const navigate = useNavigate();
  const order = location.state?.order;

  // Initialize return items from the order's items
  const [returnItems, setReturnItems] = useState<any[]>(
    order?.items ? order.items.map((it: any) => ({ ...it })) : []
  );

  // Return reason state
  const [returnReason, setReturnReason] = useState('');
  const [reasonError, setReasonError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); // Added isSubmitting state

  const returnReasons = [
    "Damage Goods Return",
    "Delivery Car Problem",
    "Don't know the shop/outlet",
    "Don't know the store",
    "Due Demand",
    "Extra Product Order",
    "Fake order",
    "High Price",
    "Money Problem",
    "Next week will keep the goods",
    "Normal Return For Good Product",
    "Owner Absent",
    "Partial Return",
    "Product did not ilike",
    "Product did not ilike & Partial Return",
    "Product has changed",
    "Product Physical Problem",
    "Product Quality Bad",
    "Return For Repair Product",
    "Return For Technical Problem",
    "Road Repair/ Jam Problem",
    "Shop/Outlet Off",
    "Shop/Outlet Off Lunch Hour",
    "Time Short",
    "Wrong Product Code Send"
  ];

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
        xlineamt: newQty * currentItem.xrate,
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
          xlineamt: 0,
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
        xlineamt: newQty * currentItem.xrate,
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
          xlineamt: currentItem.xrate,
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

  const handleReturn = async () => {
    if (returnItems.length === 0) return;
    
    // Validate return reason
    if (!returnReason) {
      setReasonError(true);
      return;
    }
    
    setIsSubmitting(true);
    
    // API Call logic to be implemented later
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      alert(`Returning ${returnItems.length} items\nReason: ${returnReason}\nGross amount: ৳ ${totals.totalAmount}`);
      navigate(-1);
    } catch (error) {
      console.error('Return failed:', error);
      setIsSubmitting(false);
    }
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
          <h1 className="flex-1 text-center text-[14px] font-bold text-text-main pr-8">Sales Return</h1>
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
          </div>
        </div>

        {/* Return Reason Dropdown */}
        <div className="bg-bg-card border border-ui-border rounded-[16px] p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-error" />
            <label className="text-[12px] font-bold text-text-main">
              Return Reason <span className="text-error">*</span>
            </label>
          </div>
          <div className="relative">
            <select
              value={returnReason}
              onChange={(e) => {
                setReturnReason(e.target.value);
                setReasonError(false);
              }}
              className={`w-full h-[42px] px-3 py-2 text-[13px] bg-bg-base border rounded-lg focus:outline-none focus:ring-2 transition-all appearance-none truncate ${
                reasonError 
                  ? 'border-error focus:ring-error/20 text-error' 
                  : 'border-ui-border focus:ring-primary/20 text-text-main'
              }`}
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M6 8L1 3h10z' fill='%2394A3B8'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 12px center',
                paddingRight: '36px',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                overflow: 'hidden'
              }}
            >
              <option value="" className="text-text-muted">Select return reason</option>
              {returnReasons.map((reason) => (
                <option key={reason} value={reason} className="text-text-main text-[13px] py-1">
                  {reason}
                </option>
              ))}
            </select>
          </div>
          {reasonError && (
            <p className="text-[10px] text-error mt-1.5 ml-1">Please select a return reason</p>
          )}
        </div>

        {/* Return Items List */}
        <div className="bg-bg-card border border-ui-border rounded-[16px] shadow-sm overflow-hidden">
          <div className="p-3 bg-ui-border/10 border-b border-ui-border flex items-center justify-between">
            <h3 className="text-[12px] font-bold text-text-main flex items-center gap-1.5">
              <Package className="w-4 h-4 text-primary" />
              Return Items ({returnItems.length})
            </h3>
          </div>

          <div className="divide-y divide-ui-border/50">
            {returnItems.map((item, idx) => (
              <div key={idx} className="p-3 hover:bg-bg-base/50 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1 pr-2 min-w-0">
                    <div className="text-[11px] font-bold text-text-main leading-tight mb-1.5 truncate">
                      {item.xdesc}
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {/* Item Code - Teal */}
                      <span className="text-[10px] font-medium text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-100 whitespace-nowrap">
                        Item: {item.xitem}
                      </span>
                      {/* Rate - Teal */}
                      <span className="text-[10px] font-medium text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-100 whitespace-nowrap">
                        Rate: ৳{item.xrate}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => removeItem(idx)}
                    disabled={isSubmitting}
                    className="p-1.5 text-error hover:text-error/80 hover:bg-error/10 rounded-lg transition-colors shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center justify-between mt-3">
                  {/* Quantity Controls - Teal */}
                  <div className="flex items-center gap-2 border border-teal-100 rounded-lg p-0.5 shadow-sm bg-teal-50/30">
                    <button
                      onClick={() => updateQuantity(idx, -1)}
                      disabled={isSubmitting}
                      className="w-8 h-8 flex items-center justify-center bg-teal-50 text-teal-600 rounded-md hover:bg-teal-100 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <input
                      type="number"
                      value={item.xqty === 0 ? '' : item.xqty}
                      onChange={(e) => handleQuantityInputChange(idx, e.target.value)}
                      onBlur={() => handleQuantityInputBlur(idx)}
                      disabled={isSubmitting}
                      className="w-12 h-8 text-center text-[13px] font-bold bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-teal-200 rounded text-teal-700 disabled:opacity-50"
                    />
                    <button
                      onClick={() => updateQuantity(idx, 1)}
                      disabled={isSubmitting}
                      className="w-8 h-8 flex items-center justify-center bg-teal-50 text-teal-600 rounded-md hover:bg-teal-100 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {/* Line Amount - Teal */}
                  <span className="text-[12px] font-bold text-teal-600 whitespace-nowrap">
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

        {/* Totals Summary Card */}
        <div className="bg-bg-card border border-ui-border rounded-[16px] p-4 shadow-sm">
          <div className="flex justify-between items-center">
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-medium text-text-secondary">Return Quantity</span>
              <span className="text-[11px] font-medium text-text-secondary">Total Refund</span>
            </div>
            <div className="flex flex-col gap-1 text-right">
              <span className="text-[13px] font-bold text-text-main">{totals.totalQty}</span>
              <span className="text-[15px] font-bold text-success">৳{totals.totalAmount.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Return Button */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-bg-card border-t border-ui-border shadow-[0_-4px_10px_rgb(0,0,0,0.02)] z-10 w-full md:max-w-3xl md:mx-auto">
        <button
          onClick={handleReturn}
          disabled={returnItems.length === 0 || isSubmitting}
          className="w-full h-[48px] flex items-center justify-center gap-2 bg-primary text-white text-[13px] font-bold rounded-xl shadow-md shadow-primary/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100 hover:bg-primary-hover"
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Returning...
            </>
          ) : (
            'Confirm Return'
          )}
        </button>
      </div>
    </div>
  );
}