import React, { useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, Trash2, Plus, Minus, Package, User, Hash, Calendar, TrendingUp, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { ConfirmModal } from '../components/ConfirmModal';
import { Button } from '../components/ui'; // Imported Button component
import { createSalesReturn, ReturnPayload } from '../api_return';
import { getCurrentUser } from '../api_users';

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
  const [isSubmitting, setIsSubmitting] = useState(false); 
  
  const [user, setUser] = useState<any>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [errorToast, setErrorToast] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await getCurrentUser();
        setUser(userData);
      } catch (error) {
        console.error('Failed to fetch user:', error);
      }
    };
    fetchUser();
  }, []);

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

  const handleReturn = () => {
    if (returnItems.length === 0) return;
    
    // Validate return reason
    if (!returnReason) {
      setReasonError(true);
      return;
    }
    
    setIsConfirmModalOpen(true);
  };

  const executeReturn = async () => {
    setIsConfirmModalOpen(false);
    setIsSubmitting(true);
    
    try {
      const payload: ReturnPayload = {
        return_header: {
          xcus: order.xcus,
          xdate: new Date().toISOString().split('T')[0],
          xdatecuspo: order.xdate || "",
          xdornum: order.xdornum,
          xemp: user?.user_id || "",
          xordernum: order.xordernum || "",
          xproj: order.xproj || "Normal", 
          xreason: returnReason,
          xsec: "Normal",
          xstatuscrn: "1-Open",
          xwh: order.xwh || "",
          zid: order.zid
        },
        return_items: returnItems.map((item) => ({
          xdesc: item.xdesc,
          xitem: item.xitem,
          xlineamt: item.xlineamt,
          xqty: item.xqty,
          xrate: item.xrate,
          xunitsel: item.xunitstk || "Pcs"
        }))
      };

      const response = await createSalesReturn(payload);
      
      setSuccessToast(response.message || 'Sales return created successfully');
      setTimeout(() => {
        setSuccessToast(null);
        navigate(-1);
      }, 2000);
      
    } catch (error: any) {
      console.error('Return failed:', error);
      setErrorToast(error.message || 'Failed to create sales return');
      setTimeout(() => setErrorToast(null), 3000);
      setIsSubmitting(false);
    }
  };

  if (!order) {
    return (
      <div className="h-[100dvh] flex flex-col items-center justify-center p-4 bg-bg-base">
        <p className="text-text-secondary">No order data provided.</p>
        <Button 
          variant="outline" 
          onClick={() => navigate(-1)}
          className="mt-4"
        >
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] bg-bg-base flex flex-col relative max-w-md mx-auto shadow-2xl overflow-hidden md:max-w-full">
      {/* Header */}
      <header className="flex flex-col px-4 pt-8 pb-3 bg-bg-card shadow-[0_2px_10px_rgb(0,0,0,0.02)] z-10 rounded-b-2xl shrink-0">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="w-8 h-8 text-text-secondary active:scale-95 transition-transform"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
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
                      {/* Item Code - primary */}
                      <span className="text-[10px] font-medium primary- bg-primary-50 px-1.5 py-0.5 rounded border border-primary-100 whitespace-nowrap">
                        Item: {item.xitem}
                      </span>
                      {/* Rate - primary */}
                      <span className="text-[10px] font-medium text-primary-700 bg-primary-50 px-1.5 py-0.5 rounded border border-primary-100 whitespace-nowrap">
                        Rate: ৳{item.xrate}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(idx)}
                    disabled={isSubmitting}
                    className="text-error hover:text-error/80 hover:bg-error/10 disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4 text-error" />
                  </Button>
                </div>

                <div className="flex items-center justify-between mt-3">
                  {/* Quantity Controls - primary */}
                  <div className="flex items-center gap-2 border border-primary-100 rounded-lg p-0.5 shadow-sm bg-primary-50/30">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => updateQuantity(idx, -1)}
                      disabled={isSubmitting}
                      className="w-8 h-8 bg-primary-50 text-primary-600 hover:bg-primary-100 disabled:opacity-50 rounded-md"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </Button>
                    <input
                      type="number"
                      value={item.xqty === 0 ? '' : item.xqty}
                      onChange={(e) => handleQuantityInputChange(idx, e.target.value)}
                      onBlur={() => handleQuantityInputBlur(idx)}
                      disabled={isSubmitting}
                      className="w-12 h-8 text-center text-[13px] font-bold bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-primary-200 rounded text-primary-700 disabled:opacity-50"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => updateQuantity(idx, 1)}
                      disabled={isSubmitting}
                      className="w-8 h-8 bg-primary-50 text-primary-600 hover:bg-primary-100 disabled:opacity-50 rounded-md"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                  {/* Line Amount - primary */}
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
        <Button
          variant="primary"
          size="lg"
          className="w-full shadow-lg shadow-primary/20"
          onClick={handleReturn}
          disabled={returnItems.length === 0 || isSubmitting}
          isLoading={isSubmitting}
        >
          Confirm Return
        </Button>
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={isConfirmModalOpen}
        title="Confirm Sales Return"
        message={`Are you sure you want to return ${returnItems.length} items for a total of ৳${totals.totalAmount.toLocaleString()}?`}
        onCancel={() => setIsConfirmModalOpen(false)}
        onConfirm={executeReturn}
        isProcessing={isSubmitting}
      />

      {/* Error Toast */}
      {errorToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-md z-[100] bg-error text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 animate-in slide-in-from-top-4">
          <X className="w-5 h-5 shrink-0" />
          <p className="text-sm font-medium">{errorToast}</p>
        </div>
      )}

      {/* Success Toast */}
      {successToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-md z-[100] bg-success text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 animate-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <p className="text-sm font-medium">{successToast}</p>
        </div>
      )}
    </div>
  );
}