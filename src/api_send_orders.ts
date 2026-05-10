import api from './api';

export const sendBulkOrders = async (orders: any[]) => {
  try {
    const response = await api.post('/order/create-bulk-order', { orders });
    return response.data;
  } catch (error: any) {
    let errorMessage = 'Failed to send orders';
    if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
    } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
    } else if (error.response?.status === 400) {
        errorMessage = 'Invalid order data';
    } else if (error.response?.status === 404) {
        errorMessage = 'Endpoint not found';
    } else if (error.message) {
        errorMessage = error.message;
    }
    throw new Error(errorMessage);
  }
};
