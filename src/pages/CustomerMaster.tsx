import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Loader2, Users, User, MapPin, Phone,
} from 'lucide-react';
import { getAllCustomers, Customer } from '../api_customers';
import { CustomerSearch } from '../components/CustomerSearch';
import Header from '../components/ui/Header';
import BusinessTabs from '../components/BusinessTabs';
import LoadMoreButton from '../components/LoadMoreButton';
import { useCurrentUser } from '../hooks/useCurrentUser';

// Default query — the backend requires at least 3 chars to return
// any results. "CUS" is the universal prefix that matches every
// customer record, so the initial load and "Load More" both return
// the full list. The search overlay (CustomerSearch) uses the user's
// own typed query instead, which is why typing in the input box
// already works even when this default is in effect.
const DEFAULT_QUERY = 'CUS';
const LIMIT = 10;

export default function CustomerMaster() {
  const { employeeId } = useCurrentUser();

  // Paginated list state (shown when no customer is selected)
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('100001');

  // CustomerSearch selection (shows single customer detail)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // ── Stale-response guard ─────────────────────────────────────────────────────
  const requestIdRef = useRef(0);

  const fetchCustomers = useCallback(
    async (currentOffset: number, isLoadMore = false) => {
      const requestId = ++requestIdRef.current;

      if (isLoadMore) setLoadingMore(true);
      else setLoading(true);

      try {
        // Always pass the customer param — the backend requires at
        // least 3 characters or it returns an empty array. The
        // "CUS" prefix is the universal one that matches everything.
        const data = await getAllCustomers(activeTab, employeeId, {
          customer: DEFAULT_QUERY,
          limit: LIMIT,
          offset: currentOffset,
        });

        // Stale response — a newer request has already taken over
        if (requestId !== requestIdRef.current) return;

        setCustomers((prev) => {
          if (!isLoadMore) return data;
          const existingIds = new Set(prev.map((c) => c.xcus));
          const fresh = data.filter((c) => !existingIds.has(c.xcus));
          return [...prev, ...fresh];
        });
        setHasMore(data.length >= LIMIT);
      } catch (err) {
        if (requestId !== requestIdRef.current) return;
        console.error('Failed to fetch customers:', err);
        if (!isLoadMore) setCustomers([]);
      } finally {
        if (isLoadMore) setLoadingMore(false);
        else setLoading(false);
      }
    },
    [activeTab, employeeId],
  );

  // Re-fetch when tab changes or employeeId becomes available.
  useEffect(() => {
    if (!employeeId) return;
    setOffset(0);
    setSelectedCustomer(null);
    setCustomers([]);
    setLoadingMore(false);
    fetchCustomers(0);
  }, [activeTab, employeeId]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadMore = () => {
    if (loadingMore || !hasMore || loading) return;
    const nextOffset = offset + LIMIT;
    setOffset(nextOffset);
    fetchCustomers(nextOffset, true);
  };

  // ── Helpers ──────────────────────────────────────────────────────────────────

  const formatPhone = (phone: string | undefined) => {
    if (!phone || phone.trim() === '') return null;
    return phone.trim();
  };

  // ── Customer card ─────────────────────────────────────────────────────────────

  const CustomerCard = ({ customer, index }: { customer: Customer; index: number }) => {
    const primary = formatPhone(customer.xmobile);
    const secondary = formatPhone(customer.xtaxnum);

    return (
      <div
        key={customer.xcus || index}
        className="bg-[#fff7ed] border border-orange-100 p-3.5 rounded-[16px] shadow-[0_2px_10px_rgb(0,0,0,0.03)]"
      >
        {/* Header row */}
        <div className="flex items-start justify-between mb-2.5">
          <div className="flex items-start gap-2.5 flex-1 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-orange-100 border border-orange-200 flex items-center justify-center shrink-0">
              <User className="w-4 h-4 text-orange-500" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-[13px] font-bold text-text-main leading-tight truncate">
                {customer.xorg}
              </h3>
              <span className="inline-flex mt-0.5 px-1.5 py-0.5 rounded text-[8px] font-bold bg-white border border-orange-200 text-orange-700">
                {customer.xcus}
              </span>
            </div>
          </div>
        </div>

        {/* Address */}
        {customer.xadd1 && (
          <div className="flex items-start gap-1.5 mb-2.5 px-2.5 py-2 bg-white/60 rounded-[10px] border border-orange-50">
            <MapPin className="w-3 h-3 text-orange-400/80 shrink-0 mt-[1px]" />
            <p className="text-[10px] text-text-secondary leading-snug line-clamp-2">
              {customer.xadd1}
              {customer.xcity ? `, ${customer.xcity}` : ''}
            </p>
          </div>
        )}

        {/* Phone numbers */}
        {(primary || secondary) && (
          <div className="flex flex-col gap-1.5">
            {primary && (
              <a
                href={`tel:${primary}`}
                className="flex items-center gap-2 px-2.5 py-1.5 bg-emerald-50 border border-emerald-200 rounded-[10px] hover:bg-emerald-100 active:scale-[0.98] transition-all"
              >
                <div className="w-5 h-5 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                  <Phone className="w-3 h-3 text-emerald-600" />
                </div>
                <span className="text-[11px] font-bold text-emerald-700 flex-1">
                  {primary}
                </span>
                <span className="text-[8px] font-bold text-emerald-500 bg-emerald-100 px-1.5 py-0.5 rounded">
                  Primary
                </span>
              </a>
            )}
            {secondary && (
              <a
                href={`tel:${secondary}`}
                className="flex items-center gap-2 px-2.5 py-1.5 bg-blue-50 border border-blue-200 rounded-[10px] hover:bg-blue-100 active:scale-[0.98] transition-all"
              >
                <div className="w-5 h-5 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                  <Phone className="w-3 h-3 text-blue-600" />
                </div>
                <span className="text-[11px] font-bold text-blue-700 flex-1">
                  {secondary}
                </span>
                <span className="text-[8px] font-bold text-blue-500 bg-blue-100 px-1.5 py-0.5 rounded">
                  Secondary
                </span>
              </a>
            )}
          </div>
        )}
      </div>
    );
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="page-root">
      <Header title="Customer Master">
        <div className="mt-4">
          <BusinessTabs activeTab={activeTab} onChange={(tab) => { setActiveTab(tab); }} />
        </div>

        {/* Reuse the same CustomerSearch overlay from Create Order */}
        <div className="mt-3">
          <CustomerSearch
            zid={activeTab}
            employeeId={employeeId}
            value={selectedCustomer}
            onChange={setSelectedCustomer}
            placeholder="Search by ID, name, or area…"
          />
        </div>

        {/* Result count */}
        <p className="text-[10px] text-text-muted font-medium mt-2">
          {loading && !selectedCustomer
            ? 'Loading…'
            : selectedCustomer
            ? '1 customer selected'
            : `${customers.length} customer${customers.length !== 1 ? 's' : ''} loaded`}
        </p>
      </Header>

      {/* ── Main content ── */}
      <main className="flex-1 overflow-y-auto pb-24">
        <div className="page-content px-4 py-4">

          {/* ── Single selected customer view ── */}
          {selectedCustomer ? (
            <div className="card-grid">
              <CustomerCard customer={selectedCustomer} index={0} />
            </div>
          ) : loading && customers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-orange-500 opacity-50 mb-4" />
              <p className="text-[11px] font-bold text-text-muted">Loading customers…</p>
            </div>
          ) : customers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Users className="w-12 h-12 text-orange-200 mb-3" />
              <p className="text-[12px] font-bold text-text-muted">No customers found.</p>
            </div>
          ) : (
            // ── Paginated list ──
            <div className="card-grid">
              {customers.map((customer, i) => (
                <CustomerCard key={customer.xcus || i} customer={customer} index={i} />
              ))}

              {hasMore && customers.length > 0 && (
                <LoadMoreButton loading={loadingMore} onClick={loadMore} />
              )}
              {!hasMore && customers.length > 0 && (
                <div className="text-center mt-6 mb-2 text-[11px] text-orange-900/40 font-medium">
                  {customers.length} customers loaded.
                </div>
              )}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}