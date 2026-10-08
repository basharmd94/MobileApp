import api from './api';
import type { AxiosRequestConfig } from 'axios';

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

type OrderRequestOptions = Pick<AxiosRequestConfig, 'signal'>;

const getOrders = async (
  endpoint: string,
  limit: number,
  zid?: string,
  options?: OrderRequestOptions,
): Promise<OrdersResponse> => {
  const params = new URLSearchParams();
  if (zid) {
    params.append('zid', zid);
  }
  params.append('limit', limit.toString());

  const response = await api.get(`${endpoint}?${params.toString()}`, options);
  return response.data;
};

export const getPendingOrders = async (
  limit: number = 10,
  zid?: string,
  options?: OrderRequestOptions,
): Promise<OrdersResponse> => getOrders('/order/get-pending-orders', limit, zid, options);

export const getConfirmedOrders = async (
  limit: number = 10,
  zid?: string,
  options?: OrderRequestOptions,
): Promise<OrdersResponse> => getOrders('/order/get-confirmed-orders', limit, zid, options);

export const getCancelledOrders = async (
  limit: number = 10,
  zid?: string,
  options?: OrderRequestOptions,
): Promise<OrdersResponse> => getOrders('/order/get-cancelled-orders', limit, zid, options);
