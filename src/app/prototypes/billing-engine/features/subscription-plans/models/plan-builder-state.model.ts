// Plan Builder State Models

export interface PlanChargeState {
  chargeId: number;
  chargeName: string;
  type: string;
  frequency: string;
  dataType: string;
  originalValue: number;
  overriddenValue: number | null;
  includedSeats: number | null;
}

export interface PlanServiceState {
  serviceId: number;
  serviceName: string;
  category: string;
  appId: number | null;
  charges: PlanChargeState[];
  addons: PlanServiceState[];
}

export interface PlanBuilderState {
  planName: string;
  selectedApps: number[]; // BillableService ids (AppAccess)
  selectedAddons: number[]; // BillableService ids (AddOn/Bundle) per app
  serviceStates: { [serviceId: number]: PlanServiceState };
}
