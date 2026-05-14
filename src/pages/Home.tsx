import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Send, CheckCircle2, Minus, Trash2, Plus } from 'lucide-react';
import { BarChart3 } from 'lucide-react';
import { Card, Button, ConfirmModal } from '../components';
import { DASHBOARD_ACTIONS } from '../components/dashboard/dashboard-actions';
import ActionGrid from '../components/dashboard/ActionGrid';
import MobileBottomNav from '../components/navigation/MobileBottomNav';
import MobileTopBar from '../components/navigation/MobileTopBar';
import Toast from '../components/ui/Toast';
import FullPageLoader from '../components/FullPageLoader';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { usePendingOrders } from '../hooks/usePendingOrders';
import { getBusinessName, getBusinessBadgeColor } from '../utils/business';

export default function Home() {
  const { user, loading: initialLoading, handleLogout } = useCurrentUser();
  const {
    pendingOrders, isSending, loadOrders,
    updateQuantity, removeItem, sendSingleOrder, sendAllOrders,
    errorToast, successToast,
  } = usePendingOrders();

  const [activeTab, setActiveTab] = useState('dashboard');
  const navigate = useNavigate();

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{isOpen: boolean, type: 'single' | 'all', index: number | null}>({isOpen: false, type: 'all', index: null});

  // Reload pending orders when switching to send_orders tab
  const handleTabChange = (tab: string) => {
    if (tab === 'profile') {
      navigate('/profile');
    } else {
      if (tab === 'send_orders') {
        loadOrders();
      }
      setActiveTab(tab);
    }
  };

  const handleSendSingleOrder = (index: number) => {
    setConfirmModal({isOpen: true, type: 'single', index});
  };

  const executeSendSingleOrder = async () => {
    if (confirmModal.index === null) return;
    setConfirmModal({...confirmModal, isOpen: false});
    
    const success = await sendSingleOrder(confirmModal.index);
    if (success && pendingOrders.length <= 1) {
      setActiveTab('dashboard');
    }
  };

  const handleSendAllOrders = () => {
    if (pendingOrders.length === 0) return;
    setConfirmModal({isOpen: true, type: 'all', index: null});
  };
  
  const executeSendAllOrders = async () => {
    setConfirmModal({...confirmModal, isOpen: false});
    
    const success = await sendAllOrders();
    if (success) {
      setActiveTab('dashboard');
    }
  };

  if (initialLoading) {
    return <FullPageLoader />;
  }

  return (
    <div className="min-h-[100dvh] bg-bg-base flex flex-col pb-16 relative max-w-md mx-auto shadow-2xl overflow-hidden">
      <MobileTopBar user={user} onLogout={handleLogout} />

      <main className="flex-1 p-4 overflow-y-auto">
        {activeTab === 'send_orders' ? (
          <div className="pb-20 relative min-h-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[16px] font-bold text-text-main">Pending Orders</h2>
              {pendingOrders.length > 0 && (
                <span className="text-[11px] font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                  {pendingOrders.length} orders
                </span>
              )}
            </div>

            {pendingOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <CheckCircle2 className="w-12 h-12 text-success/50 mb-3" />
                <p className="text-[14px] font-bold text-text-main">All Caught Up</p>
                <p className="text-[11px] text-text-muted mt-1">No pending orders to send.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingOrders.map((order, idx) => {
                  const totalAmount = order.items.reduce((sum: number, item: any) => sum + item.xlinetotal, 0);
                  return (
                    <Card key={idx} className="!p-3 !rounded-[12px] bg-orange-100/80 border-orange-200 shadow-sm">
                      <div className="flex justify-between items-start mb-3 border-b border-orange-200/60 pb-2">
                        <div className="flex-1 pr-2">
                          <div className="flex items-baseline gap-2 flex-wrap">
                            <p className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide border shrink-0 ${getBusinessBadgeColor(order.zid)}`}>
                              {getBusinessName(order.zid)}--{order.zid}
                            </p>
                            <h3 className="text-[13px] font-bold text-text-main leading-tight break-words">
                              {order.xcusname} <span className="text-[10px] text-text-muted font-medium ml-1">({order.xcus})</span>
                            </h3>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-[9px] text-text-muted mb-0.5 uppercase tracking-wide font-bold">Total</p>
                          <p className="text-[13px] font-bold text-primary">৳{totalAmount.toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="space-y-2 mb-3 max-h-[180px] overflow-y-auto pr-1">
                        {order.items.map((item: any, iIdx: number) => (
                          <div key={iIdx} className="flex justify-between items-start bg-white p-2 rounded-lg border border-ui-border/40 shadow-sm">
                            <div className="flex-1 min-w-0 pr-2">
                              <p className="text-[11px] font-bold text-text-main line-clamp-1 mb-0.5">{item.xdesc}</p>
                              <p className="text-[9px] text-text-muted font-medium">{item.xitem} • ৳{item.xprice}</p>
                            </div>
                            <div className="flex flex-col items-end shrink-0 gap-1.5">
                              <span className="text-[11px] font-bold text-text-main">৳{item.xlinetotal.toLocaleString()}</span>
                              <div className="flex items-center gap-1.5">
                                <div className="flex items-center border border-ui-border rounded-lg overflow-hidden">
                                  <button onClick={() => updateQuantity(idx, iIdx, -1)} className="w-7 h-7 flex items-center justify-center bg-gray-50 hover:bg-gray-200 text-text-main transition-colors active:bg-gray-300">
                                    <Minus className="w-3.5 h-3.5" />
                                  </button>
                                  <span className="w-7 text-center text-[11px] font-bold text-text-main">{item.xqty}</span>
                                  <button onClick={() => updateQuantity(idx, iIdx, 1)} className="w-7 h-7 flex items-center justify-center bg-gray-50 hover:bg-gray-200 text-text-main transition-colors active:bg-gray-300">
                                    <Plus className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                                <button onClick={() => removeItem(idx, iIdx)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors active:bg-red-200">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center justify-between pt-1.5 border-t border-ui-border/50">
                        <p className="text-[10px] text-text-secondary font-medium">{order.items.length} items</p>
                        <Button variant="primary" size="sm" className="!h-7 !px-3 !rounded-md text-[10px]" onClick={() => handleSendSingleOrder(idx)} disabled={isSending}>
                          {isSending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3 mr-1" />} Send
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}

            {pendingOrders.length > 0 && (
              <div className="fixed bottom-24 right-4 z-40">
                <button onClick={handleSendAllOrders} disabled={isSending} className="flex items-center justify-center w-[52px] h-[52px] bg-text-main text-white rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:bg-black transition-transform active:scale-95 disabled:opacity-70">
                  {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 ml-0.5" />}
                </button>
              </div>
            )}
          </div>
        ) : activeTab === 'dashboard' ? (
          <>
            <div className="mb-4">
              <div className="bg-gradient-to-br from-sidebar to-[#1e293b] rounded-[20px] p-4 shadow-lg relative overflow-hidden text-white">
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary blur-2xl opacity-20 rounded-full"></div>
                <div className="absolute bottom-0 left-0 w-20 h-20 bg-secondary-blue blur-2xl opacity-20 rounded-full"></div>
                <div className="relative z-10">
                  <p className="text-white/70 font-medium text-[11px] mb-0.5">Total Revenue</p>
                  <h2 className="text-2xl font-bold tracking-tight">$45,231.89</h2>
                  <div className="mt-1.5 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-success/20 text-success text-[10px] font-bold">
                    <BarChart3 className="w-3 h-3" />
                    +12.5% vs last week
                  </div>
                </div>
              </div>
            </div>

            <ActionGrid actions={DASHBOARD_ACTIONS} />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-text-muted">
            <p className="font-medium text-sm">Under Construction</p>
            <p className="text-[11px] mt-1">Check back later</p>
          </div>
        )}
        
        <div className="h-6"></div>
      </main>

      <MobileBottomNav 
        activeTab={activeTab}
        onTabChange={handleTabChange}
        pendingCount={pendingOrders.length}
      />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.type === 'all' ? 'Send All Orders' : 'Send Order'}
        message={
          confirmModal.type === 'all' 
            ? `Are you sure you want to send all ${pendingOrders.length} orders?` 
            : confirmModal.index !== null && pendingOrders[confirmModal.index]
              ? `Are you sure you want to send the order for ${pendingOrders[confirmModal.index].xcusname} (${pendingOrders[confirmModal.index].xcus})?` 
              : 'Are you sure you want to send this order?'
        }
        onCancel={() => setConfirmModal({isOpen: false, type: 'all', index: null})}
        onConfirm={confirmModal.type === 'all' ? executeSendAllOrders : executeSendSingleOrder}
        isProcessing={isSending}
      />

      <Toast error={errorToast} success={successToast} />
    </div>
  );
}