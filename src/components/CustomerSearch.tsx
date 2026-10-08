import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Loader2, User, MapPin } from 'lucide-react';
import { useDebounce } from '../hooks/useDebounce';
import { searchCustomers, Customer } from '../api_customers';

export interface CustomerSearchProps {
  zid: string | number;
  employeeId: string;
  value?: Customer | null;
  onChange: (customer: Customer | null) => void;
  placeholder?: string;
  disabled?: boolean;
}

/**
 * Hard ceiling for a single search request. If the server is slow or the
 * mobile network stalls, we abort and clear the spinner after this many ms
 * so the UI is NEVER stuck in an infinite-loading state.
 */
const REQUEST_TIMEOUT_MS = 15000;

export function CustomerSearch({
  zid,
  employeeId,
  value,
  onChange,
  placeholder = 'Search customer by ID, name, or area...',
  disabled = false
}: CustomerSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<Customer[]>([]);

  const fieldRef = useRef<HTMLInputElement>(null);
  const overlayInputRef = useRef<HTMLInputElement>(null);
  const debouncedQuery = useDebounce(query, 500);

  /**
   * The two refs below are the "single source of truth" for which fetch
   * is allowed to mutate state. Each new effect run gets a fresh
   * AbortController and an incremented request id. Stale closures lose
   * both races, so they can never resurrect the spinner.
   */
  const abortControllerRef = useRef<AbortController | null>(null);
  const fetchIdRef = useRef(0);

  // Helper to cancel whatever is currently in flight. Safe to call multiple times.
  const cancelInFlight = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    fetchIdRef.current += 1;
  };

  const displayText = value ? `${value.xcus} - ${value.xorg}` : '';

  const getBusinessName = (businessZid: string | number) => {
    const map: Record<string, string> = {
      '100000': 'GI',
      '100001': 'HMBR',
      '100005': 'Zepto',
    };
    return map[String(businessZid)] || String(businessZid);
  };

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const raf = window.requestAnimationFrame(() => {
      overlayInputRef.current?.focus();
    });

    return () => window.cancelAnimationFrame(raf);
  }, [isOpen]);

  // ─── Fetch logic ──────────────────────────────────────────────────────────
  useEffect(() => {
    // 1) Always tear down the previous fetch first.
    cancelInFlight();

    const trimmed = debouncedQuery.trim();

    // ─── FIX: Reset loading state when query becomes too short ───
    if (!isOpen || trimmed.length < 3 || disabled || !employeeId) {
      // If query is too short, clear results and ensure loading is false
      if (trimmed.length < 3) {
        setResults([]);
        // ─── CRITICAL FIX: Always set loading to false when query is too short ───
        setIsLoading(false);
      }
      return;
    }

    // 3) Set up the new fetch. Each gets its own AbortController and id.
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const fetchId = ++fetchIdRef.current;

    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    setIsLoading(true);

    const runFetch = async () => {
      try {
        const data = await searchCustomers(
          zid,
          employeeId,
          trimmed,
          10,
          0,
          controller.signal
        );
        // Bail if a newer fetch took over OR we were cancelled.
        if (controller.signal.aborted || fetchId !== fetchIdRef.current) {
          return;
        }
        setResults(
          Array.isArray(data) ? data : (data && (data as any).xcus ? [data] : [])
        );
      } catch (err: any) {
        // Aborted by us / by the user — not a real error, just leave state alone.
        if (
          err?.name === 'CanceledError' ||
          err?.code === 'ERR_CANCELED' ||
          controller.signal.aborted
        ) {
          return;
        }
        if (fetchId !== fetchIdRef.current) return;
        setResults([]);
      } finally {
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        // Only the currently-active fetch is allowed to clear the spinner.
        if (fetchId === fetchIdRef.current) {
          setIsLoading(false);
        }
      }
    };

    // 4) Hard ceiling. If the network is wedged, abort and unstick the UI.
    timeoutId = setTimeout(() => {
      if (fetchId === fetchIdRef.current && !controller.signal.aborted) {
        controller.abort();
        // Clear the spinner immediately so the user isn't left hanging.
        setIsLoading(false);
      }
    }, REQUEST_TIMEOUT_MS);

    runFetch();

    // 5) Cleanup runs when deps change OR component unmounts.
    return () => {
      controller.abort();
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    };
  }, [debouncedQuery, zid, employeeId, isOpen, disabled]);

  // ─── Component-level unmount safety net ──────────────────────────────────
  useEffect(() => {
    return () => {
      cancelInFlight();
    };
  }, []);

  const openOverlay = () => {
    if (disabled) {
      return;
    }
    cancelInFlight();
    setIsOpen(true);
    setQuery('');
    setResults([]);
    // ─── FIX: Ensure loading is false when opening overlay ───
    setIsLoading(false);
  };

  const closeOverlay = () => {
    cancelInFlight();
    setIsOpen(false);
    setQuery('');
    setResults([]);
    // ─── FIX: Ensure loading is false when closing overlay ───
    setIsLoading(false);
    fieldRef.current?.focus();
  };

  const clearSelection = () => {
    cancelInFlight();
    onChange(null);
    setQuery('');
    setResults([]);
    setIsLoading(false);
    fieldRef.current?.focus();
  };

  return (
    <div className="relative w-full">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
          <Search className="h-3.5 w-3.5 text-text-muted" />
        </div>
        <input
          ref={fieldRef}
          type="text"
          className={`appearance-none block w-full pl-8 pr-8 py-2 border rounded-lg text-text-main placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all duration-300 bg-white shadow-sm text-[11px] ${
            isOpen ? 'border-primary ring-2 ring-primary/20' : 'border-ui-border'
          } ${disabled ? 'opacity-60 cursor-not-allowed bg-gray-50' : ''}`}
          placeholder={placeholder}
          value={displayText}
          disabled={disabled}
          readOnly
          onClick={openOverlay}
        />

        <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center">
          {displayText ? (
            <button
              type="button"
              className="p-1 rounded-full text-text-muted hover:text-text-main hover:bg-gray-100 transition-colors focus:outline-none"
              onClick={clearSelection}
              disabled={disabled}
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-[110] bg-bg-base flex flex-col">
          <header className="flex items-center px-4 pt-8 pb-3 bg-bg-card shadow-[0_2px_10px_rgb(0,0,0,0.02)] z-10 rounded-b-2xl shrink-0">
            <button
              type="button"
              onClick={closeOverlay}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-bg-base text-text-secondary active:scale-95 transition-transform"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
            <h1 className="flex-1 text-center text-[13px] font-bold text-text-main pr-8">
              {getBusinessName(zid)} Customer
            </h1>
          </header>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                <Search className="h-3.5 w-3.5 text-text-muted" />
              </div>
              <input
                ref={overlayInputRef}
                type="text"
                className="appearance-none block w-full pl-8 pr-8 py-2 border rounded-lg text-text-main placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all duration-300 bg-white shadow-sm text-[11px] border-ui-border"
                placeholder={placeholder}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                disabled={disabled}
              />
              <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center">
                {isLoading ? (
                  <Loader2 className="h-3.5 w-3.5 text-primary animate-spin" />
                ) : query ? (
                  <button
                    type="button"
                    className="p-1 rounded-full text-text-muted hover:text-text-main hover:bg-gray-100 transition-colors focus:outline-none"
                    onClick={() => {
                      cancelInFlight();
                      setQuery('');
                      setResults([]);
                      setIsLoading(false);
                      overlayInputRef.current?.focus();
                    }}
                    aria-label="Clear"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                ) : null}
              </div>
            </div>

            <div className="w-full bg-white rounded-lg shadow-lg shadow-black/5 border border-ui-border/50 overflow-hidden">
              {isLoading && results.length === 0 ? (
                <div className="p-4 flex flex-col items-center justify-center text-text-muted">
                  <Loader2 className="w-5 h-5 text-primary animate-spin mb-2" />
                  <p className="text-[11px] font-medium">Searching customers...</p>
                </div>
              ) : results.length > 0 ? (
                <ul className="py-1.5 max-h-[70vh] overflow-y-auto">
                  {results.map((customer, index) => (
                    <li key={customer.xcus || index}>
                      <button
                        type="button"
                        className="w-full text-left px-3 py-2 hover:bg-primary/5 focus:bg-primary/5 focus:outline-none transition-colors border-b border-ui-border/30 last:border-0"
                        onClick={() => {
                          onChange(customer);
                          closeOverlay();
                        }}
                      >
                        <div className="flex items-start gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 text-primary mt-0.5">
                            <User className="w-3.5 h-3.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-0.5">
                              <p className="text-[12px] font-bold text-text-main truncate pr-2 mt-0.5">
                                {customer.xorg}
                              </p>
                              <span className="inline-flex px-1.5 py-0.5 rounded text-[8px] font-bold bg-gray-100 border border-gray-200 text-text-secondary shrink-0">
                                {customer.xcus}
                              </span>
                            </div>
                            {customer.xadd1 && (
                              <div className="flex items-start text-[10px] text-text-muted mt-0.5">
                                <MapPin className="w-2.5 h-2.5 mr-1 shrink-0 mt-[1px]" />
                                <span className="line-clamp-1 leading-snug">{customer.xadd1}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : query.trim().length < 3 ? (
                <div className="p-5 text-center text-text-muted">
                  <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-2.5 border border-gray-100">
                    <Search className="w-4 h-4 text-gray-300" />
                  </div>
                  <p className="text-[12px] font-bold text-text-main">Type at least 3 characters</p>
                  <p className="text-[10px] mt-1">Search by ID, Name or Area</p>
                </div>
              ) : !isLoading && debouncedQuery === query ? (
                <div className="p-5 text-center text-text-muted">
                  <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-2.5 border border-gray-100">
                    <Search className="w-4 h-4 text-gray-400" />
                  </div>
                  <p className="text-[12px] font-bold text-text-main">No customer found</p>
                  <p className="text-[10px] mt-1">Try searching with a different ID or name</p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}