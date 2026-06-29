import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Loader2, Package, Tag,
  AlertCircle, CheckCircle2, Circle,
} from 'lucide-react';
import { searchItems, Item } from '../api_items';
import { ItemSearch } from '../components/ItemSearch';
import Header from '../components/ui/Header';
import BusinessTabs from '../components/BusinessTabs';
import LoadMoreButton from '../components/LoadMoreButton';

const LIMIT = 10;

// ── Stock status helper ────────────────────────────────────────────────────────

function getStockStatus(classification: string | null | undefined): {
  label: string;
  color: string;
  bgColor: string;
  icon: React.ReactNode;
} {
  const normalized = (classification || '').trim();
  if (normalized === 'Out of Stock')
    return { label: 'Out of Stock', color: 'text-red-600', bgColor: 'bg-red-50 border-red-200', icon: <AlertCircle className="w-3 h-3" /> };
  if (normalized === 'Low Stock' || normalized === 'Low Stock NS')
    return { label: normalized, color: 'text-amber-600', bgColor: 'bg-amber-50 border-amber-200', icon: <Circle className="w-3 h-3" /> };
  if (normalized === 'Medium Stock')
    return { label: 'Medium Stock', color: 'text-blue-600', bgColor: 'bg-blue-50 border-blue-200', icon: <Circle className="w-3 h-3" /> };
  if (normalized === 'In Stock' || normalized === 'In Stock NS')
    return { label: normalized, color: 'text-green-600', bgColor: 'bg-green-50 border-green-200', icon: <CheckCircle2 className="w-3 h-3" /> };
  return { label: normalized || 'Unknown', color: 'text-gray-600', bgColor: 'bg-gray-50 border-gray-200', icon: <Circle className="w-3 h-3" /> };
}

function getDiscountInfo(item: Item): string | null {
  const discAmt = item.disc_amt && item.disc_amt !== 0 ? `৳${item.disc_amt.toFixed(2)}` : null;
  const minQty = item.min_disc_qty && item.min_disc_qty !== 0 ? `Min ${item.min_disc_qty}` : null;
  if (discAmt && minQty) return `${discAmt} (${minQty})`;
  return discAmt || minQty || null;
}

function getStockUnit(item: Item): string | null {
  const stockUnit = item.stock_unit || item.xunitstk;
  return stockUnit && stockUnit.trim() !== '' ? stockUnit : null;
}

// ── Item card ─────────────────────────────────────────────────────────────────

function ItemCard({ item }: { item: Item }) {
  const stockStatus = getStockStatus(item.stock_classification);
  const discountInfo = getDiscountInfo(item);
  const stockUnit = getStockUnit(item);

  return (
    <div className="bg-[#fff7ed] border border-orange-100 p-3.5 rounded-[16px] shadow-[0_2px_10px_rgb(0,0,0,0.03)]">
      {/* Header row — name + price */}
      <div className="flex items-start justify-between mb-2.5">
        <div className="flex items-start gap-2.5 min-w-0 max-w-[calc(100%-72px)]">
          <div className="w-8 h-8 rounded-xl bg-orange-100 border border-orange-200 flex items-center justify-center shrink-0">
            <Package className="w-4 h-4 text-orange-500" />
          </div>
          <div className="flex-1 min-w-0 overflow-hidden">
            <h3 className="text-[13px] font-bold text-text-main leading-tight line-clamp-2">
              {item.item_name}
            </h3>
            <span className="inline-flex mt-0.5 px-1.5 py-0.5 rounded text-[8px] font-bold bg-white border border-orange-200 text-orange-700 max-w-full truncate">
              {item.item_id}
            </span>
          </div>
        </div>

        {/* Price badge */}
        <span className="ml-2 shrink-0 inline-flex items-center px-2 py-1 rounded-lg text-[12px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200">
          ৳{item.std_price}
        </span>
      </div>

      {/* Meta row */}
      <div className="flex flex-wrap items-center gap-1.5 px-2.5 py-2 bg-white/60 rounded-[10px] border border-orange-50">
        {item.item_group && (
          <span className="text-[10px] text-text-secondary font-medium">
            {item.item_group}
          </span>
        )}
        {stockUnit && (
          <span className="text-[9px] text-text-muted bg-gray-100 px-1.5 py-0.5 rounded font-medium">
            {stockUnit}
          </span>
        )}
        {discountInfo && (
          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] font-bold bg-purple-100 border border-purple-200 text-purple-700">
            <Tag className="w-2.5 h-2.5" />
            {discountInfo}
          </span>
        )}
        <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] font-bold border ${stockStatus.color} ${stockStatus.bgColor}`}>
          {stockStatus.icon}
          {stockStatus.label}
        </span>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function ItemMaster() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('100001');

  // ItemSearch selection — shows single item card when set
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  // ── Stale-response guard ─────────────────────────────────────────────────────
  // Each fetch call gets a unique ID. Only the most-recent request is allowed to
  // update state. The `finally` block always clears the loading flag (so it can
  // never get permanently stuck), but data writes are skipped for old requests.
  const requestIdRef = useRef(0);

  // ── Paginated fetch ──────────────────────────────────────────────────────────

  const fetchItems = useCallback(
    async (currentOffset: number, isLoadMore = false) => {
      const requestId = ++requestIdRef.current;

      if (isLoadMore) setLoadingMore(true);
      else setLoading(true);

      try {
        // Empty query → API returns first LIMIT items (all-view endpoint)
        const data = await searchItems(activeTab, '', LIMIT, currentOffset);

        // Stale response — a newer request has already taken over
        if (requestId !== requestIdRef.current) return;

        setItems((prev) => {
          if (!isLoadMore) return data;
          const existingIds = new Set(prev.map((it) => it.item_id));
          const fresh = data.filter((it) => !existingIds.has(it.item_id));
          return [...prev, ...fresh];
        });
        setHasMore(data.length >= LIMIT);
      } catch (err) {
        if (requestId !== requestIdRef.current) return;
        console.error('Failed to fetch items:', err);
        if (!isLoadMore) setItems([]);
      } finally {
        // Always clear the flag for THIS request type — can never get stuck
        if (isLoadMore) setLoadingMore(false);
        else setLoading(false);
      }
    },
    [activeTab],
  );

  // Re-fetch on tab change.
  // Explicitly reset loadingMore so a mid-flight load-more can't leave
  // the button stuck in a spinner state after a tab switch.
  useEffect(() => {
    setOffset(0);
    setSelectedItem(null);
    setItems([]);
    setLoadingMore(false);
    fetchItems(0);
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadMore = () => {
    if (loadingMore || !hasMore || loading) return;
    const nextOffset = offset + LIMIT;
    setOffset(nextOffset);
    fetchItems(nextOffset, true);
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="page-root">
      <Header title="Item Master">
        <div className="mt-4">
          <BusinessTabs activeTab={activeTab} onChange={(tab) => { setActiveTab(tab); }} />
        </div>

        {/* Reuse the same ItemSearch overlay from Create Order */}
        <div className="mt-3">
          <ItemSearch
            zid={activeTab}
            value={selectedItem}
            onChange={setSelectedItem}
            placeholder="Search by item name, ID, or group…"
          />
        </div>

        {/* Result count */}
        <p className="text-[10px] text-text-muted font-medium mt-2">
          {loading && !selectedItem
            ? 'Loading…'
            : selectedItem
            ? '1 item selected'
            : `${items.length} item${items.length !== 1 ? 's' : ''} loaded`}
        </p>
      </Header>

      {/* ── Main content ── */}
      <main className="flex-1 overflow-y-auto pb-24">
        <div className="page-content px-4 py-4">

          {/* ── Single selected item view ── */}
          {selectedItem ? (
            <div className="card-grid">
              <ItemCard item={selectedItem} />
            </div>
          ) : loading && items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-orange-500 opacity-50 mb-4" />
              <p className="text-[11px] font-bold text-text-muted">Loading items…</p>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Package className="w-12 h-12 text-orange-200 mb-3" />
              <p className="text-[12px] font-bold text-text-muted">No items found.</p>
            </div>
          ) : (
            // ── Paginated list ──
            <div className="card-grid">
              {items.map((item, i) => (
                <ItemCard key={item.item_id || i} item={item} />
              ))}

              {hasMore && items.length > 0 && (
                <LoadMoreButton loading={loadingMore} onClick={loadMore} />
              )}
              {!hasMore && items.length > 0 && (
                <div className="text-center mt-6 mb-2 text-[11px] text-orange-900/40 font-medium">
                  {items.length} items loaded.
                </div>
              )}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
