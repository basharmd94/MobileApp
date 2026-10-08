import {
  MessageSquare, Receipt, Package,
  RotateCcw, List, Sparkles,
  Clock, CheckCircle2, Ban,
  Users, Box, Truck, ShoppingBag,
  ClipboardList, ClipboardCheck,
  type LucideIcon
} from 'lucide-react';

export type ActionColor =
  | 'blue' | 'orange' | 'purple' | 'yellow' | 'green'
  | 'red' | 'cyan' | 'teal' | 'indigo';

export interface ActionConfig {
  id: string;
  icon: LucideIcon;
  label: string;
  color: ActionColor;
  route?: string;
  onClick?: () => void;
  comingSoon?: boolean;
}

export interface ActionRowMeta {
  id: string;
  label: string;
  icon: LucideIcon;
  iconColor: string;        // tailwind text-* class for the row icon
  dotClass: string;         // tailwind bg-* class for the decorative blob
  accentBar: string;        // tailwind bg-* class for the left accent bar
  gradientClass: string;    // tailwind bg-gradient-to-br ... class
}

export const ACTION_ROW_META: ActionRowMeta[] = [
  {
    id: 'order-placing',
    label: 'Order Placing',
    icon: ShoppingBag,
    iconColor: 'text-amber-600',
    dotClass: 'bg-amber-400',
    accentBar: 'bg-gradient-to-b from-amber-400 to-amber-600',
    gradientClass: 'from-amber-50/90 via-amber-50/30 to-transparent',
  },
  {
    id: 'delivery-rec',
    label: 'Delivery & Rec',
    icon: Truck,
    iconColor: 'text-indigo-600',
    dotClass: 'bg-indigo-400',
    accentBar: 'bg-gradient-to-b from-indigo-400 to-indigo-600',
    gradientClass: 'from-indigo-50/90 via-indigo-50/30 to-transparent',
  },
  {
    id: 'return',
    label: 'Return',
    icon: RotateCcw,
    iconColor: 'text-emerald-600',
    dotClass: 'bg-emerald-400',
    accentBar: 'bg-gradient-to-b from-emerald-400 to-emerald-600',
    gradientClass: 'from-emerald-50/90 via-emerald-50/30 to-transparent',
  },
  {
    id: 'customer-items',
    label: 'Customer & Items',
    icon: Users,
    iconColor: 'text-blue-600',
    dotClass: 'bg-blue-400',
    accentBar: 'bg-gradient-to-b from-blue-400 to-blue-600',
    gradientClass: 'from-blue-50/90 via-blue-50/30 to-transparent',
  },
];

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
  // Row 3 — Return & Masters
  [
    { id: 'return',           icon: RotateCcw,      label: 'Return',           color: 'cyan',   route: '/delivery-orders' },
    { id: 'pending-returns',  icon: ClipboardList,  label: 'Pending Returns',  color: 'orange', route: '/pending-returns' },
    { id: 'approved-returns', icon: ClipboardCheck, label: 'Approved Returns', color: 'teal',   route: '/approved-returns' },
  ],
  // Row 4 — Master Data
  [
    { id: 'customers',     icon: Users,   label: 'Customers',   color: 'blue',   route: '/customers' },
    { id: 'items',         icon: Box,     label: 'Items',       color: 'teal',   route: '/items' },
    { id: 'coming-soon-2', icon: Sparkles, label: 'Coming Soon', color: 'indigo', comingSoon: true },
  ],
];
