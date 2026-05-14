import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Filter, X, Package, Calendar, Hash, User, TrendingUp, ChevronDown, ChevronUp, Building2, Circle, RotateCcw } from 'lucide-react';
import { getSalesReturns, ReturnOrder } from '../api_return';
import { Customer } from '../api_customers';
import { Item } from '../api_items';
import { CustomerSearch, ItemSearch } from '../components';
import Header from '../components/ui/Header';
import BusinessTabs from '../components/BusinessTabs';
import LoadMoreButton from '../components/LoadMoreButton';
import { useCurrentUser } from '../hooks/useCurrentUser';

export default function ReturnList() {
  const navigate = useNavigate();
  const { employeeId } = useCurrentUser();
  const [returns, setReturns] = useState<ReturnOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [limit, setLimit] = useState(10);
  const [hasMore, setHasMore] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('100001');

  // Filters
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [xdornum, setXdornum] = useState<string>('');
  const [xcrnnum, setXcrnnum] = useState<string>('');
  const [xdate, setXdate] = useState<string>('');
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [item, setItem] = useState<Item | null>(null);
  const [expandedReturns, setExpandedReturns] = useState<Record<string, boolean>>({});

  const fetchReturns = useCallback(async (currentLimit: number, isLoadMore = false) => {
    if (isLoadMore) setLoadingMore(true);
    else setLoading(true);
    try {
      const res = await getSalesReturns({
        zid: activeTab, 
        limit: currentLimit,
        xdornum: xdornum || undefined, 
        xcrnnum: xcrnnum || undefined,
        xcus: customer?.xcus || undefined,
        xdate: xdate || undefined, 
        xitem: item?.item_id || undefined,
      });
      const fetchedReturns = res.returns || [];
      setReturns(prev => {
        if (!isLoadMore) return fetchedReturns;
        if (fetchedReturns.length >= prev.length) return fetchedReturns;
        const newReturns = fetchedReturns.filter(
          (fr: ReturnOrder) => !prev.some((pr) => pr.xcrnnum === fr.xcrnnum)
        );
        return [...prev, ...newReturns];
      });
      setHasMore(fetchedReturns.length >= currentLimit);
    } catch (error) {
      console.error('Failed to fetch returns:', error);
      if (!isLoadMore) setReturns([]);
    } finally {
      if (isLoadMore) setLoadingMore(false);
      else setLoading(false);
    }
  }, [activeTab, xdornum, xcrnnum, customer, xdate, item]);

  useEffect(() => {
    setLimit(10);
    fetchReturns(10);
  }, [fetchReturns]);

  const handleSearch = () => {
    setLimit(10);
    setFiltersExpanded(false);
    fetchReturns(10, false);
  };

  const loadMore = () => {
    if (loadingMore || !hasMore || loading) return;
    const newLimit = limit + 10;
    setLimit(newLimit);
    fetchReturns(newLimit, true);
  };

  const clearFilters = () => {
    setXdornum(''); setXcrnnum(''); setXdate(''); setCustomer(null); setItem(null); setLimit(10);
  };

  const toggleExpand = (id: string) => {
    setExpandedReturns(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case '1-Open': return { color: 'bg-emerald-100', textColor: 'text-emerald-700', text: 'Open', dotColor: 'bg-emerald-500' };
      case '2-Confirmed': return { color: 'bg-blue-100', textColor: 'text-blue-700', text: 'Confirmed', dotColor: 'bg-blue-500' };
      case '3-Posted': return { color: 'bg-purple-100', textColor: 'text-purple-700', text: 'Posted', dotColor: 'bg-purple-500' };
      case '4-Cancelled': return { color: 'bg-red-100', textColor: 'text-red-700', text: 'Cancelled', dotColor: 'bg-red-500' };
      default: return { color: 'bg-gray-100', textColor: 'text-gray-700', text: status || 'Unknown', dotColor: 'bg-gray-500' };
    }
  };

  return (
    <div className="h-[100dvh] bg-bg-base flex flex-col relative max-w-md mx-auto shadow-2xl overflow-hidden md:max-w-full">
      <Header title="Sales Returns">
        <div className="mt-4">
          <BusinessTabs activeTab={activeTab} onChange={setActiveTab} className="mb-3" />
        </div>
        {/* Filters Toggle */}
        <div className="flex justify-between items-center">
          <p className="text-[11px] text-text-muted font-medium">{returns.length} return{returns.length !== 1 ? 's' : ''} found</p>
          <button onClick={() => setFiltersExpanded(!filtersExpanded)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors ${filtersExpanded ? 'bg-orange-100/50 text-orange-600 border border-orange-200/50' : 'bg-gray-50 text-text-secondary border border-gray-100 hover:bg-gray-100'}`}>
            <Filter className="w-3.5 h-3.5" /> Filters
            {(xdornum || xcrnnum || xdate || customer || item) && <span className="w-2 h-2 rounded-full bg-orange-500 ml-0.5"></span>}
          </button>
        </div>
        {filtersExpanded && (
          <div className="mt-3 p-3 bg-[#fff7ed] rounded-xl border border-orange-100/50 space-y-3 animate-in fade-in slide-in-from-top-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-semibold text-text-muted mb-1 ml-1">DO Number</label>
                <input type="text" value={xdornum} onChange={(e) => setXdornum(e.target.value)} placeholder="e.g. DO--"
                  className="w-full h-[36px] bg-white border border-ui-border rounded-lg text-[11px] px-3 focus:outline-none focus:border-orange-400 text-text-main" />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-text-muted mb-1 ml-1">CRN Number</label>
                <input type="text" value={xcrnnum} onChange={(e) => setXcrnnum(e.target.value)} placeholder="e.g. SR--"
                  className="w-full h-[36px] bg-white border border-ui-border rounded-lg text-[11px] px-3 focus:outline-none focus:border-orange-400 text-text-main" />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-text-muted mb-1 ml-1">Date</label>
              <div className="relative flex items-center">
                <input type="date" value={xdate} onChange={(e) => setXdate(e.target.value)}
                  className="w-full h-[36px] bg-white border border-ui-border rounded-lg text-[11px] px-2 pr-8 focus:outline-none focus:border-orange-400 text-text-main" />
                {xdate && <button type="button" onClick={() => setXdate('')} className="absolute right-2 text-text-muted hover:text-text-main"><X className="w-4 h-4" /></button>}
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-text-muted mb-1 ml-1">Customer</label>
              <CustomerSearch zid={activeTab} employeeId={employeeId} value={customer} onChange={setCustomer} placeholder="Search by ID, Name or Area" />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-text-muted mb-1 ml-1">Item</label>
              <ItemSearch zid={activeTab} value={item} onChange={setItem} placeholder="Search item..." />
            </div>
            <div className="flex gap-2 pt-1 border-t border-orange-200/50 mt-3 !pt-3">
              <button onClick={clearFilters} className="flex-1 py-2 text-[11px] font-bold text-text-secondary bg-white border border-ui-border rounded-lg hover:bg-gray-50 active:scale-[0.98] transition-all">Clear</button>
              <button onClick={handleSearch} className="flex-[2] py-2 text-[11px] font-bold text-white bg-orange-500 rounded-lg shadow-md shadow-orange-500/20 hover:bg-orange-600 active:scale-[0.98] transition-all disabled:opacity-50" disabled={loading}>Apply Filters</button>
            </div>
          </div>
        )}
      </Header>

      <main className="flex-1 p-4 overflow-y-auto w-full md:max-w-3xl md:mx-auto pb-24">
        {loading && returns.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500 opacity-50 mb-4" />
            <p className="text-[11px] font-bold text-text-muted">Loading returns...</p>
          </div>
        ) : returns.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <RotateCcw className="w-12 h-12 text-orange-200 mb-3" />
            <p className="text-[12px] font-bold text-text-muted">No sales returns found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {returns.map((ret, i) => {
              const isExpanded = expandedReturns[ret.xcrnnum];
              const statusBadge = getStatusBadge(ret.xstatuscrn);
              const returnTotal = ret.items?.reduce((sum, it) => sum + (it.xlineamt || 0), 0) || 0;
              
              return (
                <div key={ret.xcrnnum || i} className="bg-[#fff7ed] border border-orange-100 p-3.5 rounded-[16px] shadow-[0_2px_10px_rgb(0,0,0,0.03)]">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5 text-orange-400" />
                      <span className="text-[10px] font-semibold text-text-muted">ZID: {ret.zid}</span>
                    </div>
                    <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full ${statusBadge.color}`}>
                      <Circle className={`w-1.5 h-1.5 ${statusBadge.dotColor} fill-current`} />
                      <span className={`text-[9px] font-bold ${statusBadge.textColor}`}>{statusBadge.text}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-[13px] font-bold text-text-main flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-orange-400" />{ret.xorg || ret.xcus}
                      </h3>
                      <p className="text-[10px] text-text-muted ml-5">{ret.xadd1}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[12px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />৳{returnTotal.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5 mb-3 p-2.5 bg-white/60 rounded-[12px] border border-orange-50">
                    <div className="flex justify-between">
                      <div className="flex items-center gap-1.5">
                        <RotateCcw className="w-3.5 h-3.5 text-orange-400/70 shrink-0" />
                        <span className="text-[10px] font-medium text-text-secondary truncate">
                          CRN: <span className="font-bold text-text-main">{ret.xcrnnum}</span>
                        </span>
                      </div>
                      {ret.xdate && (
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-orange-400/70 shrink-0" />
                          <span className="text-[10px] font-medium text-text-secondary">{ret.xdate}</span>
                        </div>
                      )}
                    </div>
                    {ret.xdornum && (
                      <div className="flex items-center gap-1.5 pt-1 border-t border-orange-50">
                        <Hash className="w-3.5 h-3.5 text-orange-400/70 shrink-0" />
                        <span className="text-[10px] font-medium text-text-secondary">DO No: <span className="font-bold text-orange-600/80">{ret.xdornum}</span></span>
                      </div>
                    )}
                    {ret.xordernum && (
                      <div className="flex items-center gap-1.5 pt-1 border-t border-orange-50">
                        <Package className="w-3.5 h-3.5 text-orange-400/70 shrink-0" />
                        <span className="text-[10px] font-medium text-text-secondary">Order No: <span className="font-bold text-orange-600/80">{ret.xordernum}</span></span>
                      </div>
                    )}
                  </div>
                  {ret.items && ret.items.length > 0 && (
                    <div className="mt-2 bg-white/60 rounded-[12px] overflow-hidden border border-orange-50">
                      <button onClick={() => toggleExpand(ret.xcrnnum)} className="w-full flex items-center justify-between p-2.5 hover:bg-orange-50/50 transition-colors">
                        <span className="text-[11px] font-bold text-text-secondary flex items-center gap-1.5">
                          <Package className="w-3.5 h-3.5 text-orange-400" />{ret.items.length} Item{ret.items.length !== 1 ? 's' : ''}
                        </span>
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-text-muted" /> : <ChevronDown className="w-4 h-4 text-text-muted" />}
                      </button>
                      {isExpanded && (
                        <div className="p-2 border-t border-orange-50/50 space-y-1.5 bg-white/40">
                          {ret.items.map((it, idx) => (
                            <div key={idx} className="flex justify-between items-start py-1.5 border-b border-ui-border/30 last:border-0">
                              <div className="flex-1 pr-2">
                                <div className="text-[10px] font-bold text-text-main leading-tight mb-0.5 max-w-[200px]">{it.xdesc}</div>
                                <div className="text-[9px] text-text-muted font-bold">Item: {it.xitem} • ৳{it.xrate}</div>
                                <div className="text-[9px] text-text-muted font-bold">Unit: {it.xunitsel}</div>
                              </div>
                              <div className="text-right shrink-0">
                                <div className="text-[10px] font-semibold text-teal-900">৳{it.xlineamt?.toLocaleString()}</div>
                                <div className="text-[9px] text-text-muted font-bold">Qty: {it.xqty}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            {hasMore && returns.length > 0 && <LoadMoreButton loading={loadingMore} onClick={loadMore} />}
            {!hasMore && returns.length > 0 && (
              <div className="text-center mt-6 mb-2 text-[11px] text-orange-900/40 font-medium">{returns.length} returns loaded.</div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
