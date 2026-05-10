import api from './api';

export interface Customer {
  xcus: string;
  xorg: string;
  xadd1?: string;
  [key: string]: any;
}

export const searchCustomers = async (zid: string | number, employeeId: string, customerQuery: string, limit = 10, offset = 0): Promise<Customer[]> => {
    try {
        const response = await api.get(`/customers/all/${zid}`, {
            params: {
                customer: customerQuery,
                employee_id: employeeId,
                limit,
                offset
            }
        });
        return response.data;
    } catch (error: any) {
        // Handle 404 gracefully for search
        if (error.response?.status === 404) {
            return [];
        }
        throw error;
    }
};
