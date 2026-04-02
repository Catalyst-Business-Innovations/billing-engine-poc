// Subscription Plans Models
import { Status, SubscriptionPlanType } from '../../../models';
import { BillableService, BillableServiceCharge } from '../../billable-services/models';

export interface SubscriptionPlan {
  id: number;
  name: string;
  description?: string;
  status: Status;
  canShowOnWebsite: boolean;
  type: SubscriptionPlanType;
  companyId: number;
  subscriptionCount: number;
  items?: SubscriptionPlanItem[];
}

export interface SubscriptionPlanItem {
  id: number;
  subscriptionPlanId: number;
  billableServiceId: number;
  service: BillableService;
  values?: SubscriptionPlanItemValue[];
}

export interface SubscriptionPlanItemValue {
  id: number;
  subscriptionPlanItemId: number;
  billableServiceChargeId: number;
  charge: BillableServiceCharge;
  originalValue: number;
  overriddenValue: number | null;
  includedSeats: number | null;
}
