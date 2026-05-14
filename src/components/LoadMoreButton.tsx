import { Loader2, RefreshCw } from 'lucide-react';

interface LoadMoreButtonProps {
  loading: boolean;
  onClick: () => void;
}

/**
 * Reusable "Load More" button with loading state.
 * Replaces identical buttons in OrderHistory, DeliveryOrders, RecVoucher.
 */
export default function LoadMoreButton({ loading, onClick }: LoadMoreButtonProps) {
  return (
    <div className="flex justify-center mt-6 mb-2">
      <button
        onClick={onClick}
        disabled={loading}
        className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-white border border-orange-200 text-orange-600 font-bold text-[11px] shadow-sm hover:bg-orange-50 active:scale-95 transition-all disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin text-orange-600" />
        ) : (
          <RefreshCw className="w-4 h-4" />
        )}
        {loading ? 'Loading...' : 'Load More'}
      </button>
    </div>
  );
}
