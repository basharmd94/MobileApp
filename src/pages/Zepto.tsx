import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Package, Trash2, Plus, Minus } from 'lucide-react';
import { Customer } from '../api_customers';
import { Item } from '../api_items';
import { getCurrentUser } from '../api_users';
import { Card, Button, CustomerSearch, ItemSearch } from '../components';

interface CartItemPayload {
  xdate: string;
  xdesc: string;
  xitem: string;
  xlat: number;
  xlinetotal: number;
  xlong: number;
  xprice: number;
  xqty: number;
  xroword: number;
  xsl: string;
}

interface OrderPayload {
  items: CartItemPayload[];
  xcus: string;
  xcusadd: string;
  xcusname: string;
  zid: number;
}

export default function Zepto() {
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [employeeId, setEmployeeId] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [quantity, setQuantity] = useState<number | ''>('');
  const [itemSearchKey, setItemSearchKey] = useState<number>(0);
  const quantityInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (selectedItem && quantityInputRef.current) {
      quantityInputRef.current.focus();
    }
  }, [selectedItem]);

  const [carts, setCarts] = useState<{ [xcus: string]: OrderPayload }>(() => {
    const saved = localStorage.getItem('zepto_carts');
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await getCurrentUser();
        setEmployeeId(userData?.user_id || '');
      } catch (error) {
        console.error('Failed to fetch user:', error);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    localStorage.setItem('zepto_carts', JSON.stringify(carts));
  }, [carts]);

  // You can set the zid here directly or fetch from user auth context
  const zid = '100005';

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
    setItemSearchKey(prev => prev + 1);
  };

  const handleUpdateQuantity = (itemCode: string, delta: number) => {
    if (!customer) return;
    setCarts(prev => {
      const customerCode = customer.xcus;
      const order = prev[customerCode];
      if (!order) return prev;

      const newItems = order.items.map(i => {
        if (i.xitem === itemCode) {
          const newQty = Math.max(1, i.xqty + delta);
          return {
            ...i,
            xqty: newQty,
            xlinetotal: newQty * i.xprice
          };
        }
        return i;
      });
      
      return {
        ...prev,
        [customerCode]: {
          ...order,
          items: newItems
        }
      };
    });
  };

  const handleRemoveFromCart = (itemCode: string) => {
    if (!customer) return;
    setCarts(prev => {
      const customerCode = customer.xcus;
      const order = prev[customerCode];
      if (!order) return prev;

      const newItems = order.items.filter(i => i.xitem !== itemCode);
      
      if (newItems.length === 0) {
        const newCarts = { ...prev };
        delete newCarts[customerCode];
        return newCarts;
      }
      
      return {
        ...prev,
        [customerCode]: {
          ...order,
          items: newItems
        }
      };
    });
  };

  const currentOrder = customer ? carts[customer.xcus] : null;
  const cartItems = currentOrder?.items || [];
  const cartTotal = cartItems.reduce((sum, item) => sum + item.xlinetotal, 0);

  const handlePlaceOrder = () => {
    if (!customer || cartItems.length === 0) return;
    
    const customerCode = customer.xcus;
    const orderData = carts[customerCode];
    
    const savedPending = localStorage.getItem('hmbr_pending_orders');
    let pendingData = savedPending ? JSON.parse(savedPending) : { orders: [] };

    if (!pendingData.orders) {
      pendingData.orders = [];
    }
    
    pendingData.orders.push(orderData);
    localStorage.setItem('hmbr_pending_orders', JSON.stringify(pendingData));
    
    // Remove from cart
    setCarts(prev => {
      const newCarts = { ...prev };
      delete newCarts[customerCode];
      return newCarts;
    });
    
    // Reset selection
    setCustomer(null);
    setSelectedItem(null);
    setQuantity('');
    
    navigate('/');
  };

  return (
    <div className="h-[100dvh] bg-bg-base flex flex-col relative max-w-md mx-auto shadow-2xl overflow-hidden md:max-w-full">
      {/* App Bar */}
      <header className="flex items-center px-4 pt-8 pb-3 bg-bg-card shadow-[0_2px_10px_rgb(0,0,0,0.02)] z-10 rounded-b-2xl shrink-0">
        <button 
          onClick={() => navigate(-1)}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-bg-base text-text-secondary active:scale-95 transition-transform"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="flex-1 text-center text-[12px] font-bold text-text-main pr-8">Zepto Order</h1>
      </header>

      <main className="flex-1 p-3 overflow-hidden flex flex-col min-h-0">
        <div className="space-y-3 max-w-3xl mx-auto w-full flex-1 flex flex-col min-h-0">
          <section className="space-y-1.5 shrink-0">
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
              <div className="w-full">
                <ItemSearch 
                  key={`item-search-${itemSearchKey}`}
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

          <div className="border-t border-ui-border/50 pt-3 mt-4 flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-2 shrink-0">
              <h3 className="text-[11px] font-bold text-text-main">Cart Items</h3>
              {cartItems.length > 0 && (
                 <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                    {cartItems.length} items
                 </span>
              )}
            </div>
            
            {cartItems.length > 0 ? (
               <div className="flex-1 overflow-y-auto space-y-2 pb-2 pr-1">
                  {cartItems.map((item, idx) => (
                    <Card key={idx} className="!p-2.5 !rounded-lg border-ui-border !shadow-sm">
                       <div className="flex justify-between items-start">
                         <div className="flex-1 min-w-0 pr-2">
                           <div className="flex items-center gap-1.5 mb-0.5">
                             <span className="inline-flex px-1 py-0.5 rounded text-[8px] font-bold bg-gray-100 text-text-secondary shrink-0">
                               {item.xitem}
                             </span>
                           </div>
                           <p className="text-[11px] font-bold text-text-main leading-snug line-clamp-2">{item.xdesc}</p>
                           <p className="text-[9px] text-text-muted mt-1 font-medium">৳{item.xprice} x {item.xqty}</p>
                         </div>
                         <div className="flex flex-col items-end shrink-0 gap-2">
                           <span className="text-[11px] font-bold text-text-main">
                             ৳{item.xlinetotal.toLocaleString()}
                           </span>
                           <div className="flex items-center gap-1 mt-auto">
                              <div className="flex items-center border border-ui-border rounded overflow-hidden">
                                 <button 
                                   onClick={() => handleUpdateQuantity(item.xitem, -1)}
                                   className="w-5 h-5 flex items-center justify-center bg-gray-50 hover:bg-gray-100 text-text-main transition-colors"
                                 >
                                   <Minus className="w-3 h-3" />
                                 </button>
                                 <span className="w-5 text-center text-[9px] font-medium text-text-main">
                                   {item.xqty}
                                 </span>
                                 <button 
                                   onClick={() => handleUpdateQuantity(item.xitem, 1)}
                                   className="w-5 h-5 flex items-center justify-center bg-gray-50 hover:bg-gray-100 text-text-main transition-colors"
                                 >
                                   <Plus className="w-3 h-3" />
                                 </button>
                              </div>
                              <button
                                onClick={() => handleRemoveFromCart(item.xitem)}
                                className="w-6 h-6 flex items-center justify-center rounded bg-red-50 text-red-500 hover:bg-red-100 transition-colors ml-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                           </div>
                         </div>
                       </div>
                    </Card>
                  ))}
               </div>
            ) : (
             <Card className="opacity-60 bg-gray-50 border-dashed border-2 !shadow-none !p-2 shrink-0">
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <Package className="w-6 h-6 text-gray-300 mb-1.5" />
                  <p className="text-[11px] font-semibold text-text-secondary">Cart is Empty</p>
                  <p className="text-[9px] text-text-muted mt-0.5">Select items to begin ordering</p>
                </div>
             </Card>
            )}
          </div>
        </div>
      </main>

      <div className="p-3 md:p-4 bg-white border-t border-ui-border/50 shadow-[0_-4px_24px_rgb(0,0,0,0.04)] z-10 shrink-0">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          {cartTotal > 0 && (
             <div className="flex-1">
               <p className="text-[10px] text-text-muted font-medium mb-0.5">Total Amount</p>
               <p className="text-[14px] font-bold text-primary">৳{cartTotal.toLocaleString()}</p>
             </div>
          )}
          <Button 
             className="flex-[2] shadow-lg shadow-primary/20" 
             size="md" 
             disabled={cartItems.length === 0}
             onClick={handlePlaceOrder}
          >
            Place Order
          </Button>
        </div>
      </div>
    </div>
  );
}