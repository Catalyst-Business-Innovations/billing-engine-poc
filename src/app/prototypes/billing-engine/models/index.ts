// models/index.ts - Shared models and enums

// ─── Enums ────────────────────────────────────────────────────────────────────

export enum SubscriptionPlanType {
  Unknown = 0,
  Self = 1,
  SalesAssisted = 2
}

export enum Status {
  Unknown = 0,
  Draft = 1,
  Active = 2,
  Inactive = 3
}

export enum Apps {
  Unknown = 0,
  TPMPortal = 1,
  POS = 2,
  Donation = 3,
  Lister = 4,
  AdminPortal = 5,
  CompanyPortal = 6,
  Inventory = 7
}

// ─── Enum Display Maps ────────────────────────────────────────────────────────

export const SubscriptionPlanTypeLabels: Record<SubscriptionPlanType, string> = {
  [SubscriptionPlanType.Unknown]: 'Unknown',
  [SubscriptionPlanType.Self]: 'Self-Subscription',
  [SubscriptionPlanType.SalesAssisted]: 'Sales-Assisted Subscription'
};

export const StatusLabels: Record<Status, string> = {
  [Status.Unknown]: 'Unknown',
  [Status.Draft]: 'Draft',
  [Status.Active]: 'Active',
  [Status.Inactive]: 'Inactive'
};

export const AppLabels: Record<Apps, string> = {
  [Apps.Unknown]: 'Unknown',
  [Apps.TPMPortal]: 'TPM Portal',
  [Apps.POS]: 'POS',
  [Apps.Donation]: 'Donation',
  [Apps.Lister]: 'Lister',
  [Apps.AdminPortal]: 'Admin Portal',
  [Apps.CompanyPortal]: 'Company Portal',
  [Apps.Inventory]: 'Inventory'
};
