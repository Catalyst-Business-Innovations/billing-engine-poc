import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { BillableServiceService } from '../../billable-services/services/billable-service.service';
import { SubscriptionPlanService } from '../services/subscription-plan.service';
import { BillableService } from '../../billable-services/models';
import { PlanServiceState, PlanChargeState } from '../models';
import { Apps, AppLabels } from '../../../models';

@Component({
  selector: 'app-plan-builder',
  templateUrl: './plan-builder.component.html',
  styleUrls: ['./plan-builder.component.scss']
})
export class PlanBuilderComponent implements OnInit {
  @Input() planId: number | null = null;
  @Input() duplicateFromPlanId: number | null = null;
  @Output() closeDrawer = new EventEmitter<void>();
  // Form fields
  planName = '';
  planDesc = '';
  billingCycle = 'monthly';
  currency = 'USD';
  planType = 'self';
  showOnPortal = false;

  // Selection state
  selectedAppIds: Set<number> = new Set();
  selectedAddonIds: Set<number> = new Set();
  serviceStates: Map<number, PlanServiceState> = new Map();

  // Data
  appServices: BillableService[] = [];
  addonServices: BillableService[] = [];
  availableAddons: BillableService[] = [];

  // UI
  showJsonPanel = false;
  jsonOutput = '';
  addonSearchText = '';
  addonGroupsExpanded: { [key: string]: boolean } = {
    Global: true,
    '1': true, // TPM Portal
    '2': true, // POS
    '4': true // Lister
  };
  showConfirmDialog = false;

  // Plan-level pricing tiers
  planTierOverrides: { [key: string]: number | null } = {
    monthly: null,
    ypay: null,
    yprepaid: null
  };

  // Discount types and values for each tier
  tierDiscountTypes: { [key: string]: 'percentage' | 'amount' } = {
    monthly: 'percentage',
    ypay: 'percentage',
    yprepaid: 'percentage'
  };

  tierDiscountValues: { [key: string]: number } = {
    monthly: 0,
    ypay: 10,
    yprepaid: 15
  };

  pricingTiers = [
    { id: 'monthly', label: 'Monthly', cls: 'tier-monthly' },
    { id: 'ypay', label: 'Yearly, Paid Monthly', cls: 'tier-ypay' },
    { id: 'yprepaid', label: 'Yearly, Prepaid', cls: 'tier-yprepaid' }
  ];

  constructor(
    private billableServiceService: BillableServiceService,
    private subscriptionPlanService: SubscriptionPlanService
  ) {}

  ngOnInit(): void {
    this.billableServiceService.loadData().subscribe(() => {
      this.appServices = this.billableServiceService.getAppAccessServices();
      this.addonServices = this.billableServiceService.getAddonServices();
      this.updateAvailableAddons();

      // Load plan data if editing
      if (this.planId) {
        this.loadPlanData();
      }
      // Load plan data for duplication (add mode with pre-populated data)
      else if (this.duplicateFromPlanId) {
        this.loadPlanDataForDuplication();
      }
    });
  }

  loadPlanData(): void {
    if (!this.planId) return;

    this.subscriptionPlanService.getPlanById(this.planId).subscribe(plan => {
      if (!plan) {
        console.error('Plan not found:', this.planId);
        return;
      }

      console.log('Loading plan data for edit:', plan);
      this.populatePlanData(plan, false);
    });
  }

  loadPlanDataForDuplication(): void {
    if (!this.duplicateFromPlanId) return;

    this.subscriptionPlanService.getPlanById(this.duplicateFromPlanId).subscribe(plan => {
      if (!plan) {
        console.error('Plan not found for duplication:', this.duplicateFromPlanId);
        return;
      }

      console.log('Loading plan data for duplication:', plan);
      this.populatePlanData(plan, true);
    });
  }

  private populatePlanData(plan: any, isDuplication: boolean): void {
    // Load basic plan properties
    this.planName = isDuplication ? `${plan.name} (Copy)` : plan.name;
    this.planDesc = plan.description || '';
    this.planType = plan.type === 1 ? 'self' : 'sales-assisted';
    this.showOnPortal = plan.canShowOnWebsite;

    // Load plan items (services and their charges)
    if (plan.items && plan.items.length > 0) {
      plan.items.forEach((item: any) => {
        // Handle both full nested structure and simplified structure
        let service = item.service;
        const serviceId = item.billableServiceId;

        // If service object is not provided, look it up from billableServiceService
        if (!service && serviceId) {
          const allServices = this.billableServiceService.getBillableServices();
          const foundService = allServices.find(s => s.id === serviceId);
          if (foundService) {
            service = foundService;
          }
        }

        if (!service) {
          console.warn('Service not found for item:', item);
          return;
        }

        // Add to selected apps or addons
        if (service.category === 'AppAccess') {
          this.selectedAppIds.add(service.id);
        } else {
          this.selectedAddonIds.add(service.id);
        }

        // Build service state with charges
        const serviceState: PlanServiceState = {
          serviceId: service.id,
          serviceName: service.name,
          category: service.category,
          appId: service.appId,
          charges: [],
          addons: []
        };

        // Load charge states from item values
        if (item.values && item.values.length > 0) {
          item.values.forEach((value: any) => {
            // Handle both full nested structure and simplified structure
            let charge = value.charge;
            const chargeId = value.billableServiceChargeId;

            // If charge object is not provided, look it up from service charges
            if (!charge && chargeId && service) {
              const foundCharge = service.charges?.find((c: any) => c.id === chargeId);
              if (foundCharge) {
                charge = foundCharge;
              }
            }

            if (!charge) {
              console.warn('Charge not found for value:', value);
              return;
            }

            const chargeState: PlanChargeState = {
              chargeId: charge.id,
              chargeName: charge.name,
              type: charge.type,
              frequency: charge.frequency,
              dataType: charge.valueDataType,
              originalValue: value.originalValue,
              overriddenValue: value.overriddenValue,
              includedSeats: value.includedSeats ?? null
            };

            serviceState.charges.push(chargeState);
          });
        }

        this.serviceStates.set(service.id, serviceState);
      });
    }

    console.log('Loaded service states:', this.serviceStates);
    console.log('Selected apps:', Array.from(this.selectedAppIds));
    console.log('Selected addons:', Array.from(this.selectedAddonIds));

    // Update available addons after loading selections
    this.updateAvailableAddons();
    this.refreshJson();
  }

  // ─── Available Add-ons ───────────────────────────────────────────────────────
  updateAvailableAddons(): void {
    const selectedAppIdStrings = Array.from(this.selectedAppIds).map(id => {
      const app = this.appServices.find(a => a.id === id);
      return app?.appId;
    });

    // Show global add-ons (appId: null) and add-ons for selected apps
    this.availableAddons = this.addonServices.filter(addon => {
      if (addon.appId === null) return true; // Global add-on
      return selectedAppIdStrings.includes(addon.appId); // App-specific add-on
    });
  }

  // Filter add-ons by search text
  getFilteredAddons(): BillableService[] {
    if (!this.addonSearchText.trim()) {
      return this.availableAddons;
    }
    const searchLower = this.addonSearchText.toLowerCase();
    return this.availableAddons.filter(addon => addon.name.toLowerCase().includes(searchLower));
  }

  // Group add-ons by app
  getGroupedAddons(): { [key: string]: BillableService[] } {
    const filtered = this.getFilteredAddons();
    const groups: { [key: string]: BillableService[] } = {
      Global: [],
      '1': [], // TPM Portal
      '2': [], // POS
      '4': [] // Lister
    };

    filtered.forEach(addon => {
      const groupKey = addon.appId !== null ? addon.appId.toString() : 'Global';
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(addon);
    });

    return groups;
  }

  getGroupKeys(): string[] {
    const groups = this.getGroupedAddons();
    return Object.keys(groups).filter(key => groups[key].length > 0);
  }

  toggleAddonGroup(groupKey: string): void {
    this.addonGroupsExpanded[groupKey] = !this.addonGroupsExpanded[groupKey];
  }

  isAddonGroupExpanded(groupKey: string): boolean {
    return this.addonGroupsExpanded[groupKey] !== false;
  }

  getAddonGroupName(groupKey: string): string {
    if (groupKey === 'Global') return 'Global';
    const appId = parseInt(groupKey, 10);
    return AppLabels[appId as Apps] || groupKey;
  }

  // ─── Plan Type ───────────────────────────────────────────────────────────────
  selectPlanType(type: string): void {
    this.planType = type;
    this.refreshJson();
  }

  handleCancel(): void {
    if (this.selectedAppIds.size + this.selectedAddonIds.size > 0 || this.planName.trim()) {
      this.showConfirmDialog = true;
    } else {
      this.closeDrawer.emit();
    }
  }

  onConfirmDiscard(): void {
    this.showConfirmDialog = false;
    this.closeDrawer.emit();
  }

  onCancelDiscard(): void {
    this.showConfirmDialog = false;
  }

  // ─── App Selection ───────────────────────────────────────────────────────────
  toggleApp(serviceId: number): void {
    if (this.selectedAppIds.has(serviceId)) {
      this.selectedAppIds.delete(serviceId);
      this.serviceStates.delete(serviceId);

      // Remove app-specific add-ons when app is deselected
      const app = this.appServices.find(a => a.id === serviceId);
      if (app) {
        const appSpecificAddons = this.addonServices.filter(addon => addon.appId === app.appId);
        appSpecificAddons.forEach(addon => {
          if (this.selectedAddonIds.has(addon.id)) {
            this.selectedAddonIds.delete(addon.id);
            this.serviceStates.delete(addon.id);
          }
        });
      }
    } else {
      this.selectedAppIds.add(serviceId);
      const svc = this.appServices.find(s => s.id === serviceId)!;
      this.serviceStates.set(serviceId, this.billableServiceService.buildServiceState(svc));
    }
    this.updateAvailableAddons();
    this.refreshJson();
  }

  isAppSelected(id: number): boolean {
    return this.selectedAppIds.has(id);
  }

  // ─── Addon Selection ─────────────────────────────────────────────────────────
  toggleAddon(serviceId: number): void {
    if (this.selectedAddonIds.has(serviceId)) {
      this.selectedAddonIds.delete(serviceId);
      this.serviceStates.delete(serviceId);
    } else {
      this.selectedAddonIds.add(serviceId);
      const svc = this.addonServices.find(s => s.id === serviceId)!;
      this.serviceStates.set(serviceId, this.billableServiceService.buildServiceState(svc));
    }
    this.refreshJson();
  }

  isAddonSelected(id: number): boolean {
    return this.selectedAddonIds.has(id);
  }

  isAddonState(state: PlanServiceState): boolean {
    return this.selectedAddonIds.has(state.serviceId);
  }

  removeService(serviceId: number, isAddon: boolean): void {
    if (isAddon) this.selectedAddonIds.delete(serviceId);
    else this.selectedAppIds.delete(serviceId);
    this.serviceStates.delete(serviceId);
    this.refreshJson();
  }

  getAllSelectedStates(): PlanServiceState[] {
    return Array.from(this.serviceStates.values());
  }

  // ─── Charge Overrides ────────────────────────────────────────────────────────
  updateChargeValue(serviceId: number, chargeId: number, value: string): void {
    const state = this.serviceStates.get(serviceId);
    if (!state) return;
    const charge = state.charges.find(c => c.chargeId === chargeId);
    if (!charge) return;
    const parsed = parseFloat(value);
    charge.overriddenValue = isNaN(parsed) ? null : parsed;
    this.refreshJson();
  }

  updateIncludedSeats(serviceId: number, chargeId: number, value: string): void {
    const state = this.serviceStates.get(serviceId);
    if (!state) return;
    const charge = state.charges.find(c => c.chargeId === chargeId);
    if (!charge) return;
    const parsed = parseInt(value, 10);
    charge.includedSeats = isNaN(parsed) ? null : parsed;
    this.refreshJson();
  }

  resetCharge(serviceId: number, chargeId: number): void {
    const state = this.serviceStates.get(serviceId);
    if (!state) return;
    const charge = state.charges.find(c => c.chargeId === chargeId);
    if (!charge) return;
    charge.overriddenValue = null;
    charge.includedSeats = null;
    this.refreshJson();
  }

  getEffectiveValue(charge: PlanChargeState): number {
    return charge.overriddenValue !== null ? charge.overriddenValue : charge.originalValue;
  }

  isOverridden(charge: PlanChargeState): boolean {
    return charge.overriddenValue !== null && charge.overriddenValue !== charge.originalValue;
  }

  getCycleTotal(state: PlanServiceState): number {
    return state.charges
      .filter(c => c.frequency === 'PerBillingCycle')
      .reduce((sum, c) => sum + this.getEffectiveValue(c), 0);
  }

  // ─── Bundle Info ─────────────────────────────────────────────────────────────
  getBundleChildren(parentId: number): BillableService[] {
    return this.billableServiceService.getBundleChildren(parentId);
  }

  // ─── Stats ───────────────────────────────────────────────────────────────────
  totalSelectedItems(): number {
    return this.selectedAppIds.size + this.selectedAddonIds.size;
  }

  estimateMonthlyCost(): number {
    let total = 0;
    for (const [, state] of this.serviceStates) {
      total += this.getCycleTotal(state);
    }
    return total;
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────
  getAppName(appId: number | null): string {
    return appId ? AppLabels[appId as Apps] || 'Unknown' : 'Unknown';
  }

  getAppLogo(appId: number | null): string | null {
    const logos: Record<number, string> = {
      1: 'assets/TPMLogo.png', // TPM Portal
      2: 'assets/POSLogo.png', // POS
      4: 'assets/ListerLogo.png' // Lister
    };
    return appId && logos[appId] ? logos[appId] : null;
  }

  getCategoryLabel(category: string): string {
    const labels: Record<string, string> = {
      AppAccess: 'App Access',
      AddOn: 'Add-On',
      Bundle: 'Bundle'
    };
    return labels[category] || category;
  }

  getTypeColor(type: string): string {
    const map: Record<string, string> = {
      Flat: '#2563EB',
      PerSeat: '#7C3AED',
      PerTransaction: '#B45309',
      PercentageOfRevenue: '#059669'
    };
    return map[type] || '#6B7A94';
  }

  formatValue(value: number, dataType: string): string {
    if (dataType === 'money') return `$${value.toFixed(2)}`;
    if (dataType === 'percentage') return `${value}%`;
    return String(value);
  }

  formatFrequency(freq: string): string {
    return freq === 'PerBillingCycle' ? '/cycle' : 'one-time';
  }

  // ─── Plan-Level Pricing Tiers ────────────────────────────────────────────────
  getPlanBaseTotal(): number {
    let total = 0;
    for (const [, state] of this.serviceStates) {
      total += this.getCycleTotal(state);
    }
    return total;
  }

  tierPrice(base: number, tierId: string): number {
    const discountType = this.tierDiscountTypes[tierId];
    const discountValue = this.tierDiscountValues[tierId];

    if (discountType === 'percentage') {
      return base * (1 - discountValue / 100);
    } else {
      return base - discountValue;
    }
  }

  tierYearly(monthlyPrice: number): number {
    return monthlyPrice * 12;
  }

  getEffectivePlanTierPrice(tier: any): number {
    const baseTotal = this.getPlanBaseTotal();
    const def = this.tierPrice(baseTotal, tier.id);
    return this.planTierOverrides[tier.id] !== null ? this.planTierOverrides[tier.id]! : def;
  }

  isPlanTierOverridden(tier: any): boolean {
    const baseTotal = this.getPlanBaseTotal();
    const def = this.tierPrice(baseTotal, tier.id);
    return this.planTierOverrides[tier.id] !== null && Math.abs(this.planTierOverrides[tier.id]! - def) > 0.001;
  }

  updatePlanTierOverride(tierId: string, value: string): void {
    const parsed = parseFloat(value);
    this.planTierOverrides[tierId] = isNaN(parsed) ? null : parsed;
    this.refreshJson();
  }

  resetPlanTierOverride(tierId: string): void {
    this.planTierOverrides[tierId] = null;
    this.refreshJson();
  }

  // Discount type and value management
  updateTierDiscountType(tierId: string, type: 'percentage' | 'amount'): void {
    this.tierDiscountTypes[tierId] = type;
    this.refreshJson();
  }

  updateTierDiscountValue(tierId: string, value: string): void {
    const parsed = parseFloat(value);
    if (!isNaN(parsed) && parsed >= 0) {
      this.tierDiscountValues[tierId] = parsed;
      this.refreshJson();
    }
  }

  getDiscountLabel(tierId: string): string {
    const type = this.tierDiscountTypes[tierId];
    const value = this.tierDiscountValues[tierId];

    if (value === 0) {
      return 'No Discount';
    }
    return type === 'percentage' ? `Discount: ${value}%` : `Discount: $${value.toFixed(2)}`;
  }

  getDiscountClass(tierId: string): string {
    const value = this.tierDiscountValues[tierId];
    if (value === 0) return 'disc-none';
    if (tierId === 'ypay') return 'disc-blue';
    if (tierId === 'yprepaid') return 'disc-green';
    return 'disc-none';
  }

  // ─── JSON ────────────────────────────────────────────────────────────────────
  refreshJson(): void {
    const items = Array.from(this.serviceStates.values()).map(st => ({
      billableServiceId: st.serviceId,
      serviceName: st.serviceName,
      category: st.category,
      charges: st.charges.map(c => ({
        billableServiceChargeId: c.chargeId,
        chargeName: c.chargeName,
        type: c.type,
        frequency: c.frequency,
        originalValue: c.originalValue,
        overriddenValue: c.overriddenValue,
        effectiveValue: this.getEffectiveValue(c),
        includedSeats: c.includedSeats
      }))
    }));

    // Plan-level pricing tiers
    const pricingTiers = this.pricingTiers.map(tier => ({
      tierId: tier.id,
      tierLabel: tier.label,
      discountType: this.tierDiscountTypes[tier.id],
      discountValue: this.tierDiscountValues[tier.id],
      effectiveMonthlyPrice: this.getEffectivePlanTierPrice(tier),
      yearlyTotal: this.tierYearly(this.getEffectivePlanTierPrice(tier)),
      overriddenPrice: this.planTierOverrides[tier.id]
    }));

    const plan = {
      planName: this.planName,
      shortDescription: this.planDesc,
      planType: this.planType,
      billingCycle: this.billingCycle,
      currency: this.currency,
      showOnPortal: this.showOnPortal,
      pricingTiers,
      items
    };
    this.jsonOutput = JSON.stringify(plan, null, 2);
  }

  toggleJsonPanel(): void {
    this.refreshJson();
    this.showJsonPanel = !this.showJsonPanel;
  }

  savePlan(): void {
    // Validate required fields
    if (!this.planName.trim()) {
      console.warn('Please enter a plan name');
      return;
    }

    if (this.selectedAppIds.size === 0) {
      console.warn('Please select at least one app');
      return;
    }

    // Helper function to convert discount type to number
    const discountTypeToNumber = (type: 'percentage' | 'amount'): number => {
      return type === 'percentage' ? 0 : 1;
    };

    // Helper function to apply discount
    const applyDiscount = (price: number, discountType: 'percentage' | 'amount', discountValue: number): number => {
      if (discountType === 'percentage') {
        return price * (1 - discountValue / 100);
      } else {
        return Math.max(0, price - discountValue);
      }
    };

    // Get discount configurations for each tier
    const monthlyDiscountType = this.tierDiscountTypes['monthly'];
    const monthlyDiscountValue = this.tierDiscountValues['monthly'] || 0;
    const ypayDiscountType = this.tierDiscountTypes['ypay'];
    const ypayDiscountValue = this.tierDiscountValues['ypay'] || 0;
    const yprepaidDiscountType = this.tierDiscountTypes['yprepaid'];
    const yprepaidDiscountValue = this.tierDiscountValues['yprepaid'] || 0;

    // Build items array from service states
    const items: any[] = [];
    this.serviceStates.forEach((state, serviceId) => {
      // Calculate service-level base pricing (before discounts)
      let basePricePerMonth = 0;
      state.charges.forEach(charge => {
        const value = charge.overriddenValue ?? charge.originalValue;
        if (charge.frequency === 'PerBillingCycle' || charge.frequency === 'Monthly') {
          basePricePerMonth += value;
        }
      });

      // Calculate discounted prices for each billing cycle
      const priceMonthly = applyDiscount(basePricePerMonth, monthlyDiscountType, monthlyDiscountValue);
      const priceYearlyPayMonthly = applyDiscount(basePricePerMonth, ypayDiscountType, ypayDiscountValue);
      const basePricePerYear = basePricePerMonth * 12;
      const priceYearlyPrepaid = applyDiscount(basePricePerYear, yprepaidDiscountType, yprepaidDiscountValue);

      // Build values array for charges
      const values = state.charges.map(charge => ({
        billableServiceChargeId: charge.chargeId,
        originalValue: charge.originalValue,
        overriddenValue: charge.overriddenValue ?? charge.originalValue,
        includedSeats: charge.includedSeats
      }));

      // Add item to array with calculated discounted prices
      items.push({
        billableServiceId: serviceId,
        pricePerMonthForMonthlyCycle: priceMonthly,
        pricePerMonthForYearlyCycle: priceYearlyPayMonthly,
        pricePerYearForYearlyCycle: priceYearlyPrepaid,
        discountTypePerMonthForMonthlyCycle: discountTypeToNumber(monthlyDiscountType),
        discountPerMonthForMonthlyCycle: monthlyDiscountValue,
        discountTypePerMonthForYearlyCycle: discountTypeToNumber(ypayDiscountType),
        discountPerMonthForYearlyCycle: ypayDiscountValue,
        discountTypePerYearForYearlyCycle: discountTypeToNumber(yprepaidDiscountType),
        discountPerYearForYearlyCycle: yprepaidDiscountValue,
        permissionTemplateId: 0,
        values: values
      });
    });

    // Build plan payload
    const planPayload: any = {
      name: this.planName,
      description: this.planDesc || '',
      status: 2, // Active
      canShowOnWebsite: this.showOnPortal,
      type: this.planType === 'self' ? 1 : 2,
      companyId: -1,
      items: items
    };

    if (this.planId) {
      // Update existing plan - include plan ID
      planPayload.id = this.planId;
      console.log('=== UPDATE PLAN REQUEST ===');
      console.log('Plan ID:', this.planId);
      console.log('Request Payload:', JSON.stringify(planPayload, null, 2));
      console.log('Items count:', items.length);
      console.log('===========================');

      this.subscriptionPlanService.updatePlan(this.planId, planPayload).subscribe(updatedPlan => {
        if (updatedPlan) {
          console.log('Plan updated successfully:', updatedPlan);
          this.closeDrawer.emit();
        }
      });
    } else {
      // Create new plan
      console.log('=== CREATE PLAN REQUEST ===');
      console.log('Request Payload:', JSON.stringify(planPayload, null, 2));
      console.log('Items count:', items.length);
      console.log('===========================');

      this.subscriptionPlanService.createPlan(planPayload).subscribe(newPlan => {
        if (newPlan) {
          console.log('Plan created successfully:', newPlan);
          this.closeDrawer.emit();
        }
      });
    }
  }
}
