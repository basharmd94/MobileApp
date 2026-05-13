import api from './api';

export interface DeliveryOrderItem {
  xitem: string;
  xdesc: string;
  xqty: number;
  xrate: number;
  xlineamt: number;
}

export interface DeliveryOrder {
  xdornum: string;
  xordernum: string;
  xcus: string;
  xshort: string;
  xadd1: string;
  xzid: string | number;
  grossamt: number;
  discamt: number;
  netamt: number;
  xdate: string;
  xdatepay: string | null;
  items: DeliveryOrderItem[];
}

export interface DeliveryOrdersResponse {
  delivery_orders: DeliveryOrder[];
  count: number;
}

export interface GetDeliveryOrdersParams {
  zid: string;
  limit?: number;
  xdornum?: string;
  xcus?: string;
  xdate?: string;
  xitem?: string;
}

export const getDeliveryOrders = async (params: GetDeliveryOrdersParams): Promise<DeliveryOrdersResponse> => {
  const queryParams = new URLSearchParams();
  queryParams.append('zid', params.zid);
  if (params.limit !== undefined) {
    queryParams.append('limit', params.limit.toString());
  }
  if (params.xdornum) {
    queryParams.append('xdornum', params.xdornum);
  }
  if (params.xcus) {
    queryParams.append('xcus', params.xcus);
  }
  if (params.xdate) {
    queryParams.append('xdate', params.xdate);
  }
  if (params.xitem) {
    queryParams.append('xitem', params.xitem);
  }

  const response = await api.get(`/order/get-delivery-orders?${queryParams.toString()}`);
  return response.data;
};
