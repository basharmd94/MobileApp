import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Send, CheckCircle2, Package } from 'lucide-react';
import { BarChart3 } from 'lucide-react';
import { Button, ConfirmModal } from '../components';
import { DASHBOARD_ACTIONS } from '../components/dashboard/dashboard-actions';
import ActionGrid from '../components/dashboard/ActionGrid';
import MobileBottomNav from '../components/navigation/MobileBottomNav';
import MobileTopBar from '../components/navigation/MobileTopBar';
import Toast from '../components/ui/Toast';
import FullPageLoader from '../components/FullPageLoader';
import OrderCard from '../components/OrderCard';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { usePendingOrders } from '../hooks/usePendingOrders';

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

  // Computed totals
  const totalItemCount = useMemo(
    () => pendingOrders.reduce((sum, order) => sum + (order.items?.length || 0), 0),
    [pendingOrders]
  );
  const grandTotal = useMemo(
    () => pendingOrders.reduce((sum, order) =>
      sum + (order.items?.reduce((s: number, item: any) => s + item.xlinetotal, 0) || 0), 0),
    [pendingOrders]
  );

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
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[16px] font-bold text-text-main">Pending Orders</h2>
              {pendingOrders.length > 0 && (
                <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  {pendingOrders.length} order{pendingOrders.length !== 1 ? 's' : ''} • {totalItemCount} items
                </span>
              )}
            </div>

            {pendingOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-8 h-8 text-success/60" />
                </div>
                <p className="text-[14px] font-bold text-text-main">All Caught Up</p>
                <p className="text-[11px] text-text-muted mt-1 max-w-[200px]">No pending orders to send. Add items from the order page.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingOrders.map((order, idx) => (
                  <div key={idx}>
                    <OrderCard
                      customerName={order.xcusname}
                      customerCode={order.xcus}
                      zid={order.zid}
                      items={order.items || []}
                      onPrimaryAction={() => handleSendSingleOrder(idx)}
                      primaryActionLabel="Send Order"
                      onRemoveAll={() => {
                        for (let i = order.items.length - 1; i >= 0; i--) {
                          removeItem(idx, i);
                        }
                      }}
                      onUpdateQuantity={(itemCode, delta) => {
                        const itemIndex = order.items.findIndex((i: any) => i.xitem === itemCode);
                        if (itemIndex >= 0) updateQuantity(idx, itemIndex, delta);
                      }}
                      onRemoveItem={(itemCode) => {
                        const itemIndex = order.items.findIndex((i: any) => i.xitem === itemCode);
                        if (itemIndex >= 0) removeItem(idx, itemIndex);
                      }}
                      disabled={isSending}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Send All FAB + Footer */}
            {pendingOrders.length > 0 && (
              <div className="mt-4 p-3 bg-white border border-ui-border/50 rounded-[14px] shadow-[0_-2px_12px_rgb(0,0,0,0.03)]">
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <p className="text-[10px] text-text-muted font-medium mb-0.5">
                      {pendingOrders.length} order{pendingOrders.length !== 1 ? 's' : ''} • {totalItemCount} items
                    </p>
                    <p className="text-[14px] font-bold text-primary">৳{grandTotal.toLocaleString()}</p>
                  </div>
                  <Button
                    className="flex-[2] shadow-lg shadow-primary/20"
                    size="md"
                    onClick={handleSendAllOrders}
                    disabled={isSending}
                    isLoading={isSending}
                  >
                    <Send className="w-3.5 h-3.5 mr-1" />
                    Send All Orders
                  </Button>
                </div>
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