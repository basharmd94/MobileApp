import { PendingOrder } from '../api_orders';

export const getOrderKey = (order: PendingOrder): string =>
  `${order.zid}:${order.invoiceno}`;

export const mergeOrders = (
  existingOrders: PendingOrder[],
  fetchedOrders: PendingOrder[],
): PendingOrder[] => {
  const uniqueOrders = new Map<string, PendingOrder>();

  for (const order of [...existingOrders, ...fetchedOrders]) {
    uniqueOrders.set(getOrderKey(order), order);
  }

  return Array.from(uniqueOrders.values());
};
