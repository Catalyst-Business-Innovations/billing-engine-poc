// Billable Services Models

export interface BillableService {
  id: number;
  appId: number | null;
  name: string;
  isSystemDefault: boolean;
  category: 'AppAccess' | 'AddOn' | 'Bundle';
  charges?: BillableServiceCharge[];
  bundleItems?: BillableServiceBundleItem[];
}

export interface BillableServiceCharge {
  id: number;
  billableServiceId: number;
  name: string;
  isSystemDefault: boolean;
  type: 'Flat' | 'PerSeat' | 'PerTransaction' | 'PercentageOfRevenue';
  frequency: 'PerBillingCycle' | 'OneTime';
  defaultValue: number;
  valueDataType: 'money' | 'percentage';
}

export interface BillableServiceBundleItem {
  id: number;
  billableServiceChildId: number;
  childService: BillableService;
  billableServiceParentId: number;
}
