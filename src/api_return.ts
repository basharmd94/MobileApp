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
