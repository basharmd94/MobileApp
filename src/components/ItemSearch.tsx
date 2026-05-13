import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Loader2, Package, AlertCircle, CheckCircle2, Circle, Tag } from 'lucide-react';
import { useDebounce } from '../hooks/useDebounce';
import { searchItems, Item } from '../api_items';

export interface ItemSearchProps {
  zid: string | number;
  value?: Item | null;
  onChange: (item: Item | null) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function ItemSearch({
  zid,
  value,
  onChange,
  placeholder = 'Search item by name...',
  disabled = false
}: ItemSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const debouncedQuery = useDebounce(query, 500);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /**
   * Get stock status based on quantity
   */
  const getStockStatus = (stock: number | null | undefined): { 
    label: string; 
    color: string; 
    bgColor: string;
    icon: React.ReactNode;
  } => {
    // Handle null, undefined, or 0 stock
    if (stock === null || stock === undefined || stock === 0) {
      return {
        label: 'No Stock',
        color: 'text-red-600',
        bgColor: 'bg-red-50 border-red-200',
        icon: <AlertCircle className="w-3 h-3" />
      };
    }
    
    // Low stock (1-30)
    if (stock <= 30) {
      return {
        label: 'Low Stock',
        color: 'text-amber-600',
        bgColor: 'bg-amber-50 border-amber-200',
        icon: <Circle className="w-3 h-3" />
      };
    }
    
    // Medium stock (31-100)
    if (stock <= 100) {
      return {
        label: 'In Stock',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50 border-blue-200',
        icon: <Circle className="w-3 h-3" />
      };
    }
    
    // Full stock (>100)
    return {
      label: 'Full Stock',
      color: 'text-green-600',
      bgColor: 'bg-green-50 border-green-200',
      icon: <CheckCircle2 className="w-3 h-3" />
    };
  };

  /**
   * Format discount amount with safety check
   */
  const formatDiscount = (discAmt: number | null | undefined): string | null => {
    if (discAmt === null || discAmt === undefined || discAmt === 0) {
      return null;
    }
    return `৳${discAmt.toFixed(2)}`;
  };

  /**
   * Format minimum discount quantity with safety check
   */
  const formatMinDiscQty = (minQty: number | null | undefined): string | null => {
    if (minQty === null || minQty === undefined || minQty === 0) {
      return null;
    }
    return `Min ${minQty}`;
  };

  /**
   * Get discount info display
   */
  const getDiscountInfo = (item: Item): string | null => {
    const discAmt = formatDiscount(item.disc_amt);
    const minQty = formatMinDiscQty(item.min_disc_qty);
    
    if (discAmt && minQty) {
      return `${discAmt} (${minQty})`;
    } else if (discAmt) {
      return discAmt;
    } else if (minQty) {
      return minQty;
    }
    return null;
  };

  // Sync with controlled value
  useEffect(() => {
    if (value) {
      setQuery(`${value.item_id} - ${value.item_name}`);
    }
  }, [value]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch logic
  useEffect(() => {
    if (!isOpen || debouncedQuery.trim().length < 2 || disabled) {
      if (debouncedQuery.trim().length < 2) {
        setResults([]);
      }
      return;
    }
    
    // Only search if the query doesn't perfectly match the selected item
    if (value && query === `${value.item_id} - ${value.item_name}`) {
      return;
    }

    let isActive = true;

    const fetchItems = async () => {
      setIsLoading(true);
      try {
        const data = await searchItems(zid, debouncedQuery.trim());
        if (isActive) {
          setResults(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (isActive) {
          setResults([]);
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    fetchItems();
    
    return () => {
      isActive = false;
    };
  }, [debouncedQuery, zid, isOpen, disabled, value, query]);

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
          <Search className="h-3.5 w-3.5 text-text-muted" />
        </div>
        <input
          ref={inputRef}
          type="text"
          className={`appearance-none block w-full pl-8 pr-8 py-2 border rounded-lg text-text-main placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all duration-300 bg-white shadow-sm text-[11px] ${
            isOpen ? 'border-primary ring-2 ring-primary/20' : 'border-ui-border'
          } ${disabled ? 'opacity-60 cursor-not-allowed bg-gray-50' : ''}`}
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            if (value && e.target.value !== `${value.item_id} - ${value.item_name}`) {
              onChange(null);
            }
          }}
          onClick={() => {
            if (!disabled) setIsOpen(true);
          }}
        />
        
        <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center">
          {isLoading ? (
             <Loader2 className="h-3.5 w-3.5 text-primary animate-spin" />
          ) : query ? (
            <button 
              type="button" 
              className="text-text-muted hover:text-text-main focus:outline-none p-1 rounded-md hover:bg-gray-100"
              onClick={() => {
                setQuery('');
                setResults([]);
                setIsOpen(false);
                onChange(null);
                inputRef.current?.focus();
              }}
              disabled={disabled}
            >
               <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>
      </div>

      {isOpen && query.trim().length > 0 && (
        <div className="absolute mt-1.5 w-full bg-white rounded-lg shadow-lg shadow-black/5 border border-ui-border/50 overflow-hidden z-50 max-h-[280px] overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
          {isLoading && results.length === 0 ? (
             <div className="p-4 flex flex-col items-center justify-center text-text-muted">
                <Loader2 className="w-5 h-5 text-primary animate-spin mb-2" />
                <p className="text-[11px] font-medium">Searching items...</p>
             </div>
          ) : results.length > 0 ? (
            <ul className="py-1.5">
              {results.map((item, index) => {
                const stockStatus = getStockStatus(item.stock);
                const discountInfo = getDiscountInfo(item);
                
                return (
                  <li key={item.item_id || index}>
                    <button
                      type="button"
                      className="w-full text-left px-3 py-2 hover:bg-primary/5 focus:bg-primary/5 focus:outline-none transition-colors border-b border-ui-border/30 last:border-0"
                      onClick={() => {
                        onChange(item);
                        setQuery(`${item.item_id} - ${item.item_name}`);
                        setIsOpen(false);
                        setResults([]);
                      }}
                    >
                      <div className="flex items-start gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 text-primary mt-0.5">
                          <Package className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          {/* Row 1: Item ID, Name, Price */}
                          <div className="flex justify-between items-start mb-1">
                            <div className="flex items-center gap-1.5 min-w-0 pr-2">
                              <span className="inline-flex px-1.5 py-0.5 rounded text-[8px] font-bold bg-gray-100 border border-gray-200 text-text-secondary shrink-0">
                                {item.item_id}
                              </span>
                              <p className="text-[12px] font-bold text-text-main truncate">
                                {item.item_name}
                              </p>
                            </div>
                            <span className="inline-flex px-1.5 py-0.5 rounded text-[8px] font-bold bg-green-100 border border-green-200 text-green-700 shrink-0">
                              ৳{item.std_price}
                            </span>
                          </div>
                          
                          {/* Row 2: Group, Discount Info, Stock Status */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] text-text-muted">{item.item_group}</span>
                            
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
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : query.trim().length < 2 ? (
            <div className="p-5 text-center text-text-muted">
              <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-2.5 border border-gray-100">
                <Search className="w-4 h-4 text-gray-300" />
              </div>
              <p className="text-[12px] font-bold text-text-main">Type at least 2 characters</p>
              <p className="text-[10px] mt-1">Search by item name</p>
            </div>
          ) : !isLoading && debouncedQuery === query ? (
            <div className="p-5 text-center text-text-muted">
              <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-2.5 border border-gray-100">
                <Search className="w-4 h-4 text-gray-400" />
              </div>
              <p className="text-[12px] font-bold text-text-main">No items found</p>
              <p className="text-[10px] mt-1">Try searching with a different name</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}