import { Component, OnInit, EventEmitter, Output, HostListener } from '@angular/core';
import { BillableServiceService } from '../services/billable-service.service';
import { BillableService, BillableServiceCharge } from '../models';
import { Apps, AppLabels } from '../../../models';

@Component({
  selector: 'app-billable-services-list',
  templateUrl: './billable-services-list.component.html',
  styleUrls: ['./billable-services-list.component.scss']
})
export class BillableServicesListComponent implements OnInit {
  @Output() addServiceClicked = new EventEmitter<'AddOn' | 'Bundle'>();
  @Output() editServiceClicked = new EventEmitter<number>();
  @Output() addChargeClicked = new EventEmitter<number>();
  @Output() editChargeClicked = new EventEmitter<{ serviceId: number; chargeId: number }>();

  appLabels = AppLabels;

  services: BillableService[] = [];
  filteredServices: BillableService[] = [];
  charges: { [serviceId: number]: BillableServiceCharge[] } = {};

  searchText = '';
  filterCategory: 'all' | 'AppAccess' | 'AddOn' | 'Bundle' = 'all';
  expandedServices: Set<number> = new Set();
  dropdownOpen = false;
  editingChargeId: number | null = null;
  editingValue: number = 0;
  
  // Confirmation dialog state
  showDeleteServiceConfirmDialog = false;
  showDeleteChargeConfirmDialog = false;
  serviceToDelete: BillableService | null = null;
  chargeToDelete: { serviceId: number; charge: BillableServiceCharge } | null = null;

  constructor(private billableServiceService: BillableServiceService) {}

  ngOnInit(): void {
    this.loadServices();
  }

  loadServices(): void {
    this.billableServiceService.loadData().subscribe(() => {
      this.services = this.billableServiceService.getBillableServices();
      console.log('Received services in component:', this.services);
      console.log('Services count:', this.services?.length || 0);

      // Charges are already nested in services
      this.services.forEach(service => {
        this.charges[service.id] = service.charges || [];
      });

      this.applyFilters();
      console.log('Filtered services:', this.filteredServices);
    });
  }

  applyFilters(): void {
    this.filteredServices = this.services.filter(service => {
      const matchesSearch = !this.searchText || service.name.toLowerCase().includes(this.searchText.toLowerCase());

      const matchesCategory = this.filterCategory === 'all' || service.category === this.filterCategory;

      return matchesSearch && matchesCategory;
    });
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  setCategoryFilter(category: 'all' | 'AppAccess' | 'AddOn' | 'Bundle'): void {
    this.filterCategory = category;
    this.applyFilters();
  }

  toggleServiceExpanded(serviceId: number): void {
    if (this.expandedServices.has(serviceId)) {
      this.expandedServices.delete(serviceId);
    } else {
      this.expandedServices.add(serviceId);
    }
  }

  isServiceExpanded(serviceId: number): boolean {
    return this.expandedServices.has(serviceId);
  }

  getServiceCharges(serviceId: number): BillableServiceCharge[] {
    return this.charges[serviceId] || [];
  }

  toggleDropdown(): void {
    this.dropdownOpen = !this.dropdownOpen;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const dropdown = target.closest('.add-service-dropdown');
    if (!dropdown && this.dropdownOpen) {
      this.dropdownOpen = false;
    }
  }

  onAddService(category: 'AddOn' | 'Bundle'): void {
    this.dropdownOpen = false;
    this.addServiceClicked.emit(category);
  }

  onEditService(serviceId: number, event: Event): void {
    event.stopPropagation();
    this.editServiceClicked.emit(serviceId);
  }

  onAddCharge(serviceId: number, event: Event): void {
    event.stopPropagation();
    this.addChargeClicked.emit(serviceId);
  }

  onEditCharge(serviceId: number, chargeId: number, event: Event): void {
    event.stopPropagation();
    this.editChargeClicked.emit({ serviceId, chargeId });
  }

  deleteService(service: BillableService, event: Event): void {
    event.stopPropagation();
    if (service.isSystemDefault) {
      console.warn('System default services cannot be deleted.');
      return;
    }
    this.serviceToDelete = service;
    this.showDeleteServiceConfirmDialog = true;
  }

  onConfirmDeleteService(): void {
    if (this.serviceToDelete) {
      console.log('Delete service:', this.serviceToDelete.id);
      // In real app, call service to delete
    }
    this.showDeleteServiceConfirmDialog = false;
    this.serviceToDelete = null;
  }

  onCancelDeleteService(): void {
    this.showDeleteServiceConfirmDialog = false;
    this.serviceToDelete = null;
  }

  deleteCharge(serviceId: number, charge: BillableServiceCharge, event: Event): void {
    event.stopPropagation();
    if (charge.isSystemDefault) {
      console.warn('System default charges cannot be deleted.');
      return;
    }
    this.chargeToDelete = { serviceId, charge };
    this.showDeleteChargeConfirmDialog = true;
  }

  onConfirmDeleteCharge(): void {
    if (this.chargeToDelete) {
      console.log('Delete charge:', this.chargeToDelete.charge.id);
      // In real app, call service to delete
    }
    this.showDeleteChargeConfirmDialog = false;
    this.chargeToDelete = null;
  }

  onCancelDeleteCharge(): void {
    this.showDeleteChargeConfirmDialog = false;
    this.chargeToDelete = null;
  }

  getDeleteServiceMessage(): string {
    return this.serviceToDelete 
      ? `Are you sure you want to delete "${this.serviceToDelete.name}"? This action cannot be undone.`
      : 'Are you sure you want to delete this service?';
  }

  getDeleteChargeMessage(): string {
    return this.chargeToDelete 
      ? `Are you sure you want to delete "${this.chargeToDelete.charge.name}"? This action cannot be undone.`
      : 'Are you sure you want to delete this charge?';
  }

  getCategoryCount(category: string): number {
    if (category === 'all') return this.services.length;
    return this.services.filter(s => s.category === category).length;
  }

  getCategoryLabel(category: string): string {
    const labels: Record<string, string> = {
      AppAccess: 'App Access',
      AddOn: 'Add-On',
      Bundle: 'Bundle'
    };
    return labels[category] || category;
  }

  getAppName(appId: number | null): string {
    if (appId === null) return '';
    return AppLabels[appId as Apps] || 'Unknown';
  }

  getChargeTypeColor(type: string): string {
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

  startEditingCharge(charge: BillableServiceCharge, event: Event): void {
    event.stopPropagation();
    this.editingChargeId = charge.id;
    this.editingValue = charge.defaultValue;
  }

  saveChargeValue(charge: BillableServiceCharge, event: Event): void {
    event.stopPropagation();
    if (this.editingValue !== charge.defaultValue) {
      charge.defaultValue = this.editingValue;
      console.log('Updated charge value:', charge.id, this.editingValue);
      // In real app, call service to save
    }
    this.editingChargeId = null;
  }

  cancelEditingCharge(event: Event): void {
    event.stopPropagation();
    this.editingChargeId = null;
  }

  isEditingCharge(chargeId: number): boolean {
    return this.editingChargeId === chargeId;
  }
}
