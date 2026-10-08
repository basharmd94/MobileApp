import assert from 'node:assert/strict';
import test from 'node:test';
import { getOrderKey, mergeOrders } from './orderList';
import type { PendingOrder } from '../api_orders';

const order = (zid: number, invoiceno: string): PendingOrder => ({
  zid,
  invoiceno,
  xcus: 'customer',
  xcusname: 'Customer',
  items: 'item',
  total_qty: 1,
  total_price: 10,
  total_linetotal: 10,
  xstatusord: 'New',
});

test('order identity includes the business ID', () => {
  assert.equal(getOrderKey(order(100001, 'INV-1')), '100001:INV-1');
});

test('duplicate pagination rows are removed without collapsing different businesses', () => {
  const firstPage = [order(100001, 'INV-1'), order(100005, 'INV-2')];
  const repeatedPage = [order(100001, 'INV-1'), order(100005, 'INV-2')];

  assert.deepEqual(mergeOrders(firstPage, repeatedPage), firstPage);
});

test('a later page replaces an existing row with the same business and invoice', () => {
  const existing = order(100001, 'INV-1');
  existing.xcusname = 'Old customer';
  const updated = order(100001, 'INV-1');
  updated.xcusname = 'Updated customer';

  assert.equal(mergeOrders([existing], [updated])[0].xcusname, 'Updated customer');
});
