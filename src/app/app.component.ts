import { Component, OnInit } from '@angular/core';
import { DiscountService } from './features/company-discounts/services/discount.service';
import { CompanyDiscount } from './features/company-discounts/models/company-discount.model';
import { BillableServiceService } from './features/billable-services/services/billable-service.service';
import { SubscriptionPlanService } from './features/subscription-plans/services/subscription-plan.service';

@Component({
  selector: 'app-root',
  template: `
    <app-navigation [activeRoute]="activeRoute" (navigate)="onNavigate($event)"> </app-navigation>

    <!-- Plans View -->
    <app-plans-list
      *ngIf="activeRoute === 'plans'"
      (addPlanClicked)="showPlanBuilder()"
      (editPlanClicked)="editPlan($event)"
      (duplicatePlanClicked)="duplicatePlan($event)"
    >
    </app-plans-list>

    <!-- Services View -->
    <app-billable-services-list
      *ngIf="activeRoute === 'services'"
      (addServiceClicked)="showServiceForm($event)"
      (editServiceClicked)="editService($event)"
      (addChargeClicked)="showChargeForm($event)"
      (editChargeClicked)="editCharge($event)"
    >
    </app-billable-services-list>

    <!-- Discounts View -->
    <app-discounts-list
      *ngIf="activeRoute === 'discounts'"
      (addDiscountClicked)="showDiscountForm()"
      (editDiscountClicked)="editDiscount($event)"
    >
    </app-discounts-list>

    <!-- Plan Builder Drawer -->
    <div class="drawer-overlay" [class.visible]="drawerOpen" (click)="closePlanBuilder()"></div>
    <div class="drawer" [class.open]="drawerOpen">
      <app-plan-builder 
        *ngIf="drawerOpen" 
        [planId]="editingPlanId" 
        [duplicateFromPlanId]="duplicatingFromPlanId"
        (closeDrawer)="closePlanBuilder()">
      </app-plan-builder>
    </div>

    <!-- Service Form Drawer -->
    <div class="drawer-overlay" [class.visible]="serviceDrawerOpen" (click)="closeServiceForm()"></div>
    <div class="drawer" [class.open]="serviceDrawerOpen">
      <app-service-form
        *ngIf="serviceDrawerOpen"
        [serviceId]="editingServiceId"
        [category]="serviceCategory"
        (closeForm)="closeServiceForm()"
        (saveService)="onSaveService($event)"
      >
      </app-service-form>
    </div>

    <!-- Charge Form Drawer -->
    <div class="drawer-overlay" [class.visible]="chargeDrawerOpen" (click)="closeChargeForm()"></div>
    <div class="drawer" [class.open]="chargeDrawerOpen">
      <app-charge-form
        *ngIf="chargeDrawerOpen"
        [serviceId]="chargeServiceId"
        [chargeId]="editingChargeId"
        (closeForm)="closeChargeForm()"
        (saveCharge)="onSaveCharge($event)"
      >
      </app-charge-form>
    </div>

    <!-- Discount Form Drawer -->
    <div class="drawer-overlay" [class.visible]="discountDrawerOpen" (click)="closeDiscountForm()"></div>
    <div class="drawer" [class.open]="discountDrawerOpen">
      <app-discount-form
        *ngIf="discountDrawerOpen"
        [discountId]="editingDiscountId"
        (closeForm)="closeDiscountForm()"
        (saveDiscount)="onSaveDiscount($event)"
      >
      </app-discount-form>
    </div>
  `,
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        height: 100vh;
        overflow: hidden;
      }

      app-navigation {
        flex-shrink: 0;
      }

      app-plans-list,
      app-billable-services-list,
      app-discounts-list {
        flex: 1;
        overflow: auto;
        min-height: 0;
      }

      .drawer-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.4);
        z-index: 999;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.3s ease;
        backdrop-filter: blur(2px);

        &.visible {
          opacity: 1;
          pointer-events: all;
        }
      }

      .drawer {
        position: fixed;
        top: 0;
        right: 0;
        bottom: 0;
        width: 100%;
        max-width: 100%;
        background: #f4f6f9;
        z-index: 1000;
        transform: translateX(100%);
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        overflow: hidden;
        box-shadow: -4px 0 24px rgba(0, 0, 0, 0.15);
        border-top-left-radius: 16px;
        border-bottom-left-radius: 16px;

        &.open {
          transform: translateX(0);
        }
      }

      @media (min-width: 1024px) {
        .drawer {
          max-width: 95%;
        }
      }

      @media (min-width: 1600px) {
        .drawer {
          max-width: 1800px;
        }
      }
    `
  ]
})
export class AppComponent implements OnInit {
  activeRoute: string = 'plans';
  drawerOpen = false;
  editingPlanId: number | null = null;
  duplicatingFromPlanId: number | null = null;

  constructor(
    private discountService: DiscountService,
    private billableServiceService: BillableServiceService,
    private subscriptionPlanService: SubscriptionPlanService
  ) {}

  ngOnInit(): void {
    // Load all data on app initialization
    this.billableServiceService.loadData().subscribe();
    this.subscriptionPlanService.getAllPlans().subscribe();
  }

  // Service Form State
  serviceDrawerOpen = false;
  editingServiceId: number | null = null;
  serviceCategory: 'AddOn' | 'Bundle' | null = null;

  // Charge Form State
  chargeDrawerOpen = false;
  chargeServiceId: number | null = null;
  editingChargeId: number | null = null;

  // Discount Form State
  discountDrawerOpen = false;
  editingDiscountId: number | null = null;

  onNavigate(route: string): void {
    this.activeRoute = route;
  }

  // Plan Builder Methods
  showPlanBuilder(): void {
    this.editingPlanId = null;
    this.duplicatingFromPlanId = null;
    this.drawerOpen = true;
  }

  editPlan(planId: number): void {
    this.editingPlanId = planId;
    this.duplicatingFromPlanId = null;
    this.drawerOpen = true;
    console.log('Edit plan:', planId);
  }

  duplicatePlan(planId: number): void {
    this.editingPlanId = null;
    this.duplicatingFromPlanId = planId;
    this.drawerOpen = true;
    console.log('Duplicate plan:', planId);
  }

  closePlanBuilder(): void {
    this.drawerOpen = false;
    setTimeout(() => {
      this.editingPlanId = null;
      this.duplicatingFromPlanId = null;
    }, 300);
  }

  // Service Form Methods
  showServiceForm(category: 'AddOn' | 'Bundle'): void {
    this.editingServiceId = null;
    this.serviceCategory = category;
    this.serviceDrawerOpen = true;
  }

  editService(serviceId: number): void {
    this.editingServiceId = serviceId;
    this.serviceCategory = null; // Don't set category when editing
    this.serviceDrawerOpen = true;
  }

  closeServiceForm(): void {
    this.serviceDrawerOpen = false;
    setTimeout(() => {
      this.editingServiceId = null;
      this.serviceCategory = null;
    }, 300);
  }

  onSaveService(serviceData: any): void {
    if (this.editingServiceId) {
      // Update existing service
      const { id, ...updates } = serviceData;
      console.log('=== UPDATE SERVICE REQUEST ===');
      console.log('Service ID:', this.editingServiceId);
      console.log('Request Payload:', JSON.stringify(updates, null, 2));
      console.log('==============================');

      this.billableServiceService.updateService(this.editingServiceId, updates).subscribe(updatedService => {
        if (updatedService) {
          console.log('Service updated successfully:', updatedService);
          this.closeServiceForm();
        }
      });
    } else {
      // Create new service
      const { id, ...servicePayload } = serviceData;
      console.log('=== CREATE SERVICE REQUEST ===');
      console.log('Request Payload:', JSON.stringify(servicePayload, null, 2));
      console.log('==============================');

      this.billableServiceService.createService(servicePayload).subscribe(newService => {
        if (newService) {
          console.log('Service created successfully:', newService);
          this.closeServiceForm();
        }
      });
    }
  }

  // Charge Form Methods
  showChargeForm(serviceId: number): void {
    this.chargeServiceId = serviceId;
    this.editingChargeId = null;
    this.chargeDrawerOpen = true;
  }

  editCharge(data: { serviceId: number; chargeId: number }): void {
    this.chargeServiceId = data.serviceId;
    this.editingChargeId = data.chargeId;
    this.chargeDrawerOpen = true;
  }

  closeChargeForm(): void {
    this.chargeDrawerOpen = false;
    setTimeout(() => {
      this.chargeServiceId = null;
      this.editingChargeId = null;
    }, 300);
  }

  onSaveCharge(chargeData: any): void {
    const serviceId = chargeData.billableServiceId;
    if (!serviceId) {
      console.error('Service ID is required');
      return;
    }

    if (this.editingChargeId) {
      // Update existing charge
      const { id, billableServiceId, ...updates } = chargeData;
      console.log('=== UPDATE CHARGE REQUEST ===');
      console.log('Service ID:', serviceId);
      console.log('Charge ID:', this.editingChargeId);
      console.log('Request Payload:', JSON.stringify(updates, null, 2));
      console.log('=============================');

      this.billableServiceService.updateCharge(serviceId, this.editingChargeId, updates).subscribe(updatedCharge => {
        if (updatedCharge) {
          console.log('Charge updated successfully:', updatedCharge);
          this.closeChargeForm();
        }
      });
    } else {
      // Create new charge
      const { id, billableServiceId, ...chargePayload } = chargeData;
      console.log('=== CREATE CHARGE REQUEST ===');
      console.log('Service ID:', serviceId);
      console.log('Request Payload:', JSON.stringify(chargePayload, null, 2));
      console.log('=============================');

      this.billableServiceService.createCharge(serviceId, chargePayload).subscribe(newCharge => {
        if (newCharge) {
          console.log('Charge created successfully:', newCharge);
          this.closeChargeForm();
        }
      });
    }
  }

  // Discount Form Methods
  showDiscountForm(): void {
    this.editingDiscountId = null;
    this.discountDrawerOpen = true;
  }

  editDiscount(discountId: number): void {
    this.editingDiscountId = discountId;
    this.discountDrawerOpen = true;
  }

  closeDiscountForm(): void {
    this.discountDrawerOpen = false;
    setTimeout(() => {
      this.editingDiscountId = null;
    }, 300);
  }

  onSaveDiscount(discountData: any): void {
    if (this.editingDiscountId) {
      // Update existing discount
      console.log('=== UPDATE DISCOUNT REQUEST ===');
      console.log('Discount ID:', this.editingDiscountId);
      console.log('Request Payload:', JSON.stringify(discountData, null, 2));
      console.log('Username:', 'CurrentUser');
      console.log('===============================');

      this.discountService
        .updateDiscount(this.editingDiscountId, discountData, 'CurrentUser')
        .subscribe((updatedDiscount: CompanyDiscount | null) => {
          if (updatedDiscount) {
            console.log('Discount updated successfully:', updatedDiscount);
            // Refresh the discounts list by triggering reload
            this.closeDiscountForm();
            // Force reload by closing and waiting
            setTimeout(() => {
              window.location.reload(); // Temporary - in production use state management
            }, 100);
          }
        });
    } else {
      // Create new discount
      console.log('=== CREATE DISCOUNT REQUEST ===');
      console.log('Request Payload:', JSON.stringify(discountData, null, 2));
      console.log('Username:', 'CurrentUser');
      console.log('===============================');

      this.discountService
        .createDiscount(discountData, 'CurrentUser')
        .subscribe((newDiscount: CompanyDiscount | null) => {
          if (newDiscount) {
            console.log('Discount created successfully:', newDiscount);
            // Refresh the discounts list
            this.closeDiscountForm();
            setTimeout(() => {
              window.location.reload(); // Temporary - in production use state management
            }, 100);
          }
        });
    }
  }
}
