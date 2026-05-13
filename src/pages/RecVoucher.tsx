import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Loader2, RefreshCw, Filter, Calendar, Search, ChevronDown, ChevronUp, X, User, TrendingUp, Hash, Receipt } from 'lucide-react';
import { getCustomerReceipts, CustomerReceipt } from '../api_customer_rct';
import { Card, Button, CustomerSearch } from '../components';
import { Customer } from '../api_customers';

export default function RecVoucher() {
  const navigate = useNavigate();
  const [receipts, setReceipts] = useState<CustomerReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [limit, setLimit] = useState(10);
  const [hasMore, setHasMore] = useState(true);
  const [employeeId, setEmployeeId] = useState<string>('');
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  
  const [errorToast, setErrorToast] = useState<string | null>(null);
  
  // Calculate yesterday's date natively
  const getYesterdayDate = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  };

  // Filters
  const [zid, setZid] = useState<string>('100001');
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [receiptDate, setReceiptDate] = useState<string>(getYesterdayDate());

  useEffect(() => {
    try {
      const token = localStorage.getItem('accessToken');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload?.user_id) {
          setEmployeeId(payload.user_id);
        }
      }
    } catch (e) {
      console.error("Failed to decode token", e);
    }
  }, []);

  const fetchReceipts = useCallback(async (currentLimit: number, isLoadMore = false, overrideFilters?: any) => {
    if (isLoadMore) setLoadingMore(true);
    else setLoading(true);

    try {
      const payloadZid = overrideFilters?.zid ?? zid;
      const payloadCustomer = overrideFilters?.customer !== undefined ? overrideFilters.customer : customer?.xcus;
      const payloadDate = overrideFilters?.receiptDate !== undefined ? overrideFilters.receiptDate : receiptDate;
       
      const res = await getCustomerReceipts({
        limit: currentLimit,
        zid: payloadZid,
        customer: payloadCustomer || "",
        receipt_date: payloadDate || ""
      });
      
      const fetchedReceipts = res.receipts || [];
      
      setReceipts(prev => {
        if (!isLoadMore) {
          return fetchedReceipts;
        }
        
        if (fetchedReceipts.length >= prev.length) {
           return fetchedReceipts;
        }

        const newReceipts = fetchedReceipts.filter(
          (fo: CustomerReceipt) => !prev.some((po) => po.xvoucher === fo.xvoucher)
        );
        return [...prev, ...newReceipts];
      });
      
      if (fetchedReceipts.length < currentLimit) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }
    } catch (error: any) {
      console.error('Failed to fetch receipts:', error);
      setErrorToast(error.message || "Failed to fetch receipts");
      setTimeout(() => setErrorToast(null), 3000);
      if (!isLoadMore) setReceipts([]);
    } finally {
      if (isLoadMore) setLoadingMore(false);
      else setLoading(false);
    }
  }, [zid, customer, receiptDate]);

  useEffect(() => {
    setLimit(10);
    fetchReceipts(10, false);
  }, [fetchReceipts]);

  const handleSearch = () => {
    setLimit(10);
    setFiltersExpanded(false);
    fetchReceipts(10, false);
  };

  const loadMore = () => {
    if (loadingMore || !hasMore || loading) return;
    const newLimit = limit + 10;
    setLimit(newLimit);
    fetchReceipts(newLimit, true);
  };

  return (
    <div className="h-[100dvh] bg-bg-base flex flex-col relative max-w-md mx-auto shadow-2xl overflow-hidden md:max-w-full">
      {/* App Bar */}
      <header className="flex flex-col px-4 pt-8 pb-3 bg-white shadow-[0_2px_10px_rgb(0,0,0,0.02)] z-20 rounded-b-2xl shrink-0">
        <div className="flex items-center mb-4">
          <button 
            onClick={() => navigate(-1)}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-bg-base text-text-secondary active:scale-95 transition-transform"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="flex-1 text-center text-[14px] font-bold text-text-main pr-8">Receipt Voucher</h1>
        </div>
        
        {/* Tabs */}
        <div className="flex bg-[#fff7ed] rounded-xl p-1 border border-orange-100 shadow-sm mb-3">
          {[
            { id: '100001', label: 'HMBR' },
            { id: '100000', label: 'GI' },
            { id: '100005', label: 'Zepto' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setZid(tab.id);
              }}
              className={`flex-1 py-1.5 text-[12px] font-bold rounded-lg transition-colors ${
                zid === tab.id 
                  ? 'bg-white text-orange-600 shadow-[0_2px_8px_rgb(251,146,60,0.15)] border border-orange-200' 
                  : 'text-orange-900/60 hover:text-orange-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Filters Toggle */}
        <div className="flex justify-between items-center">
          <p className="text-[11px] text-text-muted font-medium">
            {receipts.length} receipt{receipts.length !== 1 ? 's' : ''} found
          </p>
          <button 
            onClick={() => setFiltersExpanded(!filtersExpanded)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors ${
              filtersExpanded 
                ? 'bg-orange-100/50 text-orange-600 border border-orange-200/50' 
                : 'bg-gray-50 text-text-secondary border border-gray-100 hover:bg-gray-100'
            }`}
          >
             <Filter className="w-3.5 h-3.5" />
             Filters
             {(receiptDate || customer) && (
               <span className="w-2 h-2 rounded-full bg-orange-500 ml-0.5"></span>
             )}
          </button>
        </div>

        {/* Expanded Filters */}
        {filtersExpanded && (
          <div className="mt-3 p-3 bg-[#fff7ed] rounded-xl border border-orange-100/50 space-y-3 animate-in fade-in slide-in-from-top-2">
             <div className="grid grid-cols-1 gap-3">
               <div>
                  <label className="block text-[10px] font-semibold text-text-muted mb-1 ml-1">Date</label>
                  <div className="relative flex items-center">
                    <input 
                      type="date" 
                      value={receiptDate}
                      onChange={(e) => setReceiptDate(e.target.value)}
                      className="w-full h-[36px] bg-white border border-ui-border rounded-lg text-[11px] px-2 pr-8 focus:outline-none focus:border-orange-400 text-text-main"
                    />
                    {receiptDate && (
                      <button
                        type="button"
                        onClick={() => setReceiptDate('')}
                        className="absolute right-2 text-text-muted hover:text-text-main"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
               </div>
             </div>

             <div>
               <label className="block text-[10px] font-semibold text-text-muted mb-1 ml-1">Customer</label>
               <CustomerSearch 
                  zid={zid}
                  employeeId={employeeId}
                  value={customer}
                  onChange={setCustomer}
                  placeholder="Search by ID, Name or Area"
               />
             </div>

             <div className="flex gap-2 pt-1 border-t border-orange-200/50 mt-3 !pt-3">
                <button 
                  onClick={() => {
                    setReceiptDate('');
                    setCustomer(null);
                  }}
                  className="flex-1 py-2 text-[11px] font-bold text-text-secondary bg-white border border-ui-border rounded-lg hover:bg-gray-50 active:scale-[0.98] transition-all"
                >
                  Clear
                </button>
                <button 
                  onClick={handleSearch}
                  className="flex-[2] py-2 text-[11px] font-bold text-white bg-orange-500 rounded-lg shadow-md shadow-orange-500/20 hover:bg-orange-600 active:scale-[0.98] transition-all disabled:opacity-50"
                  disabled={loading}
                >
                  Apply Filters
                </button>
             </div>
          </div>
        )}
      </header>

      <main className="flex-1 p-4 overflow-y-auto w-full md:max-w-3xl md:mx-auto pb-24">
        {loading && receipts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500 opacity-50 mb-4" />
            <p className="text-[11px] font-bold text-text-muted">Loading receipts...</p>
          </div>
        ) : receipts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center mt-12">
            <Receipt className="w-12 h-12 text-orange-200 mb-3" />
            <p className="text-[12px] font-bold text-text-muted">No receipts found.</p>
            <p className="text-[11px] text-text-muted max-w-[200px] mt-1">Try adjusting your filters or try a different date range.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {receipts.map((rct, i) => (
              <div 
                key={`${rct.xvoucher}-${i}`} 
                className="bg-[#fff7ed] border border-orange-100 p-3.5 rounded-[16px] shadow-[0_2px_10px_rgb(0,0,0,0.03)]"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1 pr-2">
                    <h3 className="text-[13px] font-bold text-text-main flex items-start gap-1.5 leading-tight">
                      <User className="w-3.5 h-3.5 text-orange-400 shrink-0 mt-0.5" />
                       {rct.xsub || "Unknown Customer"}--{rct.xshort || "Unknown Customer"}
                    </h3>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[12px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      ৳{Math.abs(rct.xprime).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 mb-3 p-2.5 bg-white/60 rounded-[12px] border border-orange-50">
                  <div className="flex justify-between">
                     <div className="flex items-center gap-1.5">
                       <Hash className="w-3.5 h-3.5 text-orange-400/70 shrink-0" />
                       <span className="text-[10px] font-medium text-text-secondary truncate">
                         Voucher: <span className="font-bold text-text-main">{rct.xvoucher}</span>
                       </span>
                     </div>
                     {rct.xdate && (
                       <div className="flex items-center gap-1.5">
                         <Calendar className="w-3.5 h-3.5 text-orange-400/70 shrink-0" />
                         <span className="text-[10px] font-medium text-text-secondary">{rct.xdate}</span>
                       </div>
                     )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 mt-2 text-[10px] text-text-muted px-1">
                    <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                       <span className="text-[8px] font-bold">SP</span>
                    </span>
                    <span className="truncate">{rct.xname} ({rct.xsp})</span>
                </div>
              </div>
            ))}

            {hasMore && receipts.length > 0 && (
               <div className="flex justify-center mt-6 mb-2">
                 <button 
                    onClick={loadMore}
                    disabled={loadingMore}
                    className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-white border border-orange-200 text-orange-600 font-bold text-[11px] shadow-sm hover:bg-orange-50 active:scale-95 transition-all disabled:opacity-50"
                 >
                    {loadingMore ? (
                      <Loader2 className="w-4 h-4 animate-spin text-orange-600" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                    {loadingMore ? 'Loading...' : 'Load More'}
                 </button>
               </div>
            )}
            
            {!hasMore && receipts.length > 0 && (
               <div className="text-center mt-6 mb-2 text-[11px] text-orange-900/40 font-medium">
                  {receipts.length} receipts loaded.
               </div>
            )}
          </div>
        )}
      </main>
      
      {/* Error Toast */}
      {errorToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-4 fade-in duration-300">
          <div className="bg-red-500 text-white px-4 py-2 rounded-full shadow-lg shadow-red-500/20 text-[12px] font-medium flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
            {errorToast}
          </div>
        </div>
      )}
    </div>
  );
}
