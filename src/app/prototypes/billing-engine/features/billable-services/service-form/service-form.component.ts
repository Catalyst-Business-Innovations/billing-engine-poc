import { Component, EventEmitter, Output, Input, OnInit } from '@angular/core';
import { BillableService } from '../models';
import { Apps, AppLabels } from '../../../models';
import { BillableServiceService } from '../services/billable-service.service';

@Component({
  selector: 'app-service-form',
  templateUrl: './service-form.component.html',
  styleUrls: ['./service-form.component.scss']
})
export class ServiceFormComponent implements OnInit {
  @Input() serviceId: number | null = null;
  @Input() category: 'AppAccess' | 'AddOn' | 'Bundle' | null = null;
  @Output() closeForm = new EventEmitter<void>();
  @Output() saveService = new EventEmitter<any>();

  formData = {
    name: '',
    appId: null as number | null,
    category: 'AddOn' as 'AppAccess' | 'AddOn' | 'Bundle',
    isSystemDefault: false,
    bundleAddOnIds: [] as number[]
  };

  // Charge management
  charges: Array<{
    name: string;
    type: 'Flat' | 'PerSeat' | 'PerTransaction' | 'PercentageOfRevenue';
    frequency: 'PerBillingCycle' | 'OneTime';
    defaultValue: number;
    valueDataType: 'money' | 'percentage';
  }> = [];

  showChargeForm = false;
  editingChargeIndex: number | null = null;
  chargeFormData = {
    name: '',
    type: 'Flat' as 'Flat' | 'PerSeat' | 'PerTransaction' | 'PercentageOfRevenue',
    frequency: 'PerBillingCycle' as 'PerBillingCycle' | 'OneTime',
    defaultValue: 0,
    valueDataType: 'money' as 'money' | 'percentage'
  };

  chargeTypes = [
    { value: 'Flat', label: 'Flat Fee', dataType: 'money' },
    { value: 'PerSeat', label: 'Per Seat/User', dataType: 'money' },
    { value: 'PerTransaction', label: 'Per Transaction', dataType: 'money' },
    { value: 'PercentageOfRevenue', label: '% of Revenue', dataType: 'percentage' }
  ];

  chargeFrequencies = [
    { value: 'PerBillingCycle', label: 'Per Billing Cycle' },
    { value: 'OneTime', label: 'One-Time' }
  ];

  apps = [
    { id: Apps.TPMPortal, name: AppLabels[Apps.TPMPortal] },
    { id: Apps.POS, name: AppLabels[Apps.POS] },
    { id: Apps.Lister, name: AppLabels[Apps.Lister] }
  ];
  categories: Array<'AddOn' | 'Bundle'> = ['AddOn', 'Bundle'];
  availableAddOns: BillableService[] = [];

  constructor(private billableServiceService: BillableServiceService) {}

  ngOnInit(): void {
    // Set category from input when creating a new service
    if (!this.serviceId && this.category) {
      this.formData.category = this.category;
      // AppAccess services must always be system default
      if (this.category === 'AppAccess') {
        this.formData.isSystemDefault = true;
      }
    }

    // Load available add-ons for bundle selection
    this.loadAvailableAddOns();

    if (this.serviceId) {
      // Load existing service data
      this.loadServiceData();
    }
  }

  loadServiceData(): void {
    if (!this.serviceId) return;

    this.billableServiceService.loadData().subscribe(() => {
      const allServices = this.billableServiceService.getBillableServices();
      const service = allServices.find(s => s.id === this.serviceId);

      if (service) {
        this.formData = {
          name: service.name,
          appId: service.appId,
          category: service.category,
          isSystemDefault: service.isSystemDefault,
          bundleAddOnIds: service.bundleItems?.map(item => item.billableServiceChildId) || []
        };

        // Load charges for this service
        if (service.charges) {
          this.charges = service.charges.map(charge => ({
            name: charge.name,
            type: charge.type,
            frequency: charge.frequency,
            defaultValue: charge.defaultValue,
            valueDataType: charge.valueDataType
          }));
        }

        // Reload available add-ons with the proper app filter
        this.loadAvailableAddOns();
      }
    });
  }

  loadAvailableAddOns(): void {
    this.billableServiceService.loadData().subscribe(() => {
      const allServices = this.billableServiceService.getBillableServices();
      // Only show standalone add-ons (not bundles, not app access)
      let addOns = allServices.filter(s => s.category === 'AddOn');

      // Filter by app assignment to prevent cross-app bundles
      if (this.formData.appId) {
        // App-specific bundle: include add-ons from same app OR global add-ons
        this.availableAddOns = addOns.filter(addon => addon.appId === this.formData.appId || addon.appId === null);
      } else {
        // Global bundle: include only global add-ons
        this.availableAddOns = addOns.filter(addon => addon.appId === null);
      }
    });
  }

  onAppChange(): void {
    // When app changes, reload available add-ons and clear selections
    this.formData.bundleAddOnIds = [];
    this.loadAvailableAddOns();
  }

  toggleAddOn(addonId: number): void {
    const index = this.formData.bundleAddOnIds.indexOf(addonId);
    if (index > -1) {
      this.formData.bundleAddOnIds.splice(index, 1);
    } else {
      this.formData.bundleAddOnIds.push(addonId);
    }
  }

  isAddOnSelected(addonId: number): boolean {
    return this.formData.bundleAddOnIds.includes(addonId);
  }

  isCategoryPreSelected(): boolean {
    return this.category !== null && !this.serviceId;
  }

  isAppAccessChargeEdit(): boolean {
    return this.formData.category === 'AppAccess' && this.editingChargeIndex !== null;
  }

  // Charge Management Methods
  openChargeForm(): void {
    this.resetChargeForm();
    this.showChargeForm = true;
  }

  resetChargeForm(): void {
    this.chargeFormData = {
      name: '',
      type: 'Flat',
      frequency: 'PerBillingCycle',
      defaultValue: 0,
      valueDataType: 'money'
    };
    this.editingChargeIndex = null;
  }

  onChargeTypeChange(): void {
    const selectedType = this.chargeTypes.find(t => t.value === this.chargeFormData.type);
    if (selectedType) {
      this.chargeFormData.valueDataType = selectedType.dataType as 'money' | 'percentage';
    }
  }

  addCharge(): void {
    if (this.chargeFormData.name.trim() && this.chargeFormData.defaultValue > 0) {
      if (this.editingChargeIndex !== null) {
        // Update existing charge
        this.charges[this.editingChargeIndex] = { ...this.chargeFormData };
      } else {
        // Add new charge
        this.charges.push({ ...this.chargeFormData });
      }
      this.showChargeForm = false;
      this.resetChargeForm();
    }
  }

  editCharge(index: number): void {
    this.editingChargeIndex = index;
    this.chargeFormData = { ...this.charges[index] };
    this.showChargeForm = true;
  }

  removeCharge(index: number): void {
    this.charges.splice(index, 1);
  }

  cancelChargeForm(): void {
    this.showChargeForm = false;
    this.resetChargeForm();
  }

  getChargeTypeLabel(type: string): string {
    const chargeType = this.chargeTypes.find(t => t.value === type);
    return chargeType ? chargeType.label : type;
  }

  formatChargeValue(value: number, dataType: string): string {
    if (dataType === 'money') {
      return `$${value.toFixed(2)}`;
    }
    return `${value}%`;
  }

  onSubmit(): void {
    if (this.formData.name.trim() && this.charges.length > 0) {
      // Ensure AppAccess services are always system default
      if (this.formData.category === 'AppAccess') {
        this.formData.isSystemDefault = true;
      }
      
      this.saveService.emit({
        ...this.formData,
        charges: this.charges,
        id: this.serviceId || Date.now()
      });
      this.closeForm.emit();
    }
  }

  onCancel(): void {
    this.closeForm.emit();
  }

  getCategoryLabel(category: string): string {
    const labels: Record<string, string> = {
      AppAccess: 'App Access',
      AddOn: 'Add-On',
      Bundle: 'Bundle'
    };
    return labels[category] || category;
  }
}
