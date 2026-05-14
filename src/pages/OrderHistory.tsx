import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Calendar, Package, TrendingUp, Hash, User, List } from 'lucide-react';
import { getPendingOrders, getConfirmedOrders, getCancelledOrders, PendingOrder } from '../api_orders';
import Header from '../components/ui/Header';
import BusinessTabs from '../components/BusinessTabs';
import LoadMoreButton from '../components/LoadMoreButton';

interface OrderHistoryProps {
  type: 'pending' | 'confirmed' | 'cancelled';
}

export default function OrderHistory({ type }: OrderHistoryProps) {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<PendingOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [limit, setLimit] = useState(10);
  const [hasMore, setHasMore] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('100001');

  const getTitle = () => {
    switch(type) {
      case 'pending': return 'Pending Orders';
      case 'confirmed': return 'Confirmed Orders';
      case 'cancelled': return 'Cancelled Orders';
      default: return 'Orders';
    }
  };

  const fetchOrders = useCallback(async (currentLimit: number, isLoadMore = false) => {
    if (isLoadMore) setLoadingMore(true);
    else setLoading(true);
    try {
      let fetchFn;
      if (type === 'pending') fetchFn = getPendingOrders;
      else if (type === 'confirmed') fetchFn = getConfirmedOrders;
      else fetchFn = getCancelledOrders;
      const res = await fetchFn(currentLimit, activeTab);
      const fetchedOrders = res.orders || [];
      setOrders(prev => {
        if (!isLoadMore) return fetchedOrders;
        if (fetchedOrders.length >= prev.length) return fetchedOrders;
        const newOrders = fetchedOrders.filter(
          (fo: PendingOrder) => !prev.some((po) => po.invoiceno === fo.invoiceno)
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
  }, [type, activeTab]);

  useEffect(() => {
    setLimit(10);
    fetchOrders(10);
  }, [fetchOrders, activeTab]);

  const loadMore = () => {
    if (loadingMore || !hasMore || loading) return;
    const newLimit = limit + 10;
    setLimit(newLimit);
    fetchOrders(newLimit, true);
  };

  return (
    <div className="h-[100dvh] bg-bg-base flex flex-col relative max-w-md mx-auto shadow-2xl overflow-hidden md:max-w-full">
      <Header title={getTitle()}>
        <div className="mt-4">
          <BusinessTabs activeTab={activeTab} onChange={setActiveTab} />
        </div>
      </Header>

      <main className="flex-1 p-4 overflow-y-auto w-full md:max-w-3xl md:mx-auto pb-24">
        {loading && orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500 opacity-50 mb-4" />
            <p className="text-[11px] font-bold text-text-muted">Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Package className="w-12 h-12 text-orange-200 mb-3" />
            <p className="text-[12px] font-bold text-text-muted">No {type} orders found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order, i) => (
              <div key={order.invoiceno || i} className="bg-[#fff7ed] border border-orange-100 p-3.5 rounded-[16px] shadow-[0_2px_10px_rgb(0,0,0,0.03)]">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-[13px] font-bold text-text-main flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-orange-400" />{order.xcusname}
                    </h3>
                    <p className="text-[10px] text-text-muted ml-5">{order.xcus}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[12px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />৳{order.total_linetotal?.toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 mb-3 p-2.5 bg-white/60 rounded-[12px] border border-orange-50">
                  <div className="flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5 text-orange-400/70 shrink-0" />
                    <span className="text-[10px] font-medium text-text-secondary truncate" title={order.invoiceno}>Inv: {order.invoiceno}</span>
                  </div>
                  {order.xordernum && (
                    <div className="flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 text-orange-400/70 shrink-0" />
                      <span className="text-[10px] font-bold text-text-main">Order No: <span className="text-orange-600/80">{order.xordernum}</span></span>
                    </div>
                  )}
                  {order.xdate && (
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-orange-400/70 shrink-0" />
                      <span className="text-[10px] font-medium text-text-secondary">{order.xdate}</span>
                    </div>
                  )}
                </div>
                {order.items && (
                  <div className="mt-1">
                    <div className="flex items-start gap-1.5">
                      <List className="w-3.5 h-3.5 text-text-muted mt-0.5" />
                      <p className="text-[10px] text-text-muted line-clamp-2 leading-relaxed flex-1">{order.items}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {hasMore && orders.length > 0 && <LoadMoreButton loading={loadingMore} onClick={loadMore} />}
            {!hasMore && orders.length > 0 && (
              <div className="text-center mt-6 mb-2 text-[11px] text-orange-900/40 font-medium">{orders.length} orders loaded.</div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
