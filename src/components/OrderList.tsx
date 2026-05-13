import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, TrendingUp } from 'lucide-react';
import { PendingOrder } from '../api_orders';
import { Card } from './Card';

interface OrderListProps {
  title: string;
  orders: PendingOrder[];
  loading?: boolean;
  viewAllLink?: string;
  emptyMessage?: string;
}

export function OrderList({ title, orders, loading, viewAllLink, emptyMessage = "No orders found." }: OrderListProps) {
  const navigate = useNavigate();

  const getBusinessBadgeColor = (zid: number | string) => {
    switch (String(zid)) {
      case '100000': return 'text-emerald-800 bg-emerald-100/80 border-emerald-200';
      case '100001': return 'text-blue-800 bg-blue-100/80 border-blue-200';
      case '100005': return 'text-purple-800 bg-purple-100/80 border-purple-200';
      default: return 'text-orange-800 bg-orange-100/80 border-orange-200';
    }
  };

  const getBusinessName = (zid: number | string) => {
    const map: Record<string, string> = {
      '100000': 'GI',
      '100001': 'HMBR',
      '100005': 'Zepto',
    };
    return map[String(zid)] || 'Unknown';
  };

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-3 mt-4">
        <h3 className="text-sm font-bold text-text-main">{title}</h3>
      </div>
      
      {loading ? (
        <div className="flex justify-center py-6">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        </div>
      ) : orders.length === 0 ? (
        <Card className="!p-3 !rounded-xl mb-4 text-center text-text-muted text-[12px] py-6">
          {emptyMessage}
        </Card>
      ) : (
        <Card className="!p-2 !rounded-xl mb-2 overflow-hidden bg-white shadow-[0_2px_10px_rgb(0,0,0,0.04)]">
          {orders.map((order, i) => (
            <div key={order.invoiceno || i} className={`flex flex-col p-2.5 ${i !== orders.length - 1 ? 'border-b border-ui-border/40' : ''}`}>
              <div className="flex justify-between items-start mb-1">
                <span className="text-[11px] font-bold text-text-main leading-tight truncate mr-2">
                  {order.xcusname}
                </span>
                <span className="text-[11px] font-bold text-primary whitespace-nowrap bg-primary/10 px-1.5 py-0.5 rounded ml-auto flex-shrink-0">
                  <TrendingUp className="w-3 h-3 inline mr-1 opacity-70" />
                  ৳{order.total_linetotal?.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <div className="flex items-center gap-1.5 text-text-muted">
                  <Package className="w-3 h-3 opacity-70" />
                  <span className="font-mono">{order.invoiceno}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-text-muted">{order.xcus}</span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 border ${getBusinessBadgeColor(order.zid)}`}>
                    {getBusinessName(order.zid)}
                  </span>
                </div>
              </div>
            </div>
          ))}
          
          {viewAllLink && (
            <button 
              onClick={() => navigate(viewAllLink)}
              className="w-full text-center py-2 text-[11px] font-bold text-primary hover:bg-primary/5 transition-colors border-t border-ui-border/40"
            >
              View All
            </button>
          )}
        </Card>
      )}
    </div>
  );
}
