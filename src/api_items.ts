import api from './api';

export interface Item {
  zid: number;
  item_id: string;
  item_name: string;
  item_group: string;
  std_price: number;
  stock: number;
  xbin: string | null;
  min_disc_qty: number;
  disc_amt: number;
  [key: string]: any;
}

/**
 * Search items using the fast view endpoint
 * Uses the pre-computed final_items_view which is refreshed every hour
 * Only returns items with non-empty warehouse
 */
export const searchItems = async (
  zid: string | number, 
  searchQuery: string, 
  limit = 20, 
  offset = 0
): Promise<Item[]> => {
    try {
        // Only send item_name if it's at least 2 characters
        const params: any = {
            limit,
            offset
        };
        
        if (searchQuery && searchQuery.trim().length >= 2) {
            params.item_name = searchQuery.trim();
        }
        
        const response = await api.get(`/items/all-view/${zid}`, { params });
        return response.data;
    } catch (error: any) {
        if (error.response && error.response.status === 404) {
            return [];
        }
        throw error;
    }
};