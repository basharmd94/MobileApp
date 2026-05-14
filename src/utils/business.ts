/**
 * Centralized business configuration.
 * Single source of truth for business ID → name/color mappings.
 */

export interface BusinessInfo {
  name: string;
  badgeColor: string;
}

export const BUSINESSES: Record<string, BusinessInfo> = {
  '100000': { name: 'GI',    badgeColor: 'text-emerald-800 bg-emerald-100/80 border-emerald-200' },
  '100001': { name: 'HMBR',  badgeColor: 'text-blue-800 bg-blue-100/80 border-blue-200' },
  '100005': { name: 'Zepto', badgeColor: 'text-purple-800 bg-purple-100/80 border-purple-200' },
};

export const BUSINESS_TABS = [
  { id: '100001', label: 'HMBR' },
  { id: '100000', label: 'GI' },
  { id: '100005', label: 'Zepto' },
];

export const getBusinessName = (zid: string | number): string =>
  BUSINESSES[String(zid)]?.name || 'Unknown';

export const getBusinessBadgeColor = (zid: string | number): string =>
  BUSINESSES[String(zid)]?.badgeColor || 'text-orange-800 bg-orange-100/80 border-orange-200';
