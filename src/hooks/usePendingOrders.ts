import { useState, useEffect, useCallback, useRef } from 'react';
import { sendBulkOrders } from '../api_send_orders';
import { useToast } from './useToast';
import { getCurrentLocation } from '../utils/geolocation';

/**
 * Hook to manage pending offline orders.
 * Handles localStorage persistence, quantity updates, item removal,
 * and sending orders (single or bulk) with geolocation.
 */
export function usePendingOrders() {
  const [pendingOrders, setPendingOrders] = useState<any[]>(() => {
    // Initialize directly from localStorage to avoid the empty-state flash
    const savedOrders = localStorage.getItem('hmbr_pending_orders');
    if (savedOrders) {
      try {
        const parsed = JSON.parse(savedOrders);
        return parsed.orders || [];
      } catch {
        return [];
      }
    }
    return [];
  });
  const [isSending, setIsSending] = useState(false);
  const { errorToast, successToast, showError, showSuccess } = useToast();
  const isInitialMount = useRef(true);

  // Reload from localStorage (for manual refresh, e.g. tab switch)
  const loadOrders = useCallback(() => {
    const savedOrders = localStorage.getItem('hmbr_pending_orders');
    if (savedOrders) {
      try {
        const parsed = JSON.parse(savedOrders);
        setPendingOrders(parsed.orders || []);
      } catch {
        setPendingOrders([]);
      }
    } else {
      setPendingOrders([]);
    }
  }, []);

  // Save to localStorage whenever orders change — but skip the initial mount
  // to prevent overwriting real data with [] (critical with React StrictMode)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    localStorage.setItem('hmbr_pending_orders', JSON.stringify({ orders: pendingOrders }));
  }, [pendingOrders]);

  const updateQuantity = (orderIndex: number, itemIndex: number, delta: number) => {
    setPendingOrders(prev => {
      const newOrders = [...prev];
      const order = { ...newOrders[orderIndex] };
      const items = [...order.items];
      const item = { ...items[itemIndex] };
      
      const newQty = Math.max(1, item.xqty + delta);
      item.xqty = newQty;
      item.xlinetotal = newQty * item.xprice;
      
      items[itemIndex] = item;
      order.items = items;
      newOrders[orderIndex] = order;
      
      return newOrders;
    });
  };

  const removeItem = (orderIndex: number, itemIndex: number) => {
    setPendingOrders(prev => {
      const newOrders = [...prev];
      const order = { ...newOrders[orderIndex] };
      let items = [...order.items];
      
      items.splice(itemIndex, 1);
      
      if (items.length === 0) {
        newOrders.splice(orderIndex, 1);
      } else {
        order.items = items;
        newOrders[orderIndex] = order;
      }
      
      return newOrders;
    });
  };

  const sendSingleOrder = async (index: number) => {
    setIsSending(true);
    try {
      const loc = await getCurrentLocation();
      const orderToSend = JSON.parse(JSON.stringify(pendingOrders[index]));
      
      orderToSend.items = orderToSend.items.map((item: any) => ({
        ...item,
        xlat: Number(loc.lat.toFixed(6)),
        xlong: Number(loc.lng.toFixed(6))
      }));

      const response = await sendBulkOrders([orderToSend]);
      
      setPendingOrders(prev => {
        const newOrders = [...prev];
        newOrders.splice(index, 1);
        return newOrders;
      });
      
      const responseList = Array.isArray(response) ? response : (response?.data ? (Array.isArray(response.data) ? response.data : [response.data]) : [response]);
      const invoices = responseList.map((r: any) => r?.invoiceno).filter(Boolean).join(', ');
      showSuccess(`Order sent successfully! Invoice: ${invoices || 'N/A'}`);
      
      return true;
    } catch (err: any) {
      showError(err.message || 'Failed to send order');
      return false;
    } finally {
      setIsSending(false);
    }
  };

  const sendAllOrders = async () => {
    if (pendingOrders.length === 0) return false;
    
    setIsSending(true);
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
      
      const responseList = Array.isArray(response) ? response : (response?.data ? (Array.isArray(response.data) ? response.data : [response.data]) : [response]);
      const invoices = responseList.map((r: any) => r?.invoiceno).filter(Boolean).join(', ');
      showSuccess(`Orders sent successfully! Invoices: ${invoices || 'N/A'}`);
      
      return true;
    } catch (err: any) {
      showError(err.message || 'Failed to send orders');
      return false;
    } finally {
      setIsSending(false);
    }
  };

  return {
    pendingOrders,
    isSending,
    loadOrders,
    updateQuantity,
    removeItem,
    sendSingleOrder,
    sendAllOrders,
    errorToast,
    successToast,
  };
}