import api from './api';

export interface ReturnPayload {
  return_header: {
    xcus: string;
    xdate: string;
    xdatecuspo: string;
    xdornum: string;
    xemp: string;
    xordernum: string;
    xproj: string;
    xreason: string;
    xsec: string;
    xstatuscrn: string;
    xwh: string;
    zid: number;
  };
  return_items: Array<{
    xdesc: string;
    xitem: string;
    xlineamt: number;
    xqty: number;
    xrate: number;
    xunitsel: string;
  }>;
}

export interface ReturnResponse {
  message: string;
  sr_number: string;
  success: boolean;
  total_amount: number;
}

export const createSalesReturn = async (payload: ReturnPayload): Promise<ReturnResponse> => {
  try {
    const response = await api.post('/return/create-return', payload);
    return response.data;
  } catch (error: any) {
    let errorMessage = 'Failed to create sales return';
    if (error.response?.data?.detail) {
      errorMessage = error.response.data.detail;
    } else if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.message) {
      errorMessage = error.message;
    }
    throw new Error(errorMessage);
  }
};

export interface ReturnItem {
  xitem: string;
  xdesc: string;
  xunitsel: string;
  xqty: number;
  xrate: number;
  xlineamt: number;
}

export interface ReturnOrder {
  xdate: string;
  zid: number;
  xcrnnum: string;
  xcus: string;
  xorg: string;
  xadd1: string;
  xstatuscrn: string;
  xdornum: string;
  xordernum: string;
  xemp: string;
  xrem: string | null;
  xstr01: string | null;
  items: ReturnItem[];
}

export interface ReturnsListResponse {
  returns: ReturnOrder[];
  count: number;
}

export interface GetReturnsParams {
  zid: string;
  xdate?: string;
  xcus?: string;
  xcrnnum?: string;
  xdornum?: string;
  xitem?: string;
  limit?: number;
  offset?: number;
}

export const getSalesReturns = async (params: GetReturnsParams): Promise<ReturnsListResponse> => {
  const queryParams = new URLSearchParams();
  queryParams.append('zid', params.zid);
  
  if (params.xdate) queryParams.append('xdate', params.xdate);
  if (params.xcus) queryParams.append('xcus', params.xcus);
  if (params.xcrnnum) queryParams.append('xcrnnum', params.xcrnnum);
  if (params.xdornum) queryParams.append('xdornum', params.xdornum);
  if (params.xitem) queryParams.append('xitem', params.xitem);
  if (params.limit !== undefined) queryParams.append('limit', params.limit.toString());
  if (params.offset !== undefined) queryParams.append('offset', params.offset.toString());

  const response = await api.get(`/return/get-sales-returns?${queryParams.toString()}`);
  return response.data;
};
