import api from './api';

export interface FeedbackPayload {
  customer_id?: string;
  description: string;
  is_collection_issue: boolean;
  is_delivery_issue: boolean;
  product_id?: string;
  user_id: string;
  zid: number;
}

export const createFeedback = async (payload: FeedbackPayload) => {
  const data = { ...payload };
  if (!data.customer_id) delete data.customer_id;
  if (!data.product_id) delete data.product_id;

  const response = await api.post('/feedback/create', data);
  return response.data;
};
