import api from './api';

export interface Customer {
  xcus: string;
  xorg: string;
  xadd1?: string;
  xmobile?: string;
  xtaxnum?: string;
  [key: string]: any;
}

/**
 * Search customers. Supports cancellation via AbortSignal — pass the
 * current `AbortController.signal` so stale requests can be aborted when the
 * user keeps typing. The server is the same; only one in-flight request
 * per overlay session is ever allowed to "win".
 */
export const searchCustomers = async (
  zid: string | number,
  employeeId: string,
  customerQuery: string,
  limit = 10,
  offset = 0,
  signal?: AbortSignal
): Promise<Customer[]> => {
    try {
        const response = await api.get(`/customers/all/${zid}`, {
            params: {
                customer: customerQuery,
                employee_id: employeeId,
                limit,
                offset
            },
            signal,
        });
        return response.data;
    } catch (error: any) {
        // Handle 404 gracefully for search
        if (error.response?.status === 404) {
            return [];
        }
        // Aborted by caller — let the caller handle it (no state mutation).
        if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') {
            throw error;
        }
        throw error;
    }
};

/**
 * Fetch all customers for the Customer Master screen.
 * Uses offset-based pagination (offset += 10 per load).
 * employee_id is the logged-in user's user_id.
 */
export const getAllCustomers = async (
    zid: string | number,
    employeeId: string,
    options: { customer?: string; limit?: number; offset?: number } = {}
): Promise<Customer[]> => {
    const { customer, limit = 10, offset = 0 } = options;
    try {
        const params: Record<string, any> = {
            employee_id: employeeId,
            limit,
            offset,
        };
        if (customer && customer.trim().length > 0) {
            params.customer = customer.trim();
        }
        const response = await api.get(`/customers/all/${zid}`, { params });
        return Array.isArray(response.data) ? response.data : [];
    } catch (error: any) {
        if (error.response?.status === 404) {
            return [];
        }
        throw error;
    }
};
