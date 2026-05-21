import api from './api';

export interface CustomerReceipt {
  xdate: string;
  xvoucher: string;
  xsp: string;
  xname: string;
  xsub: string;
  xshort: string;
  xprime: number;
}

export interface CustomerRctResponse {
  zid: number;
  receipt_date: string | null;
  customer: string;
  receipts: CustomerReceipt[];
  count: number;
}

export interface CustomerRctPayload {
  customer?: string;
  limit: number;
  receipt_date?: string;
  zid: number | string;
}

export const getCustomerReceipts = async (payload: CustomerRctPayload): Promise<CustomerRctResponse> => {
  const data = { ...payload };
  if (!data.customer) delete data.customer;
  if (!data.receipt_date) delete data.receipt_date;
  
  const response = await api.post('/customer-rct/', data);
  return response.data;
};
