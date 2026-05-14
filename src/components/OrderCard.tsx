import React from 'react';
import { User, Minus, Plus, Trash2, Send } from 'lucide-react';
import { getBusinessName, getBusinessBadgeColor } from '../utils/business';

interface OrderItem {
  xitem: string;
  xdesc: string;
  xprice: number;
  xqty: number;
  xlinetotal: number;
}

interface OrderCardProps {
  /** Customer display name */
  customerName: string;
  /** Customer code */
  customerCode: string;
  /** Business ZID (shown as a badge when provided) */
  zid?: number | string;
  /** List of items in this order */
  items: OrderItem[];
  /** Called when the primary action button is pressed (Send/Place) */
  onPrimaryAction?: () => void;
  /** Primary action button label */
  primaryActionLabel?: string;
  /** Called when the delete-all button is pressed */
  onRemoveAll?: () => void;
  /** Called when item quantity changes: (itemCode, delta) */
  onUpdateQuantity?: (itemCode: string, delta: number) => void;
  /** Called when a single item is removed */
  onRemoveItem?: (itemCode: string) => void;
  /** Whether actions are disabled (e.g. while sending) */
  disabled?: boolean;
}

/**
 * Reusable order card component.
 * Used in both the Cart (OrderPage) and Pending Orders (Home) views.
 * Groups items under a customer header with action buttons.
 */
export default function OrderCard({
  customerName,
  customerCode,
  zid,
  items,
  onPrimaryAction,
  primaryActionLabel = 'Send',
  onRemoveAll,
  onUpdateQuantity,
  onRemoveItem,
  disabled = false,
}: OrderCardProps) {
  const orderTotal = items.reduce((sum, item) => sum + item.xlinetotal, 0);

  return (
    <div className="bg-orange-50/60 border border-orange-200/60 rounded-[14px] overflow-hidden">
      {/* ─── Customer Header ─── */}
      <div className="flex items-center justify-between px-3 py-2 bg-orange-100/50 border-b border-orange-200/40">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-6 h-6 rounded-full bg-orange-200/60 flex items-center justify-center shrink-0">
            <User className="w-3 h-3 text-orange-600" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              {zid && (
                <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${getBusinessBadgeColor(zid)}`}>
                  {getBusinessName(zid)}
                </span>
              )}
              <p className="text-[11px] font-bold text-text-main truncate">{customerName}</p>
            </div>
            <p className="text-[9px] text-text-muted font-medium">{customerCode}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] font-bold text-primary">৳{orderTotal.toLocaleString()}</span>
          {onPrimaryAction && (
            <button
              onClick={onPrimaryAction}
              disabled={disabled}
              className="w-7 h-7 flex items-center justify-center rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-50"
              title={primaryActionLabel}
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          )}
          {onRemoveAll && (
            <button
              onClick={onRemoveAll}
              disabled={disabled}
              className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors disabled:opacity-50"
              title="Remove all items"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ─── Items ─── */}
      <div className="p-2 space-y-1.5">
        {items.map((item, idx) => (
          <div key={idx} className="flex justify-between items-start bg-white p-2 rounded-lg border border-ui-border/30 shadow-sm">
            <div className="flex-1 min-w-0 pr-2">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="inline-flex px-1 py-0.5 rounded text-[8px] font-bold bg-gray-100 text-text-secondary shrink-0">
                  {item.xitem}
                </span>
              </div>
              <p className="text-[11px] font-bold text-text-main leading-snug line-clamp-2">{item.xdesc}</p>
              <p className="text-[9px] text-text-muted mt-1 font-medium">৳{item.xprice} x {item.xqty}</p>
            </div>
            <div className="flex flex-col items-end shrink-0 gap-2">
              <span className="text-[11px] font-bold text-text-main">
                ৳{item.xlinetotal.toLocaleString()}
              </span>
              {(onUpdateQuantity || onRemoveItem) && (
                <div className="flex items-center gap-1 mt-auto">
                  {onUpdateQuantity && (
                    <div className="flex items-center border border-ui-border rounded overflow-hidden">
                      <button
                        onClick={() => onUpdateQuantity(item.xitem, -1)}
                        disabled={disabled}
                        className="w-5 h-5 flex items-center justify-center bg-gray-50 hover:bg-gray-100 text-text-main transition-colors disabled:opacity-50"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-5 text-center text-[9px] font-medium text-text-main">
                        {item.xqty}
                      </span>
                      <button
                        onClick={() => onUpdateQuantity(item.xitem, 1)}
                        disabled={disabled}
                        className="w-5 h-5 flex items-center justify-center bg-gray-50 hover:bg-gray-100 text-text-main transition-colors disabled:opacity-50"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  {onRemoveItem && (
                    <button
                      onClick={() => onRemoveItem(item.xitem)}
                      disabled={disabled}
                      className="w-6 h-6 flex items-center justify-center rounded bg-red-50 text-red-500 hover:bg-red-100 transition-colors ml-1 disabled:opacity-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ─── Footer ─── */}
      <div className="flex items-center justify-between px-3 py-1.5 border-t border-orange-200/40 bg-orange-50/40">
        <p className="text-[9px] text-text-muted font-medium">{items.length} item{items.length !== 1 ? 's' : ''}</p>
        <p className="text-[10px] font-bold text-primary">৳{orderTotal.toLocaleString()}</p>
      </div>
    </div>
  );
}
