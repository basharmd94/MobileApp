import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, logout } from '../api_users';
import { Loader2, LogOut, User, LayoutDashboard, ShoppingCart, BarChart3, Bell, Search, Plus, Send, CheckCircle2, Minus, Trash2, X } from 'lucide-react';
import { Card, IconBox, Button, ConfirmModal } from '../components';
import { sendBulkOrders } from '../api_send_orders';

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const navigate = useNavigate();

  // For pending orders state
  const [pendingOrders, setPendingOrders] = useState<any[]>([]);
  const [isSending, setIsSending] = useState(false);
  
  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{isOpen: boolean, type: 'single' | 'all', index: number | null}>({isOpen: false, type: 'all', index: null});
  const [errorToast, setErrorToast] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const getBusinessName = (zid: number | string) => {
    const map: Record<string, string> = {
      '100000': 'GI',
      '100001': 'HMBR',
      '100005': 'Zepto',
    };
    return map[String(zid)] || 'Unknown';
  };

  const getBusinessBadgeColor = (zid: number | string) => {
    switch (String(zid)) {
      case '100000': return 'text-emerald-800 bg-emerald-100/80 border-emerald-200';
      case '100001': return 'text-blue-800 bg-blue-100/80 border-blue-200';
      case '100005': return 'text-purple-800 bg-purple-100/80 border-purple-200';
      default: return 'text-orange-800 bg-orange-100/80 border-orange-200';
    }
  };

  const getCurrentLocation = (): Promise<{lat: number, lng: number}> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve({ lat: 0, lng: 0 });
      } else {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              lat: position.coords.latitude,
              lng: position.coords.longitude
            });
          },
          (error) => {
            console.warn("Geolocation error, falling back to 0,0:", error);
            resolve({ lat: 0, lng: 0 });
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      }
    });
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await getCurrentUser();
        setUser(userData);
      } catch (error) {
        console.error('Failed to fetch user:', error);
        // If error is due to auth, API interceptor handles redirect
      } finally {
        setInitialLoading(false);
      }
    };

    fetchUser();
  }, []);

  // Fetch pending orders on mount and when tab changes
  useEffect(() => {
    const savedOrders = localStorage.getItem('hmbr_pending_orders');
    if (savedOrders) {
      const parsed = JSON.parse(savedOrders);
      setPendingOrders(parsed.orders || []);
    } else {
      setPendingOrders([]);
    }
  }, [activeTab]);

  const handleUpdatePendingItemQuantity = (orderIndex: number, itemIndex: number, delta: number) => {
    const newOrders = [...pendingOrders];
    const order = { ...newOrders[orderIndex] };
    const items = [...order.items];
    const item = { ...items[itemIndex] };
    
    const newQty = Math.max(1, item.xqty + delta);
    item.xqty = newQty;
    item.xlinetotal = newQty * item.xprice;
    
    items[itemIndex] = item;
    order.items = items;
    newOrders[orderIndex] = order;
    
    setPendingOrders(newOrders);
    localStorage.setItem('hmbr_pending_orders', JSON.stringify({ orders: newOrders }));
  };

  const handleRemovePendingItem = (orderIndex: number, itemIndex: number) => {
    const newOrders = [...pendingOrders];
    let order = { ...newOrders[orderIndex] };
    let items = [...order.items];
    
    items.splice(itemIndex, 1);
    
    if (items.length === 0) {
      newOrders.splice(orderIndex, 1);
    } else {
      order.items = items;
      newOrders[orderIndex] = order;
    }
    
    setPendingOrders(newOrders);
    localStorage.setItem('hmbr_pending_orders', JSON.stringify({ orders: newOrders }));
  };

  const handleSendSingleOrder = (index: number) => {
    setConfirmModal({isOpen: true, type: 'single', index});
  };

  const executeSendSingleOrder = async () => {
    if (confirmModal.index === null) return;
    setIsSending(true);
    setConfirmModal({...confirmModal, isOpen: false});
    
    try {
      const loc = await getCurrentLocation();
      const orderToSend = JSON.parse(JSON.stringify(pendingOrders[confirmModal.index]));
      
      orderToSend.items = orderToSend.items.map((item: any) => ({
        ...item,
        xlat: Number(loc.lat.toFixed(6)),
        xlong: Number(loc.lng.toFixed(6))
      }));

      const response = await sendBulkOrders([orderToSend]);
      
      const newOrders = [...pendingOrders];
      newOrders.splice(confirmModal.index, 1);
      
      setPendingOrders(newOrders);
      localStorage.setItem('hmbr_pending_orders', JSON.stringify({ orders: newOrders }));
      
      const responseList = Array.isArray(response) ? response : (response?.data ? (Array.isArray(response.data) ? response.data : [response.data]) : [response]);
      const invoices = responseList.map((r: any) => r?.invoiceno).filter(Boolean).join(', ');
      setSuccessToast(`Order sent successfully! Invoice: ${invoices || 'N/A'}`);
      setTimeout(() => setSuccessToast(null), 4000);
      
      if (newOrders.length === 0) {
        setActiveTab('dashboard');
      }
    } catch (err: any) {
      setErrorToast(err.message || 'Failed to send order');
      setTimeout(() => setErrorToast(null), 3000);
    } finally {
      setIsSending(false);
    }
  };

  const handleSendAllOrders = () => {
    if (pendingOrders.length === 0) return;
    setConfirmModal({isOpen: true, type: 'all', index: null});
  };
  
  const executeSendAllOrders = async () => {
    setIsSending(true);
    setConfirmModal({...confirmModal, isOpen: false});
    
    try {
      const loc = await getCurrentLocation();
      const ordersToSend = pendingOrders.map(order => ({
        ...order,
        items: order.items.map((item: any) => ({
          ...item,
          xlat: Number(loc.lat.toFixed(6)),
          xlong: Number(loc.lng.toFixed(6))
        }))
      }));

      const response = await sendBulkOrders(ordersToSend);
      
      setPendingOrders([]);
      localStorage.setItem('hmbr_pending_orders', JSON.stringify({ orders: [] }));
      
      const responseList = Array.isArray(response) ? response : (response?.data ? (Array.isArray(response.data) ? response.data : [response.data]) : [response]);
      const invoices = responseList.map((r: any) => r?.invoiceno).filter(Boolean).join(', ');
      setSuccessToast(`Orders sent successfully! Invoices: ${invoices || 'N/A'}`);
      setTimeout(() => setSuccessToast(null), 4000);
      
      setActiveTab('dashboard');
    } catch (err: any) {
      setErrorToast(err.message || 'Failed to send orders');
      setTimeout(() => setErrorToast(null), 3000);
    } finally {
      setIsSending(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      navigate('/login'); // Force redirect even if server fails
    }
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-base">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-bg-base flex flex-col pb-16 md:pb-0 md:flex-row relative max-w-md mx-auto shadow-2xl overflow-hidden md:max-w-full">
      {/* Mobile Top App Bar */}
      <header className="md:hidden flex items-center justify-between px-4 pt-8 pb-3 bg-bg-card shadow-[0_2px_10px_rgb(0,0,0,0.02)] z-10 rounded-b-2xl">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <User className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Good Morning</p>
            <h1 className="text-[13px] font-bold text-text-main leading-tight truncate max-w-[120px]">{user?.username || 'User'}</h1>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="w-8 h-8 flex items-center justify-center rounded-full bg-bg-base text-text-secondary relative">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-error rounded-full outline outline-[1.5px] outline-bg-base"></span>
          </button>
          <button onClick={handleLogout} className="w-8 h-8 flex items-center justify-center rounded-full bg-error/10 text-error">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Desktop Sidebar (hidden on mobile) */}
      <aside className="w-64 bg-sidebar text-white hidden md:flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-ui-border/10 mt-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center font-bold text-base shadow-lg shadow-primary/20">
              P
            </div>
            <span className="text-lg font-bold tracking-tight">App OS</span>
          </div>
        </div>
        <div className="p-4 flex-1 overflow-y-auto">
          <ul className="space-y-1">
            {[
              { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
              { id: 'sales', icon: ShoppingCart, label: 'Sales' },
              { id: 'send_orders', icon: Send, label: 'Send Orders' },
              { id: 'profile', icon: User, label: 'Profile' }
            ].map((item) => (
              <li key={item.id}>
                <button 
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    activeTab === item.id 
                      ? 'bg-primary text-white shadow-md shadow-primary/20' 
                      : 'text-text-muted hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </div>
                  {item.id === 'send_orders' && pendingOrders.length > 0 && (
                    <span className={`text-[10px] font-bold px-1.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full ${
                      activeTab === item.id ? 'bg-white text-primary' : 'bg-red-500 text-white'
                    }`}>
                      {pendingOrders.length}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="p-4 border-t border-ui-border/10">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-text-muted hover:bg-error/10 hover:text-error text-sm font-medium transition-all duration-200">
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 max-w-full">
        {/* Desktop Top Navbar */}
        <header className="h-16 bg-bg-base border-b border-ui-border hidden md:flex items-center justify-between px-6">
          <div className="flex items-center w-72 relative">
            <Search className="w-4 h-4 absolute left-3 text-text-muted" />
            <input 
              type="text" 
              placeholder="Search anything..." 
              className="w-full bg-white border border-ui-border rounded-lg pl-9 pr-3 py-2 text-sm text-text-main focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary placeholder-text-muted transition-all"
            />
          </div>
          <div className="flex items-center gap-5">
            <button className="relative text-text-secondary hover:text-text-main transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-0 right-0 w-2 h-2 bg-error rounded-full border-2 border-bg-base"></span>
            </button>
            <div className="flex items-center gap-3 border-l border-ui-border pl-5">
              <div className="text-right">
                <p className="text-xs font-bold text-text-main">{user?.username}</p>
                <p className="text-[10px] text-text-muted">Admin</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold">
                 {user?.username?.charAt(0).toUpperCase() || 'U'}
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 p-4 overflow-y-auto">
          {activeTab === 'profile' ? (
            <div className="max-w-3xl mx-auto space-y-3 pb-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-[16px] font-bold text-text-main">User Profile</h2>
              </div>
              
              <Card className="!p-4 !rounded-[16px] relative overflow-hidden mb-3">
                 <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-8 -mt-8 blur-2xl"></div>
                 <div className="flex items-center gap-3 relative z-10">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center text-white text-[20px] font-bold shadow-md shadow-primary/20">
                      {user?.username?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div>
                      <h3 className="text-[15px] font-bold text-text-main leading-tight mb-0.5">{user?.username || 'User'}</h3>
                      <p className="text-[11px] text-text-muted">{user?.email || 'No email provided'}</p>
                      <div className="mt-1.5 flex items-center">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-success/10 border border-success/20 text-[9px] font-bold text-success uppercase tracking-wider">
                           <div className="w-1.5 h-1.5 rounded-full bg-success mr-1"></div>
                           {user?.status || 'Active'}
                        </span>
                      </div>
                    </div>
                 </div>
              </Card>

              <div className="space-y-3">
                 <Card className="!p-3 !rounded-[16px]">
                    <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">Contact Info</h4>
                    <div className="space-y-1.5">
                       <div className="flex justify-between items-center bg-bg-base hover:bg-gray-50 transition-colors p-2.5 rounded-[12px] border border-ui-border/50">
                         <span className="text-[11px] text-text-muted font-medium">Mobile</span>
                         <span className="text-[12px] font-semibold text-text-main">{user?.mobile || 'N/A'}</span>
                       </div>
                       <div className="flex justify-between items-center bg-bg-base hover:bg-gray-50 transition-colors p-2.5 rounded-[12px] border border-ui-border/50">
                         <span className="text-[11px] text-text-muted font-medium">Email</span>
                         <span className="text-[12px] font-semibold text-text-main">{user?.email || 'N/A'}</span>
                       </div>
                    </div>
                 </Card>
                 
                 <Card className="!p-3 !rounded-[16px]">
                    <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">Account Details</h4>
                    <div className="grid grid-cols-2 gap-1.5">
                       <div className="bg-bg-base hover:bg-gray-50 transition-colors p-2.5 rounded-[12px] border border-ui-border/50">
                         <p className="text-[9px] text-text-muted font-medium mb-0.5">User ID</p>
                         <p className="text-[11px] font-semibold text-primary truncate">{user?.user_id || 'N/A'}</p>
                       </div>
                       <div className="bg-bg-base hover:bg-gray-50 transition-colors p-2.5 rounded-[12px] border border-ui-border/50">
                         <p className="text-[9px] text-text-muted font-medium mb-0.5">Role</p>
                         <p className="text-[11px] font-semibold capitalize text-text-main truncate">{user?.is_admin || 'N/A'}</p>
                       </div>
                       <div className="bg-bg-base hover:bg-gray-50 transition-colors p-2.5 rounded-[12px] border border-ui-border/50">
                         <p className="text-[9px] text-text-muted font-medium mb-0.5">Business ID</p>
                         <p className="text-[11px] font-semibold text-text-main truncate">{user?.businessId || 'N/A'}</p>
                       </div>
                       <div className="bg-bg-base hover:bg-gray-50 transition-colors p-2.5 rounded-[12px] border border-ui-border/50">
                         <p className="text-[9px] text-text-muted font-medium mb-0.5">Terminal</p>
                         <p className="text-[11px] font-semibold text-text-main truncate">{user?.terminal || 'N/A'}</p>
                       </div>
                    </div>
                 </Card>
              </div>
              
              <div className="mt-4 md:hidden pb-12">
                 <button onClick={handleLogout} className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-[12px] bg-error/10 text-error font-bold text-[12px] transition-colors hover:bg-error/20 active:scale-[0.98]">
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out
                 </button>
              </div>
            </div>
          ) : activeTab === 'send_orders' ? (
            <div className="max-w-3xl mx-auto pb-20 relative min-h-full">
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
                      <Card key={idx} className="!p-3 sm:!p-4 !rounded-[12px] bg-orange-100/80 border-orange-200 shadow-sm transition-all hover:shadow-md">
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
                           <div className="text-right shrink-0 mt-0.5">
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
                                  <span className="text-[11px] font-bold text-text-main shrink-0">
                                    ৳{item.xlinetotal.toLocaleString()}
                                  </span>
                                  <div className="flex items-center gap-1.5">
                                     <div className="flex items-center border border-ui-border rounded-lg overflow-hidden">
                                        <button 
                                          onClick={() => handleUpdatePendingItemQuantity(idx, iIdx, -1)}
                                          className="w-7 h-7 flex items-center justify-center bg-gray-50 hover:bg-gray-200 text-text-main transition-colors active:bg-gray-300"
                                        >
                                          <Minus className="w-3.5 h-3.5" />
                                        </button>
                                        <span className="w-7 text-center text-[11px] font-bold text-text-main">
                                          {item.xqty}
                                        </span>
                                        <button 
                                          onClick={() => handleUpdatePendingItemQuantity(idx, iIdx, 1)}
                                          className="w-7 h-7 flex items-center justify-center bg-gray-50 hover:bg-gray-200 text-text-main transition-colors active:bg-gray-300"
                                        >
                                          <Plus className="w-3.5 h-3.5" />
                                        </button>
                                     </div>
                                     <button
                                       onClick={() => handleRemovePendingItem(idx, iIdx)}
                                       className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors ml-1 active:bg-red-200"
                                     >
                                       <Trash2 className="w-3.5 h-3.5" />
                                     </button>
                                  </div>
                                </div>
                             </div>
                           ))}
                         </div>
                         <div className="flex items-center justify-between pt-1.5 border-t border-ui-border/50">
                            <p className="text-[10px] text-text-secondary font-medium">
                              {order.items.length} items
                            </p>
                            <Button
                              variant="primary"
                              size="sm"
                              className="!h-7 !px-3 !rounded-md text-[10px]"
                              onClick={() => handleSendSingleOrder(idx)}
                              disabled={isSending}
                            >
                               {isSending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3 mr-1" />} Send
                            </Button>
                         </div>
                      </Card>
                    );
                  })}
                </div>
              )}

              {/* Floating Action Button for Send All */}
              {pendingOrders.length > 0 && (
                <div className="fixed bottom-24 right-4 md:right-8 z-40">
                  <button 
                    onClick={handleSendAllOrders}
                    disabled={isSending}
                    className="flex items-center justify-center w-[52px] h-[52px] bg-text-main text-white rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] shadow-text-main/30 hover:bg-black transition-transform active:scale-95 disabled:opacity-70 disabled:active:scale-100"
                  >
                    {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 ml-0.5" />}
                  </button>
                </div>
              )}
            </div>
          ) : activeTab === 'dashboard' ? (
            <>
              {/* Quick Actions / Balance Card Mobile */}
              <div className="mb-4 md:mb-5">
                <div className="bg-gradient-to-br from-sidebar to-[#1e293b] rounded-[20px] p-4 md:p-5 shadow-lg relative overflow-hidden text-white">
                   {/* Decorative glow */}
                   <div className="absolute top-0 right-0 w-24 h-24 bg-primary blur-2xl opacity-20 rounded-full"></div>
                   <div className="absolute bottom-0 left-0 w-20 h-20 bg-secondary-blue blur-2xl opacity-20 rounded-full"></div>
                   
                   <div className="relative z-10 flex justify-between items-start">
                      <div>
                        <p className="text-white/70 font-medium text-[11px] mb-0.5">Total Revenue</p>
                        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">$45,231.89</h2>
                        <div className="mt-1.5 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-success/20 text-success text-[10px] font-bold">
                          <BarChart3 className="w-3 h-3" />
                          +12.5% vs last week
                        </div>
                      </div>
                   </div>
                </div>
              </div>

              <div className="flex items-center justify-between mb-3 mt-1">
                <h3 className="text-sm font-bold text-text-main">Overview</h3>
                <button className="text-[11px] font-bold text-primary">View All</button>
              </div>

              {/* KPI Cards Mobile Style */}
              <div className="grid grid-cols-2 gap-2.5 mb-5">
                <Card className="!p-3">
                  <IconBox icon={ShoppingCart} variant="primary" size="sm" className="mb-2" />
                  <p className="text-[11px] font-semibold text-text-muted mb-0.5">Orders</p>
                  <p className="text-[15px] font-bold text-text-main">1,248</p>
                </Card>
                
                <Card className="!p-3">
                  <IconBox icon={User} variant="secondary-blue" size="sm" className="mb-2" />
                  <p className="text-[11px] font-semibold text-text-muted mb-0.5">Customers</p>
                  <p className="text-[15px] font-bold text-text-main">4,592</p>
                </Card>

                 <Card className="!p-3">
                  <IconBox icon={BarChart3} variant="secondary-teal" size="sm" className="mb-2" />
                  <p className="text-[11px] font-semibold text-text-muted mb-0.5">Conversion</p>
                  <p className="text-[15px] font-bold text-text-main">3.2%</p>
                </Card>

                <Card 
                   activeScale
                   onClick={() => navigate('/add')}
                   className="flex flex-col justify-center items-center !p-3">
                   <div className="w-8 h-8 rounded-full border-2 border-dashed border-primary/40 flex items-center justify-center mb-1 text-primary">
                     <Plus className="w-4 h-4" />
                   </div>
                   <p className="text-[11px] font-bold text-primary">Add Row</p>
                </Card>
              </div>

              <div className="flex items-center justify-between mb-3 mt-4">
                <h3 className="text-sm font-bold text-text-main">Recent Activity</h3>
              </div>

              <Card className="!p-3 !rounded-xl mb-4">
                  {[1, 2, 3].map((_, i) => (
                    <div key={i} className={`flex items-center gap-2.5 ${i !== 2 ? 'border-b border-ui-border/50 pb-2.5 mb-2.5' : ''}`}>
                       <div className="w-8 h-8 rounded-lg bg-bg-base flex items-center justify-center shrink-0">
                          <div className="w-1.5 h-1.5 rounded-full bg-success"></div>
                       </div>
                       <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-bold text-text-main truncate">Order #INV-459{i}</p>
                          <p className="text-[9px] text-text-muted font-medium mt-0.5 truncate">Completed</p>
                       </div>
                       <div className="text-right shrink-0">
                          <p className="text-[11px] font-bold text-primary">+$124.50</p>
                          <p className="text-[9px] text-text-muted font-medium mt-0.5">2m ago</p>
                       </div>
                    </div>
                  ))}
              </Card>
            </>
          ) : (
             <div className="flex flex-col items-center justify-center h-full text-text-muted">
                <p className="font-medium text-sm">Under Construction</p>
                <p className="text-[11px] mt-1">Check back later</p>
             </div>
          )}
          
          {/* Bottom spacing for mobile nav */}
          <div className="h-6 md:hidden"></div>
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-ui-border/50 flex justify-around items-center h-16 pb-[env(safe-area-inset-bottom,8px)] px-2 z-50 md:hidden shadow-[0_-4px_24px_rgb(0,0,0,0.04)] rounded-t-[16px] max-w-md mx-auto">
        {[
          { id: 'dashboard', icon: LayoutDashboard, label: 'Home' },
          { id: 'sales', icon: ShoppingCart, label: 'Sales' },
          { id: 'add', icon: Plus, label: 'Add', primary: true },
          { id: 'send_orders', icon: Send, label: 'Send' },
          { id: 'profile', icon: User, label: 'Profile' }
        ].map((item) => (
          item.primary ? (
            <button 
              key={item.id}
              onClick={() => navigate('/add')}
              className="relative -top-3 w-10 h-10 bg-gradient-to-br from-primary to-primary-hover rounded-full flex items-center justify-center text-white shadow-lg shadow-primary/30 transform transition-transform active:scale-95"
            >
              <item.icon className="w-5 h-5" />
            </button>
          ) : (
            <button 
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-1 w-12 pt-1 transition-colors relative ${
                activeTab === item.id ? 'text-primary' : 'text-text-muted hover:text-text-main'
              }`}
            >
              <div className="relative">
                <item.icon className={`w-4 h-4 ${activeTab === item.id ? 'fill-primary/20' : ''}`} strokeWidth={activeTab === item.id ? 2.5 : 2} />
                {item.id === 'send_orders' && pendingOrders.length > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-red-500 text-white text-[8px] font-bold px-1 min-w-[14px] h-[14px] flex items-center justify-center rounded-full border border-white">
                    {pendingOrders.length}
                  </span>
                )}
              </div>
              <span className={`text-[9px] font-bold leading-tight ${activeTab === item.id ? 'text-primary' : 'text-text-muted'}`}>{item.label}</span>
            </button>
          )
        ))}
      </nav>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.type === 'all' ? 'Send All Orders' : 'Send Order'}
        message={
          confirmModal.type === 'all' 
            ? `Are you sure you want to send all ${pendingOrders.length} orders?` 
            : confirmModal.index !== null 
              ? `Are you sure you want to send the order for ${pendingOrders[confirmModal.index].xcusname} (${pendingOrders[confirmModal.index].xcus})?` 
              : 'Are you sure you want to send this order?'
        }
        onCancel={() => setConfirmModal({isOpen: false, type: 'all', index: null})}
        onConfirm={confirmModal.type === 'all' ? executeSendAllOrders : executeSendSingleOrder}
        isProcessing={isSending}
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
