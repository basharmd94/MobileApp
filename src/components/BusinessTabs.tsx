import { BUSINESS_TABS } from '../utils/business';

interface BusinessTabsProps {
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

/**
 * Reusable HMBR | GI | Zepto tab selector.
 * Replaces identical tab bars in OrderHistory, DeliveryOrders, RecVoucher.
 */
export default function BusinessTabs({ activeTab, onChange, className = '' }: BusinessTabsProps) {
  return (
    <div className={`flex bg-[#fff7ed] rounded-xl p-1 border border-orange-100 shadow-sm ${className}`}>
      {BUSINESS_TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`flex-1 py-1.5 text-[12px] font-bold rounded-lg transition-colors ${
            activeTab === tab.id
              ? 'bg-white text-orange-600 shadow-[0_2px_8px_rgb(251,146,60,0.15)] border border-orange-200'
              : 'text-orange-900/60 hover:text-orange-800'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
