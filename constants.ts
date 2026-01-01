
import { AppSettings, UserRole } from './types';

export const DEFAULT_SETTINGS: AppSettings = {
  companyName: 'Structura Chemicals Private Limited',
  companyShortName: 'SCPL',
  scplNtn: '1234567-8',
  logoUrl: '',
  gstRate: 0.18,
  srbRate: 0.15,
  categories: [
    'Admixture',
    'Curing',
    'Paints',
    'Grouts and adhesives',
    'Flooring',
    'water proofings',
    'Cementitious Flooring'
  ]
};

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  [UserRole.ADMIN]: ['*'],
  [UserRole.SALES]: ['customers:view', 'customers:edit', 'quotes:view', 'quotes:create'],
  [UserRole.TECHNICAL]: ['quotes:view', 'quotes:edit_technical'],
  [UserRole.COMMERCIAL]: ['quotes:view', 'quotes:approve', 'invoices:create'],
  [UserRole.VIEWER]: ['customers:view', 'quotes:view', 'invoices:view']
};

export const UOM_OPTIONS = ['EA', 'KG', 'LTR', 'SQFT', 'BAG', 'DRUM', 'PKG', 'MT', 'CFT', 'SMT'];

export const UOMS = ['Pcs', 'Kgs', 'Ltrs', 'Units', 'Service'];
export const CATEGORIES = DEFAULT_SETTINGS.categories;
