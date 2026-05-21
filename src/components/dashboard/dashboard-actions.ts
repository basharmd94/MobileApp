import { 
  MessageSquare, Receipt, Package, 
  RotateCcw, List, Sparkles,
  Clock, CheckCircle2, Ban,
  type LucideIcon 
} from 'lucide-react';

export interface ActionConfig {
  id: string;
  icon: LucideIcon;
  label: string;
  color: 'blue' | 'orange' | 'purple' | 'yellow' | 'green' | 'red' | 'cyan' | 'teal' | 'indigo';
  route?: string;
  onClick?: () => void;
}

export const DASHBOARD_ACTIONS: ActionConfig[][] = [
  // Row 1 — Order Placing
  [
    { id: 'pending', icon: Clock,        label: 'Pending', color: 'yellow', route: '/all-pending-orders' },
    { id: 'confirm', icon: CheckCircle2, label: 'Confirm', color: 'green',  route: '/all-confirmed-orders' },
    { id: 'cancel',  icon: Ban,          label: 'Cancel',  color: 'red',    route: '/cancelled-orders' },
  ],
  // Row 2 — Delivery & Rec
  [
    { id: 'delivery',    icon: Package,       label: 'Delivery',    color: 'purple', route: '/delivery-orders' },
    { id: 'rec-voucher', icon: Receipt,       label: 'Rec Voucher', color: 'orange', route: '/rec-voucher' },
    { id: 'feedback',    icon: MessageSquare, label: 'Feedback',    color: 'blue',   route: '/feedback' },
  ],
  // Row 3 — Return
  [
    { id: 'return',      icon: RotateCcw, label: 'Return',      color: 'cyan', route: '/delivery-orders' },
    { id: 'return-list', icon: List,      label: 'Return List', color: 'teal', route: '/return-list' },
    { id: 'coming-soon', icon: Sparkles,  label: 'Coming Soon', color: 'indigo', },
  ],
];