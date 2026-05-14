import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Plus, Send, User } from 'lucide-react';

interface NavItem {
  id: string;
  icon: any;
  label: string;
  primary?: boolean;
  route?: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Home' },
  { id: 'sales', icon: ShoppingCart, label: 'Sales' },
  { id: 'add', icon: Plus, label: 'Add', primary: true, route: '/add' },
  { id: 'send_orders', icon: Send, label: 'Send' },
  { id: 'profile', icon: User, label: 'Profile', route: '/profile' },
];

interface MobileBottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  pendingCount: number;
}

export default function MobileBottomNav({ activeTab, onTabChange, pendingCount }: MobileBottomNavProps) {
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-ui-border/50 flex justify-around items-center h-16 pb-[env(safe-area-inset-bottom,8px)] px-2 z-50 shadow-[0_-4px_24px_rgb(0,0,0,0.04)] rounded-t-[16px] max-w-md mx-auto">
      {NAV_ITEMS.map((item) =>
        item.primary ? (
          <button
            key={item.id}
            onClick={() => navigate(item.route || '/add')}
            className="relative -top-3 w-10 h-10 bg-gradient-to-br from-primary to-primary-hover rounded-full flex items-center justify-center text-white shadow-lg shadow-primary/30 transform transition-transform active:scale-95"
          >
            <item.icon className="w-5 h-5" />
          </button>
        ) : (
          <button
            key={item.id}
            onClick={() => item.route ? navigate(item.route) : onTabChange(item.id)}
            className={`flex flex-col items-center gap-1 w-12 pt-1 transition-colors relative ${
              activeTab === item.id ? 'text-primary' : 'text-text-muted hover:text-text-main'
            }`}
          >
            <div className="relative">
              <item.icon
                className={`w-4 h-4 ${activeTab === item.id ? 'fill-primary/20' : ''}`}
                strokeWidth={activeTab === item.id ? 2.5 : 2}
              />
              {item.id === 'send_orders' && pendingCount > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-red-500 text-white text-[8px] font-bold px-1 min-w-[14px] h-[14px] flex items-center justify-center rounded-full border border-white">
                  {pendingCount}
                </span>
              )}
            </div>
            <span
              className={`text-[9px] font-bold leading-tight ${
                activeTab === item.id ? 'text-primary' : 'text-text-muted'
              }`}
            >
              {item.label}
            </span>
          </button>
        )
      )}
    </nav>
  );
}