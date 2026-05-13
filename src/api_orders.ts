import api from './api';

export interface PendingOrder {
  zid: number;
  invoiceno: string;
  xordernum?: string | null;
  xdate?: string;
  xcus: string;
  xcusname: string;
  items: string;
  total_qty: number;
  total_price: number;
  total_linetotal: number;
  xstatusord: string;
}

export interface OrdersResponse {
  orders: PendingOrder[];
  count: number;
  status: string;
}

export const getPendingOrders = async (limit: number = 10, zid?: string): Promise<OrdersResponse> => {
  const params = new URLSearchParams();
  if (zid) {
    params.append('zid', zid);
  }
  params.append('limit', limit.toString());

  const response = await api.get(`/order/get-pending-orders?${params.toString()}`);
  return response.data;
};

export const getConfirmedOrders = async (limit: number = 10, zid?: string): Promise<OrdersResponse> => {
  const params = new URLSearchParams();
  if (zid) {
    params.append('zid', zid);
  }
  params.append('limit', limit.toString());

  const response = await api.get(`/order/get-confirmed-orders?${params.toString()}`);
  return response.data;
};

export const getCancelledOrders = async (limit: number = 10, zid?: string): Promise<OrdersResponse> => {
  const params = new URLSearchParams();
  if (zid) {
    params.append('zid', zid);
  }
  params.append('limit', limit.toString());

  const response = await api.get(`/order/get-cancelled-orders?${params.toString()}`);
  return response.data;
};
