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
    // ─── ADD VALIDATION: Return early if query is too short ───
    if (!customerQuery || customerQuery.trim().length < 3) {
        return [];
    }
    if (!employeeId || employeeId.trim().length < 3) {
        return [];
    }

    try {
        const response = await api.get(`/customers/all/${zid}`, {
            params: {
                customer: customerQuery.trim(),
                employee_id: employeeId.trim(),
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
        // Handle 500 errors gracefully
        if (error.response?.status === 500) {
            console.warn('Server error during customer search:', error);
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
    
    // ─── ADD VALIDATION: Validate employeeId ───
    if (!employeeId || employeeId.trim().length < 3) {
        console.warn('getAllCustomers: Invalid employeeId:', employeeId);
        return [];
    }

    // ─── MODIFY: Only send customer param if it has 3+ characters ───
    // If customer is empty or too short, don't send it (backend will return all)
    const shouldFilter = customer && customer.trim().length >= 3;
    
    try {
        const params: Record<string, any> = {
            employee_id: employeeId.trim(),
            limit,
            offset,
        };
        if (shouldFilter) {
            params.customer = customer.trim();
        }
        const response = await api.get(`/customers/all/${zid}`, { params });
        return Array.isArray(response.data) ? response.data : [];
    } catch (error: any) {
        if (error.response?.status === 404) {
            return [];
        }
        if (error.response?.status === 500) {
            console.warn('Server error fetching customers:', error);
            return [];
        }
        throw error;
    }
};