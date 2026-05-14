import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Filter, X, Package, Calendar, Hash, User, TrendingUp, ChevronDown, ChevronUp, Building2, Circle } from 'lucide-react';
import { getDeliveryOrders, DeliveryOrder } from '../api_delivery_orders';
import { Customer } from '../api_customers';
import { Item } from '../api_items';
import { CustomerSearch, ItemSearch } from '../components';
import Header from '../components/ui/Header';
import BusinessTabs from '../components/BusinessTabs';
import LoadMoreButton from '../components/LoadMoreButton';
import { useCurrentUser } from '../hooks/useCurrentUser';

export default function DeliveryOrders() {
  const navigate = useNavigate();
  const { employeeId } = useCurrentUser();
  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [limit, setLimit] = useState(10);
  const [hasMore, setHasMore] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('100001');

  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [xdornum, setXdornum] = useState<string>('');
  const [xdate, setXdate] = useState<string>('');
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [item, setItem] = useState<Item | null>(null);
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});

  const fetchOrders = useCallback(async (currentLimit: number, isLoadMore = false) => {
    if (isLoadMore) setLoadingMore(true);
    else setLoading(true);
    try {
      const res = await getDeliveryOrders({
        zid: activeTab, limit: currentLimit,
        xdornum: xdornum || undefined, xcus: customer?.xcus || undefined,
        xdate: xdate || undefined, xitem: item?.item_id || undefined,
      });
      const fetchedOrders = res.delivery_orders || [];
      setOrders(prev => {
        if (!isLoadMore) return fetchedOrders;
        if (fetchedOrders.length >= prev.length) return fetchedOrders;
        const newOrders = fetchedOrders.filter(
          (fo: DeliveryOrder) => !prev.some((po) => po.xdornum === fo.xdornum)
        );
        return [...prev, ...newOrders];
      });
      setHasMore(fetchedOrders.length >= currentLimit);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      if (!isLoadMore) setOrders([]);
    } finally {
      if (isLoadMore) setLoadingMore(false);
      else setLoading(false);
    }
  }, [activeTab, xdornum, customer, xdate, item]);

  useEffect(() => {
    setLimit(10);
    fetchOrders(10);
  }, [fetchOrders]);

  const handleSearch = () => {
    setLimit(10);
    setFiltersExpanded(false);
    fetchOrders(10, false);
  };

  const loadMore = () => {
    if (loadingMore || !hasMore || loading) return;
    const newLimit = limit + 10;
    setLimit(newLimit);
    fetchOrders(newLimit, true);
  };

  const clearFilters = () => {
    setXdornum(''); setXdate(''); setCustomer(null); setItem(null); setLimit(10);
  };

  const toggleExpand = (id: string) => {
    setExpandedOrders(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case '2-Confirmed': return { color: 'bg-emerald-100', textColor: 'text-emerald-700', text: 'Confirmed', dotColor: 'bg-emerald-500' };
      case '3-Invoiced': return { color: 'bg-blue-100', textColor: 'text-blue-700', text: 'Invoiced', dotColor: 'bg-blue-500' };
      case '1-Pending': return { color: 'bg-amber-100', textColor: 'text-amber-700', text: 'Pending', dotColor: 'bg-amber-500' };
      case '4-Cancelled': return { color: 'bg-red-100', textColor: 'text-red-700', text: 'Cancelled', dotColor: 'bg-red-500' };
      default: return { color: 'bg-gray-100', textColor: 'text-gray-700', text: status || 'Unknown', dotColor: 'bg-gray-500' };
    }
  };

  return (
    <div className="page-root">
      <Header title="Delivery Orders">
        <div className="mt-4">
          <BusinessTabs activeTab={activeTab} onChange={setActiveTab} className="mb-3" />
        </div>
        {/* Filters Toggle */}
        <div className="flex justify-between items-center">
          <p className="text-[11px] text-text-muted font-medium">{orders.length} order{orders.length !== 1 ? 's' : ''} found</p>
          <button onClick={() => setFiltersExpanded(!filtersExpanded)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors ${filtersExpanded ? 'bg-orange-100/50 text-orange-600 border border-orange-200/50' : 'bg-gray-50 text-text-secondary border border-gray-100 hover:bg-gray-100'}`}>
            <Filter className="w-3.5 h-3.5" /> Filters
            {(xdornum || xdate || customer || item) && <span className="w-2 h-2 rounded-full bg-orange-500 ml-0.5"></span>}
          </button>
        </div>
        {filtersExpanded && (
          <div className="mt-3 p-3 bg-[#fff7ed] rounded-xl border border-orange-100/50 space-y-3 animate-in fade-in slide-in-from-top-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-semibold text-text-muted mb-1 ml-1">DO Number</label>
                <input type="text" value={xdornum} onChange={(e) => setXdornum(e.target.value)} placeholder="e.g. DO--490864"
                  className="w-full h-[36px] bg-white border border-ui-border rounded-lg text-[11px] px-3 focus:outline-none focus:border-orange-400 text-text-main" />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-text-muted mb-1 ml-1">Date</label>
                <div className="relative flex items-center">
                  <input type="date" value={xdate} onChange={(e) => setXdate(e.target.value)}
                    className="w-full h-[36px] bg-white border border-ui-border rounded-lg text-[11px] px-2 pr-8 focus:outline-none focus:border-orange-400 text-text-main" />
                  {xdate && <button type="button" onClick={() => setXdate('')} className="absolute right-2 text-text-muted hover:text-text-main"><X className="w-4 h-4" /></button>}
                </div>
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

      <main className="flex-1 overflow-y-auto pb-24">
        <div className="page-content px-4 py-4">
        {loading && orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500 opacity-50 mb-4" />
            <p className="text-[11px] font-bold text-text-muted">Loading delivery orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Package className="w-12 h-12 text-orange-200 mb-3" />
            <p className="text-[12px] font-bold text-text-muted">No delivery orders found.</p>
          </div>
        ) : (
          <div className="card-grid">
            {orders.map((order, i) => {
              const isExpanded = expandedOrders[order.xdornum];
              const statusBadge = getStatusBadge(order.xstatusdor);
              return (
                <div key={order.xdornum || i} className="bg-[#fff7ed] border border-orange-100 p-3.5 rounded-[16px] shadow-[0_2px_10px_rgb(0,0,0,0.03)]">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2"><Building2 className="w-3.5 h-3.5 text-orange-400" /><span className="text-[10px] font-semibold text-text-muted">ZID: {order.zid}</span></div>
                    <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full ${statusBadge.color}`}>
                      <Circle className={`w-1.5 h-1.5 ${statusBadge.dotColor} fill-current`} /><span className={`text-[9px] font-bold ${statusBadge.textColor}`}>{statusBadge.text}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-[13px] font-bold text-text-main flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-orange-400" />{order.xshort || order.xcus}</h3>
                      <p className="text-[10px] text-text-muted ml-5">{order.xadd1}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[12px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100 flex items-center gap-1"><TrendingUp className="w-3 h-3" />৳{order.netamt?.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5 mb-3 p-2.5 bg-white/60 rounded-[12px] border border-orange-50">
                    <div className="flex justify-between">
                      <div className="flex items-center gap-1.5"><Hash className="w-3.5 h-3.5 text-orange-400/70 shrink-0" /><span className="text-[10px] font-medium text-text-secondary truncate">DO: <span className="font-bold text-text-main">{order.xdornum}</span></span></div>
                      {order.xdate && <div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-orange-400/70 shrink-0" /><span className="text-[10px] font-medium text-text-secondary">{order.xdate}</span></div>}
                    </div>
                    {order.xordernum && (
                      <div className="flex items-center gap-1.5 pt-1 border-t border-orange-50">
                        <Package className="w-3.5 h-3.5 text-orange-400/70 shrink-0" />
                        <span className="text-[10px] font-medium text-text-secondary">Order No: <span className="font-bold text-orange-600/80">{order.xordernum}</span></span>
                      </div>
                    )}
                  </div>
                  {order.items && order.items.length > 0 && (
                    <div className="mt-2 bg-white/60 rounded-[12px] overflow-hidden border border-orange-50">
                      <button onClick={() => toggleExpand(order.xdornum)} className="w-full flex items-center justify-between p-2.5 hover:bg-orange-50/50 transition-colors">
                        <span className="text-[11px] font-bold text-text-secondary flex items-center gap-1.5"><Package className="w-3.5 h-3.5 text-orange-400" />{order.items.length} Item{order.items.length !== 1 ? 's' : ''}</span>
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-text-muted" /> : <ChevronDown className="w-4 h-4 text-text-muted" />}
                      </button>
                      {isExpanded && (
                        <div className="p-2 border-t border-orange-50/50 space-y-1.5 bg-white/40">
                          {order.items.map((it, idx) => (
                            <div key={idx} className="flex justify-between items-start py-1.5 border-b border-ui-border/30 last:border-0">
                              <div className="flex-1 pr-2">
                                <div className="text-[10px] font-bold text-text-main leading-tight mb-0.5 max-w-[200px]">{it.xdesc}</div>
                                <div className="text-[9px] text-text-muted font-bold">Item: {it.xitem} • ৳{it.xrate}</div>
                                <div className="text-[9px] text-text-muted font-bold">Unit: {it.xunitstk}</div>
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
                  <div className="flex gap-2 mt-3 pt-3 border-t border-orange-200/50">
                    <button onClick={() => navigate('/pay-date', { state: { order } })} className="flex-1 py-2 text-[10px] font-bold text-orange-600 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors">Pay Date {order.xdatepay ? `(${order.xdatepay})` : ''}</button>
                    <button onClick={() => navigate('/sales-return', { state: { order } })} className="flex-1 py-2 text-[10px] font-bold text-slate-600 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors">Return</button>
                  </div>
                </div>
              );
            })}
            {hasMore && orders.length > 0 && <LoadMoreButton loading={loadingMore} onClick={loadMore} />}
            {!hasMore && orders.length > 0 && (
              <div className="text-center mt-6 mb-2 text-[11px] text-orange-900/40 font-medium">{orders.length} orders loaded.</div>
            )}
          </div>
        )}
        </div>
      </main>
    </div>
  );
}