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
  xpmtnum?: string;
  xdornum?: string;
  xtotamt?: string;
  xpaid_so_far?: string;
  xremaining?: string;
  [key: string]: any;
}

export interface OverpaymentError {
  message: string;
  type: 'overpayment_error';
  xdornum: string;
  do_total_amount: number;
  already_paid: number;
  this_payment: number;
  projected_total: number;
  overpaid_by: number;
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

// Get app version from localStorage or environment
const getAppVersion = (): string => {
  // You can store this in localStorage or get from your build process
  return localStorage.getItem('appVersion') || '1.0.0';
};

export const getCustomerPayments = async (
  params: GetCustomerPaymentsParams
): Promise<GetCustomerPaymentsResponse> => {
  const response = await api.get('/customers/customer-payment/get-all-payments/', {
    params,
    headers: {
      'X-App-Ver': getAppVersion(),
    },
  });
  return response.data;
};

export const createCustomerPayment = async (
  data: CreateCustomerPaymentPayload
): Promise<CreateCustomerPaymentResponse> => {
  try {
    const response = await api.post(
      `/customers/customer-payment/${data.zid}/`,
      data,
      {
        headers: {
          'X-App-Ver': getAppVersion(),
        },
      }
    );
    
    const res = response.data;
    
    // Normalize response
    if (res && typeof res === 'object') {
      if ('success' in res) {
        return res as CreateCustomerPaymentResponse;
      }
      const message = (res as any).message || (response.status === 200 ? 'Payment created successfully' : 'Request completed');
      return { success: true, message, ...res } as CreateCustomerPaymentResponse;
    }
    
    return { success: true, message: 'Payment created successfully', data: res } as CreateCustomerPaymentResponse;
  } catch (error: any) {
    // Handle overpayment error specifically
    if (error.response?.status === 400 && error.response?.data?.detail?.type === 'overpayment_error') {
      throw new OverpaymentErrorWrapper(error.response.data.detail);
    }
    throw error;
  }
};

// Custom error class for overpayment
export class OverpaymentErrorWrapper extends Error {
  public detail: OverpaymentError;
  
  constructor(detail: OverpaymentError) {
    super(detail.message);
    this.detail = detail;
    this.name = 'OverpaymentError';
  }
}

// Utility to check if app version is valid
export const validateAppVersion = async (): Promise<boolean> => {
  try {
    // Make a lightweight request to check version
    const response = await api.get('/api/v1/health', {
      headers: {
        'X-App-Ver': getAppVersion(),
      },
    });
    return response.status === 200;
  } catch (error) {
    return false;
  }
};