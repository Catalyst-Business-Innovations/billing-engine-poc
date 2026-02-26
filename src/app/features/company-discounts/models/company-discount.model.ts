import { Company } from './company.interface';

export interface CompanyDiscount {
  id: number;
  companyId: number;
  company: Company;
  discountType: 'Percentage' | 'FlatAmount';
  discountValue: number;
  effectiveStartDate: string;
  effectiveEndDate: string | null;
  reason: string;
  notes?: string;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  modifiedBy?: string;
  modifiedAt?: string;
}
