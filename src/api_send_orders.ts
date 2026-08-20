import api from './api';
import { APP_VERSION } from './config';

/**
 * Send a batch of orders to /order/create-bulk-order.
 *
 * Each order is decorated with `xappver` (the current app version baked
 * in at build time) BEFORE the request leaves the client. The backend
 * reads this field, compares it against `zbusiness.xappver` in the
 * database, and returns 426 "Upgrade Required" if the running app is
 * too old to send orders.
 */
export const sendBulkOrders = async (orders: any[]) => {
    try {
        const ordersWithVersion = (orders || []).map((order) => ({
            ...order,
            xappver: APP_VERSION,
        }));

        const response = await api.post('/order/create-bulk-order', {
            orders: ordersWithVersion,
        });
        return response.data;
    } catch (error: any) {
        let errorMessage = 'Failed to send orders';

        // If the API already normalized this for us (via the 426 branch
        // in api.ts), prefer that exact human-readable text.
        if (error?.appVersionMessage) {
            errorMessage = error.appVersionMessage;
        } else if (error.response?.data?.detail) {
            // The backend nests its error under `detail` which may itself
            // be a string OR an object (e.g. { message, type }).
            const detail = error.response.data.detail;
            if (typeof detail === 'string') {
                errorMessage = detail;
            } else if (detail && typeof detail === 'object' && detail.message) {
                errorMessage = detail.message;
            } else {
                errorMessage = JSON.stringify(detail);
            }
        } else if (error.response?.data?.message) {
            errorMessage = error.response.data.message;
        } else if (error.response?.status === 400) {
            errorMessage = 'Invalid order data';
        } else if (error.response?.status === 404) {
            errorMessage = 'Endpoint not found';
        } else if (error.response?.status === 426) {
            // Defensive fallback — the 426 interceptor in api.ts already
            // surfaced the modal; this branch is for non-mapped callers.
            errorMessage = 'App version outdated. Please update.';
        } else if (error.message) {
            errorMessage = error.message;
        }

        const wrapped = new Error(errorMessage) as Error & {
            status?: number;
            isAppVersionError?: boolean;
        };
        wrapped.status = error.response?.status;
        wrapped.isAppVersionError = error.response?.status === 426;
        throw wrapped;
    }
};
