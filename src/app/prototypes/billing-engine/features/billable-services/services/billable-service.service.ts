import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of, BehaviorSubject } from 'rxjs';
import { map, tap, delay } from 'rxjs/operators';
import { BillableService, BillableServiceCharge, BillableServiceBundleItem } from '../models';
import { PlanChargeState, PlanServiceState, SubscriptionPlan } from '../../subscription-plans/models';

@Injectable({ providedIn: 'root' })
export class BillableServiceService {
  private billableServices: BillableService[] = [];
  private servicesSubject = new BehaviorSubject<BillableService[]>([]);

  constructor(private http: HttpClient) {}

  /**
   * Load all data from separate API files
   */
  loadData(): Observable<boolean> {
    return forkJoin({
      billableServices: this.http.get<BillableService[]>('assets/api/billable-services.json'),
      subscriptionPlans: this.http.get<SubscriptionPlan[]>('assets/api/subscription-plans.json')
    }).pipe(
      tap(response => {
        console.log('Loaded billable services:', response.billableServices);
        console.log('Number of services:', response.billableServices?.length || 0);
        this.billableServices = response.billableServices;
        this.servicesSubject.next(this.billableServices);
      }),
      map(() => true)
    );
  }

  /**
   * Get all billable services (with nested charges and bundle items)
   */
  getBillableServices(): BillableService[] {
    return this.billableServices;
  }

  /**
   * Get app access services (category = 'AppAccess')
   */
  getAppAccessServices(): BillableService[] {
    return this.billableServices.filter(s => s.category === 'AppAccess');
  }

  /**
   * Get addon services (category = 'AddOn' or 'Bundle')
   */
  getAddonServices(): BillableService[] {
    return this.billableServices.filter(s => s.category === 'AddOn' || s.category === 'Bundle');
  }

  /**
   * Get charges for a specific service (already nested in service)
   */
  getChargesForService(serviceId: number): BillableServiceCharge[] {
    const service = this.billableServices.find(s => s.id === serviceId);
    return service?.charges || [];
  }

  /**
   * Get bundle children services (already nested in parent service)
   */
  getBundleChildren(parentId: number): BillableService[] {
    const parentService = this.billableServices.find(s => s.id === parentId);
    if (!parentService?.bundleItems) return [];

    const childIds = parentService.bundleItems.map(item => item.billableServiceChildId);
    return this.billableServices.filter(s => childIds.includes(s.id));
  }

  /**
   * Build service state for plan builder
   */
  buildServiceState(service: BillableService): PlanServiceState {
    const charges = this.getChargesForService(service.id).map(
      c =>
        ({
          chargeId: c.id,
          chargeName: c.name,
          type: c.type,
          frequency: c.frequency,
          dataType: c.valueDataType,
          originalValue: c.defaultValue,
          overriddenValue: null,
          includedSeats: null
        }) as PlanChargeState
    );

    return {
      serviceId: service.id,
      serviceName: service.name,
      category: service.category,
      appId: service.appId,
      charges,
      addons: []
    };
  }

  /**
   * Create a new billable service
   */
  createService(service: Omit<BillableService, 'id'>): Observable<BillableService> {
    return of(null).pipe(
      delay(300),
      map(() => {
        const services = this.servicesSubject.value;
        const newId = services.length > 0 ? Math.max(...services.map(s => s.id)) + 1 : 1;
        const newService: BillableService = {
          id: newId,
          ...service,
          charges: service.charges || [],
          bundleItems: service.bundleItems || []
        };
        const updatedServices = [...services, newService];
        this.billableServices = updatedServices;
        this.servicesSubject.next(updatedServices);
        console.log('Service created:', newService);
        return newService;
      })
    );
  }

  /**
   * Update an existing billable service
   */
  updateService(id: number, updates: Partial<BillableService>): Observable<BillableService | null> {
    return of(null).pipe(
      delay(300),
      map(() => {
        const services = this.servicesSubject.value;
        const index = services.findIndex(s => s.id === id);
        if (index === -1) return null;

        const updatedService = { ...services[index], ...updates, id };
        const updatedServices = [...services];
        updatedServices[index] = updatedService;
        this.billableServices = updatedServices;
        this.servicesSubject.next(updatedServices);
        console.log('Service updated:', updatedService);
        return updatedService;
      })
    );
  }

  /**
   * Create a new charge for a service
   */
  createCharge(
    serviceId: number,
    charge: Omit<BillableServiceCharge, 'id' | 'billableServiceId'>
  ): Observable<BillableServiceCharge | null> {
    return of(null).pipe(
      delay(300),
      map(() => {
        const services = this.servicesSubject.value;
        const serviceIndex = services.findIndex(s => s.id === serviceId);
        if (serviceIndex === -1) return null;

        const service = services[serviceIndex];
        const charges = service.charges || [];
        const newId = charges.length > 0 ? Math.max(...charges.map(c => c.id)) + 1 : 1;

        const newCharge: BillableServiceCharge = {
          id: newId,
          billableServiceId: serviceId,
          ...charge
        };

        const updatedService = {
          ...service,
          charges: [...charges, newCharge]
        };

        const updatedServices = [...services];
        updatedServices[serviceIndex] = updatedService;
        this.billableServices = updatedServices;
        this.servicesSubject.next(updatedServices);
        console.log('Charge created:', newCharge);
        return newCharge;
      })
    );
  }

  /**
   * Update an existing charge
   */
  updateCharge(
    serviceId: number,
    chargeId: number,
    updates: Partial<BillableServiceCharge>
  ): Observable<BillableServiceCharge | null> {
    return of(null).pipe(
      delay(300),
      map(() => {
        const services = this.servicesSubject.value;
        const serviceIndex = services.findIndex(s => s.id === serviceId);
        if (serviceIndex === -1) return null;

        const service = services[serviceIndex];
        const charges = service.charges || [];
        const chargeIndex = charges.findIndex(c => c.id === chargeId);
        if (chargeIndex === -1) return null;

        const updatedCharge = { ...charges[chargeIndex], ...updates, id: chargeId, billableServiceId: serviceId };
        const updatedCharges = [...charges];
        updatedCharges[chargeIndex] = updatedCharge;

        const updatedService = {
          ...service,
          charges: updatedCharges
        };

        const updatedServices = [...services];
        updatedServices[serviceIndex] = updatedService;
        this.billableServices = updatedServices;
        this.servicesSubject.next(updatedServices);
        console.log('Charge updated:', updatedCharge);
        return updatedCharge;
      })
    );
  }
}
