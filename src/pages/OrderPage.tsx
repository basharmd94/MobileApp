import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Plus, Send } from 'lucide-react';
import { Customer } from '../api_customers';
import { Item } from '../api_items';
import { Card, Button, CustomerSearch, ItemSearch } from '../components';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { OrderPayload } from '../types/order';
import Header from '../components/ui/Header';
import BusinessTabs from '../components/BusinessTabs';
import OrderCard from '../components/OrderCard';

/**
 * Configuration for each business entity.
 */
interface OrderPageConfig {
  zid: string;
  title: string;
  storageKey: string;
}

const BUSINESS_CONFIG: Record<string, OrderPageConfig> = {
  '100001': { zid: '100001', title: 'HMBR Order',  storageKey: 'hmbr_carts' },
  '100000': { zid: '100000', title: 'GI Order',    storageKey: 'gi_carts' },
  '100005': { zid: '100005', title: 'Zepto Order', storageKey: 'zepto_carts' },
};

/**
 * Unified order page with business tabs.
 * Shows ALL cart orders for the active business tab, grouped by customer.
 */
export default function OrderPage() {
  const navigate = useNavigate();
  const { employeeId } = useCurrentUser();

  // Active business tab
  const [activeTab, setActiveTab] = useState<string>('100001');
  const config = BUSINESS_CONFIG[activeTab];
  const { zid, title, storageKey } = config;

  // Form state
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [quantity, setQuantity] = useState<number | ''>('');
  const quantityInputRef = useRef<HTMLInputElement>(null);

  // Cart state — { [customerCode]: OrderPayload }
  const [carts, setCarts] = useState<{ [xcus: string]: OrderPayload }>(() => {
    const saved = localStorage.getItem(storageKey);
    return saved ? JSON.parse(saved) : {};
  });

  // When switching tabs: save current cart, load new tab's cart, reset form
  const handleTabChange = (tabId: string) => {
    localStorage.setItem(storageKey, JSON.stringify(carts));
    setActiveTab(tabId);
    setCustomer(null);
    setSelectedItem(null);
    setQuantity('');
    const newConfig = BUSINESS_CONFIG[tabId];
    const saved = localStorage.getItem(newConfig.storageKey);
    setCarts(saved ? JSON.parse(saved) : {});
  };

  // Auto-focus quantity input when item is selected
  useEffect(() => {
    if (selectedItem && quantityInputRef.current) {
      quantityInputRef.current.focus();
    }
  }, [selectedItem]);

  // Persist cart to localStorage on changes (skip initial mount)
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    localStorage.setItem(storageKey, JSON.stringify(carts));
  }, [carts, storageKey]);

  // ─── Computed: all orders across all customers for this business ───
  const allOrders = useMemo(() => Object.entries(carts), [carts]);
  const totalItemCount = useMemo(
    () => allOrders.reduce((sum, [, order]) => sum + order.items.length, 0),
    [allOrders]
  );
  const grandTotal = useMemo(
    () => allOrders.reduce((sum, [, order]) => 
      sum + order.items.reduce((s, item) => s + item.xlinetotal, 0), 0),
    [allOrders]
  );

  // ─── Cart Actions ───
  const handleAddToCart = () => {
    if (!customer || !selectedItem || !quantity || Number(quantity) < 1) return;
    const qtyNum = Number(quantity);

    setCarts(prev => {
      const customerCode = customer.xcus;
      const existingOrder = prev[customerCode];
      let newItems = existingOrder ? [...existingOrder.items] : [];
      const existingItemIndex = newItems.findIndex(i => i.xitem === selectedItem.item_id);

      if (existingItemIndex >= 0) {
        newItems[existingItemIndex] = {
          ...newItems[existingItemIndex],
          xqty: newItems[existingItemIndex].xqty + qtyNum,
          xlinetotal: (newItems[existingItemIndex].xqty + qtyNum) * newItems[existingItemIndex].xprice
        };
      } else {
        newItems.push({
          xdate: new Date().toISOString().split('T')[0],
          xdesc: selectedItem.item_name,
          xitem: selectedItem.item_id,
          xlat: 0,
          xlinetotal: qtyNum * selectedItem.std_price,
          xlong: 0,
          xprice: selectedItem.std_price,
          xqty: qtyNum,
          xroword: newItems.length + 1,
          xsl: Math.random().toString(36).substring(2, 9)
        });
      }

      return {
        ...prev,
        [customerCode]: {
          items: newItems,
          xcus: customer.xcus,
          xcusadd: customer.xadd1 || "",
          xcusname: customer.xorg,
          zid: Number(zid)
        }
      };
    });

    setSelectedItem(null);
    setQuantity('');
  };

  const handleUpdateQuantity = (customerCode: string, itemCode: string, delta: number) => {
    setCarts(prev => {
      const order = prev[customerCode];
      if (!order) return prev;
      const newItems = order.items.map(i => {
        if (i.xitem === itemCode) {
          const newQty = Math.max(1, i.xqty + delta);
          return { ...i, xqty: newQty, xlinetotal: newQty * i.xprice };
        }
        return i;
      });
      return { ...prev, [customerCode]: { ...order, items: newItems } };
    });
  };

  const handleRemoveFromCart = (customerCode: string, itemCode: string) => {
    setCarts(prev => {
      const order = prev[customerCode];
      if (!order) return prev;
      const newItems = order.items.filter(i => i.xitem !== itemCode);
      if (newItems.length === 0) {
        const newCarts = { ...prev };
        delete newCarts[customerCode];
        return newCarts;
      }
      return { ...prev, [customerCode]: { ...order, items: newItems } };
    });
  };

  const handleRemoveCustomerOrder = (customerCode: string) => {
    setCarts(prev => {
      const newCarts = { ...prev };
      delete newCarts[customerCode];
      return newCarts;
    });
  };

  // Place order for a specific customer
  const handlePlaceOrder = (customerCode: string) => {
    const orderData = carts[customerCode];
    if (!orderData || orderData.items.length === 0) return;

    const savedPending = localStorage.getItem('hmbr_pending_orders');
    let pendingData = savedPending ? JSON.parse(savedPending) : { orders: [] };
    if (!pendingData.orders) pendingData.orders = [];

    pendingData.orders.push(orderData);
    localStorage.setItem('hmbr_pending_orders', JSON.stringify(pendingData));

    // Remove this customer's order from cart
    setCarts(prev => {
      const newCarts = { ...prev };
      delete newCarts[customerCode];
      return newCarts;
    });
  };

  // Place ALL orders for this business tab
  const handlePlaceAllOrders = () => {
    if (allOrders.length === 0) return;

    const savedPending = localStorage.getItem('hmbr_pending_orders');
    let pendingData = savedPending ? JSON.parse(savedPending) : { orders: [] };
    if (!pendingData.orders) pendingData.orders = [];

    allOrders.forEach(([, orderData]) => {
      pendingData.orders.push(orderData);
    });
    localStorage.setItem('hmbr_pending_orders', JSON.stringify(pendingData));

    // Clear all carts for this business
    setCarts({});
    setCustomer(null);
    setSelectedItem(null);
    setQuantity('');

    navigate('/');
  };

  return (
    <div className="h-[100dvh] bg-bg-base flex flex-col relative max-w-md mx-auto shadow-2xl overflow-hidden md:max-w-full">
      <Header title={title} bgColor="bg-bg-card">
        <div className="mt-3">
          <BusinessTabs activeTab={activeTab} onChange={handleTabChange} />
        </div>
      </Header>

      <main className="flex-1 p-3 overflow-hidden flex flex-col min-h-0">
        <div className="space-y-3 max-w-3xl mx-auto w-full flex-1 flex flex-col min-h-0">

          {/* ─── Customer & Item Search ─── */}
          <section key={`cust-section-${activeTab}`} className="space-y-1.5 shrink-0">
            <label className="block text-[10px] font-semibold text-text-main ml-1">Customer Search</label>
            <CustomerSearch
              zid={zid}
              employeeId={employeeId}
              value={customer}
              onChange={setCustomer}
              placeholder="Search by ID, Name or Area"
            />
          </section>

          <section className="space-y-1.5 mt-3 shrink-0">
            <label className="block text-[10px] font-semibold text-text-main ml-1">Item Search</label>
            <div className="flex flex-col gap-2">
              <div key={`item-wrap-${activeTab}`} className="w-full">
                <ItemSearch
                  zid={zid}
                  value={selectedItem}
                  onChange={setSelectedItem}
                  placeholder="Search item..."
                  disabled={!customer}
                />
              </div>
              <div className="flex gap-2">
                <div className="w-24">
                  <input
                    ref={quantityInputRef}
                    type="number"
                    min="1"
                    placeholder="Qty"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value ? Number(e.target.value) : '')}
                    disabled={!selectedItem}
                    className="appearance-none block w-full px-2 py-2 border border-ui-border rounded-lg text-text-main text-center focus:outline-none focus:ring-2 focus:ring-primary/40 text-[11px] disabled:opacity-50 disabled:bg-gray-50 h-[34px]"
                  />
                </div>
                <div className="flex-1">
                  <Button
                    variant="primary"
                    className="w-full py-2 h-[34px] text-[11px]"
                    onClick={handleAddToCart}
                    disabled={!selectedItem || !quantity || Number(quantity) < 1}
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add to Cart
                  </Button>
                </div>
              </div>
            </div>
          </section>

          {/* ─── Cart: All Orders Grouped by Customer ─── */}
          <div className="border-t border-ui-border/50 pt-3 mt-4 flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-2 shrink-0">
              <h3 className="text-[11px] font-bold text-text-main">Cart Orders</h3>
              {allOrders.length > 0 && (
                <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  {allOrders.length} customer{allOrders.length !== 1 ? 's' : ''} • {totalItemCount} items
                </span>
              )}
            </div>

            {allOrders.length > 0 ? (
              <div className="flex-1 overflow-y-auto space-y-3 pb-2 pr-1">
                {allOrders.map(([customerCode, order]) => (
                  <div key={customerCode}>
                    <OrderCard
                      customerName={order.xcusname}
                      customerCode={customerCode}
                      items={order.items}
                      onPrimaryAction={() => handlePlaceOrder(customerCode)}
                      primaryActionLabel="Place Order"
                      onRemoveAll={() => handleRemoveCustomerOrder(customerCode)}
                      onUpdateQuantity={(itemCode, delta) => handleUpdateQuantity(customerCode, itemCode, delta)}
                      onRemoveItem={(itemCode) => handleRemoveFromCart(customerCode, itemCode)}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <Card className="opacity-60 bg-gray-50 border-dashed border-2 !shadow-none !p-2 shrink-0">
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <Package className="w-6 h-6 text-gray-300 mb-1.5" />
                  <p className="text-[11px] font-semibold text-text-secondary">Cart is Empty</p>
                  <p className="text-[9px] text-text-muted mt-0.5">Select a customer and add items</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </main>

      {/* ─── Footer: Place All Orders ─── */}
      {allOrders.length > 0 && (
        <div className="p-3 md:p-4 bg-white border-t border-ui-border/50 shadow-[0_-4px_24px_rgb(0,0,0,0.04)] z-10 shrink-0">
          <div className="max-w-3xl mx-auto flex items-center gap-3">
            <div className="flex-1">
              <p className="text-[10px] text-text-muted font-medium mb-0.5">
                {allOrders.length} order{allOrders.length !== 1 ? 's' : ''} • {totalItemCount} items
              </p>
              <p className="text-[14px] font-bold text-primary">৳{grandTotal.toLocaleString()}</p>
            </div>
            <Button
              className="flex-[2] shadow-lg shadow-primary/20"
              size="md"
              onClick={handlePlaceAllOrders}
            >
              <Send className="w-3.5 h-3.5 mr-1" />
              Place All Orders
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
