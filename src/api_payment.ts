import api from './api';

export interface CustomerPaymentInfo {
  xpmtnum: string;
  zid: number;
  xcus: string;
  xshort: string;
  xemp: string;
  xname: string;
  xpayamt: string;
  xpaydate: string;
  xpaytype: string;
  xbankdetail: string;
  xpaystatus: string;
  xremarks: string;
  ztime: string;
  zutime: string;
}

export interface CreateCustomerPaymentPayload {
  zid: number;
  xdornum: string;
  xcus: string;
  xshort: string;
  xemp: string;
  xname: string;
  xpayamt: number;
  xpaydate: string;
  xpaytype: string;
  xbankdetail?: string;
  xremarks?: string;
  xpaystatus: string;
}

export interface CreateCustomerPaymentResponse {
  success: boolean;
  message: string;
  [key: string]: any;
}

export interface GetCustomerPaymentsParams {
  zid?: number | string;
  xcus?: string;
  xemp?: string;
  xdate?: string;
  limit?: number;
  offset?: number;
}

export interface GetCustomerPaymentsResponse {
  data: CustomerPaymentInfo[];
  total: number;
  limit: number;
  offset: number;
  message: string;
}

export const getCustomerPayments = async (
  params: GetCustomerPaymentsParams
): Promise<GetCustomerPaymentsResponse> => {
  const response = await api.get('/customers/customer-payment/get-all-payments/', {
    params,
  });
  return response.data;
};

export const createCustomerPayment = async (
  data: CreateCustomerPaymentPayload
): Promise<CreateCustomerPaymentResponse> => {
  const response = await api.post(`/customers/customer-payment/${data.zid}/`, data);
  const res = response.data;
  // Backend sometimes returns an object without `success` boolean.
  // Normalize to { success: true, message, ... } when message exists.
  if (res && typeof res === 'object') {
    if ('success' in res) {
      return res as CreateCustomerPaymentResponse;
    }
    const message = (res as any).message || (response.status === 200 ? 'Payment created successfully' : 'Request completed');
    return { success: true, message, ...res } as CreateCustomerPaymentResponse;
  }
  return { success: true, message: 'Payment created successfully', data: res } as CreateCustomerPaymentResponse;
};
