import api from './api';

export interface DeliveryOrderLineItem {
  xitem: string;
  xdesc: string;
  xunitstk: string;
  xqty: number;
  xrate: number;
  xlineamt: number;
}

export interface DeliveryOrder {
  zid: number;                    // ADDED: Business ID
  xdornum: string;
  xordernum: string;
  xcus: string;
  xshort: string;
  xadd1: string;
  xstatusdor: string | null;     // ADDED: Delivery order status
  xwh: string;
  xproj: string;
  grossamt: number;
  discamt: number;
  netamt: number;
  xdate: string;
  xdatepay: string | null;
  items: DeliveryOrderLineItem[];
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

// Optional: Add a detail endpoint interface if you need it
export interface DeliveryOrderDetailItem {
  zid: number;
  xdate: string;
  xdornum: string;
  xcus: string;
  xorg: string;
  xitem: string;
  xdesc: string;
  xunitstk: string;
  xrate: number;
  xqty: number;
  xlineamt: number;
}

export interface DeliveryOrderDetailResponse {
  zid: number;
  delivery_order: string;
  xordernum: string;
  customer: string;
  xstatusdor: string | null;     // ADDED: Delivery order status
  xproj: string;
  xwh: string;
  line_items: DeliveryOrderDetailItem[];
  total_items: number;
  total_amount: number;
}

export const getDeliveryOrderDetail = async (xdornum: string, zid: string): Promise<DeliveryOrderDetailResponse> => {
  const response = await api.get(`/order/get-delivery-order/${xdornum}?zid=${zid}`);
  return response.data;
};

export interface UpdateDeliveryDatesPayload {
  delivery_date: string;
  payment_date: string;
}

export interface UpdateDeliveryDatesResponse {
  success: boolean;
  message: string;
  xdornum: string;
  delivery_date: string;
  payment_date: string;
}

export const updateDeliveryDates = async (
  zid: string,
  xdornum: string,
  data: UpdateDeliveryDatesPayload
): Promise<UpdateDeliveryDatesResponse> => {
  const response = await api.put(`/order/delivery-date-update/${zid}/${xdornum}`, data);
  return response.data;
};