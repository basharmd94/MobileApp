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

export const searchItems = async (zid: string | number, searchQuery: string, limit = 10, offset = 0): Promise<Item[]> => {
    try {
        const response = await api.get(`/items/all/${zid}`, {
            params: {
                item_name: searchQuery,
                limit,
                offset
            }
        });
        return response.data;
    } catch (error: any) {
        if (error.response && error.response.status === 404) {
            return [];
        }
        throw error;
    }
};
