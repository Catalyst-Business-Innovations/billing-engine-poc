export interface DiscountTypeOption {
  value: 'Percentage' | 'FlatAmount';
  label: string;
  description: string;
}

export enum DiscountFilterStatus {
  All = 'all',
  Active = 'active',
  Inactive = 'inactive',
  Expired = 'expired'
}
