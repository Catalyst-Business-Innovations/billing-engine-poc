import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { delay, map, tap } from 'rxjs/operators';
import { SubscriptionPlan, SubscriptionPlanItem, SubscriptionPlanItemValue } from '../models';

/**
 * Service for managing subscription plans with nested data structure
 * Simulates REST API calls with JSON file backend
 * Plans contain nested items, items contain nested values
 */
@Injectable({
  providedIn: 'root'
})
export class SubscriptionPlanService {
  private plansSubject = new BehaviorSubject<SubscriptionPlan[]>([]);
  private dataLoaded = false;

  constructor(private http: HttpClient) {}

  /**
   * Load all subscription plans data from API (with nested items and values)
   */
  private loadData(): Observable<SubscriptionPlan[]> {
    if (this.dataLoaded) {
      return of(this.plansSubject.value);
    }

    return this.http.get<SubscriptionPlan[]>('assets/api/subscription-plans.json').pipe(
      delay(200),
      tap(data => {
        console.log('Loaded subscription plans:', data);
        this.plansSubject.next(data);
        this.dataLoaded = true;
      })
    );
  }

  /**
   * Get all subscription plans (with nested items and values)
   */
  getAllPlans(): Observable<SubscriptionPlan[]> {
    return this.loadData().pipe(map(() => this.plansSubject.value));
  }

  /**
   * Get a specific plan by ID (with nested items and values)
   */
  getPlanById(id: number): Observable<SubscriptionPlan | undefined> {
    return this.loadData().pipe(map(() => this.plansSubject.value.find(plan => plan.id === id)));
  }

  /**
   * Get plan items for a specific plan (already nested in plan)
   */
  getPlanItems(planId: number): Observable<SubscriptionPlanItem[]> {
    return this.loadData().pipe(
      map(() => {
        const plan = this.plansSubject.value.find(p => p.id === planId);
        return plan?.items || [];
      })
    );
  }

  /**
   * Get plan item values for a specific plan item (already nested in item)
   */
  getPlanItemValues(planItemId: number): Observable<SubscriptionPlanItemValue[]> {
    return this.loadData().pipe(
      map(() => {
        for (const plan of this.plansSubject.value) {
          const item = plan.items?.find(i => i.id === planItemId);
          if (item) {
            return item.values || [];
          }
        }
        return [];
      })
    );
  }

  /**
   * Create a new subscription plan
   */
  createPlan(plan: Omit<SubscriptionPlan, 'id'>): Observable<SubscriptionPlan> {
    return this.loadData().pipe(
      delay(300),
      map(() => {
        const plans = this.plansSubject.value;
        const newId = plans.length > 0 ? Math.max(...plans.map(p => p.id)) + 1 : 1;
        // Preserve items from the payload instead of hardcoding empty array
        const newPlan: SubscriptionPlan = {
          ...plan,
          id: newId,
          items: plan.items || [],
          subscriptionCount: 0
        } as SubscriptionPlan;
        const updatedPlans = [...plans, newPlan];
        this.plansSubject.next(updatedPlans);
        console.log('Plan created in service:', newPlan);
        console.log('Updated plans array:', updatedPlans);
        return newPlan;
      })
    );
  }

  /**
   * Update an existing subscription plan
   */
  updatePlan(id: number, updates: Partial<SubscriptionPlan>): Observable<SubscriptionPlan | null> {
    return this.loadData().pipe(
      delay(300),
      map(() => {
        const plans = this.plansSubject.value;
        const index = plans.findIndex(p => p.id === id);
        if (index === -1) {
          console.error('Plan not found for update:', id);
          return null;
        }

        // Merge updates with existing plan, preserving items if provided
        const updatedPlan = {
          ...plans[index],
          ...updates,
          id,
          items: updates.items || plans[index].items || []
        };
        const updatedPlans = [...plans];
        updatedPlans[index] = updatedPlan;
        this.plansSubject.next(updatedPlans);
        console.log('Plan updated in service:', updatedPlan);
        console.log('Updated plans array:', updatedPlans);
        return updatedPlan;
      })
    );
  }

  /**
   * Duplicate a subscription plan (creates a copy with all nested items and values)
   */
  duplicatePlan(id: number): Observable<SubscriptionPlan | null> {
    return this.loadData().pipe(
      delay(300),
      map(() => {
        const plans = this.plansSubject.value;
        const planToDuplicate = plans.find(p => p.id === id);
        if (!planToDuplicate) {
          console.error('Plan not found for duplication:', id);
          return null;
        }

        // Generate new IDs
        const newPlanId = plans.length > 0 ? Math.max(...plans.map(p => p.id)) + 1 : 1;
        
        // Deep copy items with new IDs
        const newItems = planToDuplicate.items?.map((item, itemIndex) => {
          const newItemId = newPlanId * 1000 + itemIndex + 1; // Ensure unique item IDs
          const newValues = item.values?.map((value, valueIndex) => ({
            ...value,
            id: newItemId * 1000 + valueIndex + 1, // Ensure unique value IDs
            subscriptionPlanItemId: newItemId
          }));
          
          return {
            ...item,
            id: newItemId,
            subscriptionPlanId: newPlanId,
            values: newValues
          };
        });

        // Create duplicated plan
        const duplicatedPlan: SubscriptionPlan = {
          ...planToDuplicate,
          id: newPlanId,
          name: `${planToDuplicate.name} (Copy)`,
          subscriptionCount: 0,
          items: newItems
        };

        const updatedPlans = [...plans, duplicatedPlan];
        this.plansSubject.next(updatedPlans);
        console.log('Plan duplicated:', duplicatedPlan);
        return duplicatedPlan;
      })
    );
  }

  /**
   * Delete a subscription plan
   */
  deletePlan(id: number): Observable<boolean> {
    return this.loadData().pipe(
      delay(300),
      map(() => {
        const plans = this.plansSubject.value;
        const filtered = plans.filter(p => p.id !== id);
        if (filtered.length === plans.length) return false;

        this.plansSubject.next(filtered);
        return true;
      })
    );
  }

  /**
   * Create a plan item for a subscription plan
   */
  createPlanItem(
    planId: number,
    planItem: Omit<SubscriptionPlanItem, 'id' | 'subscriptionPlanId'>
  ): Observable<SubscriptionPlanItem> {
    return this.loadData().pipe(
      delay(300),
      map(() => {
        const plans = this.plansSubject.value;
        const planIndex = plans.findIndex(p => p.id === planId);
        if (planIndex === -1) throw new Error('Plan not found');

        const plan = plans[planIndex];
        const items = plan.items || [];
        const newId = items.length > 0 ? Math.max(...items.map(i => i.id)) + 1 : 1;
        const newItem: SubscriptionPlanItem = {
          id: newId,
          subscriptionPlanId: planId,
          ...planItem,
          values: []
        } as SubscriptionPlanItem;

        const updatedPlan = { ...plan, items: [...items, newItem] };
        const updatedPlans = [...plans];
        updatedPlans[planIndex] = updatedPlan;
        this.plansSubject.next(updatedPlans);

        return newItem;
      })
    );
  }

  /**
   * Create a plan item value
   */
  createPlanItemValue(
    planItemId: number,
    value: Omit<SubscriptionPlanItemValue, 'id' | 'subscriptionPlanItemId'>
  ): Observable<SubscriptionPlanItemValue> {
    return this.loadData().pipe(
      delay(300),
      map(() => {
        const plans = this.plansSubject.value;

        for (let planIndex = 0; planIndex < plans.length; planIndex++) {
          const plan = plans[planIndex];
          const itemIndex = plan.items?.findIndex(i => i.id === planItemId) ?? -1;

          if (itemIndex !== -1 && plan.items) {
            const item = plan.items[itemIndex];
            const values = item.values || [];
            const newId = values.length > 0 ? Math.max(...values.map(v => v.id)) + 1 : 1;
            const newValue: SubscriptionPlanItemValue = {
              id: newId,
              subscriptionPlanItemId: planItemId,
              ...value
            } as SubscriptionPlanItemValue;

            const updatedItem = { ...item, values: [...values, newValue] };
            const updatedItems = [...plan.items];
            updatedItems[itemIndex] = updatedItem;
            const updatedPlan = { ...plan, items: updatedItems };
            const updatedPlans = [...plans];
            updatedPlans[planIndex] = updatedPlan;
            this.plansSubject.next(updatedPlans);

            return newValue;
          }
        }

        throw new Error('Plan item not found');
      })
    );
  }
}
