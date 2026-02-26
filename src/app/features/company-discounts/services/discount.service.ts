import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { map, tap, delay } from 'rxjs/operators';
import { CompanyDiscount } from '../models/company-discount.model';

/**
 * Company Discount Service
 *
 * Simulates REST API endpoints for company discount management.
 * In production, replace the JSON file loading with actual HTTP calls to backend APIs.
 *
 * API Endpoints Pattern:
 * - GET    /api/discounts              -> getAllDiscounts()
 * - GET    /api/discounts/:id          -> getDiscountById(id)
 * - GET    /api/discounts/company/:id  -> getDiscountsByCompany(companyId)
 * - POST   /api/discounts              -> createDiscount(discount)
 * - PUT    /api/discounts/:id          -> updateDiscount(id, discount)
 * - DELETE /api/discounts/:id          -> deleteDiscount(id)
 * - PATCH  /api/discounts/:id/status   -> toggleDiscountStatus(id)
 */
@Injectable({
  providedIn: 'root'
})
export class DiscountService {
  private readonly API_BASE_URL = '/assets/api';
  private discountsCache$ = new BehaviorSubject<CompanyDiscount[]>([]);
  private nextId = 3; // Start after existing mock data

  constructor(private http: HttpClient) {
    this.loadDiscounts();
  }

  /**
   * Load discounts from JSON file (simulates API call)
   * @private
   */
  private loadDiscounts(): void {
    this.http
      .get<CompanyDiscount[]>(`${this.API_BASE_URL}/company-discounts.json`)
      .pipe(
        tap(discounts => {
          this.discountsCache$.next(discounts);
          // Update nextId based on existing data
          const maxId = Math.max(...discounts.map(d => d.id), 0);
          this.nextId = maxId + 1;
        })
      )
      .subscribe();
  }

  /**
   * GET /api/discounts
   * Retrieve all company discounts
   * @returns Observable<CompanyDiscount[]>
   */
  getAllDiscounts(): Observable<CompanyDiscount[]> {
    return this.discountsCache$.asObservable().pipe(delay(300));
  }

  /**
   * GET /api/discounts/:id
   * Retrieve a single discount by ID
   * @param id Discount ID
   * @returns Observable<CompanyDiscount | undefined>
   */
  getDiscountById(id: number): Observable<CompanyDiscount | undefined> {
    return this.discountsCache$.pipe(
      map(discounts => discounts.find(d => d.id === id)),
      delay(200)
    );
  }

  /**
   * GET /api/discounts/company/:companyId
   * Retrieve all discounts for a specific company
   * @param companyId Company ID
   * @returns Observable<CompanyDiscount[]>
   */
  getDiscountsByCompany(companyId: number): Observable<CompanyDiscount[]> {
    return this.discountsCache$.pipe(
      map(discounts => discounts.filter(d => d.companyId === companyId)),
      delay(200)
    );
  }

  /**
   * GET /api/discounts/active
   * Retrieve only active discounts
   * @returns Observable<CompanyDiscount[]>
   */
  getActiveDiscounts(): Observable<CompanyDiscount[]> {
    return this.discountsCache$.pipe(
      map(discounts =>
        discounts.filter(d => {
          if (!d.isActive) return false;
          if (d.effectiveEndDate && new Date(d.effectiveEndDate) < new Date()) return false;
          return true;
        })
      ),
      delay(200)
    );
  }

  /**
   * POST /api/discounts
   * Create a new company discount
   * @param discount Discount data
   * @param currentUser Current user creating the discount
   * @returns Observable<CompanyDiscount>
   */
  createDiscount(discount: Partial<CompanyDiscount>, currentUser = 'System'): Observable<CompanyDiscount> {
    const currentDiscounts = this.discountsCache$.value;
    const now = new Date().toISOString();

    const newDiscount: CompanyDiscount = {
      id: this.nextId++,
      companyId: discount.companyId || 0,
      company: discount.company || { id: 0, code: '', name: '' },
      discountType: discount.discountType || 'Percentage',
      discountValue: discount.discountValue || 0,
      effectiveStartDate: discount.effectiveStartDate || new Date().toISOString().split('T')[0],
      effectiveEndDate: discount.effectiveEndDate || null,
      reason: discount.reason || '',
      notes: discount.notes || undefined,
      isActive: discount.isActive ?? true,
      createdBy: currentUser,
      createdAt: now,
      modifiedBy: undefined,
      modifiedAt: undefined
    };

    const updatedDiscounts = [...currentDiscounts, newDiscount];
    this.discountsCache$.next(updatedDiscounts);

    return of(newDiscount).pipe(delay(500));
  }

  /**
   * PUT /api/discounts/:id
   * Update an existing company discount
   * @param id Discount ID
   * @param discount Updated discount data
   * @param currentUser Current user updating the discount
   * @returns Observable<CompanyDiscount | null>
   */
  updateDiscount(
    id: number,
    discount: Partial<CompanyDiscount>,
    currentUser = 'System'
  ): Observable<CompanyDiscount | null> {
    const currentDiscounts = this.discountsCache$.value;
    const index = currentDiscounts.findIndex(d => d.id === id);

    if (index === -1) {
      return of(null).pipe(delay(200));
    }

    const now = new Date().toISOString();
    const updatedDiscount: CompanyDiscount = {
      ...currentDiscounts[index],
      ...discount,
      id, // Preserve original ID
      createdBy: currentDiscounts[index].createdBy, // Preserve original creator
      createdAt: currentDiscounts[index].createdAt, // Preserve original creation date
      modifiedBy: currentUser,
      modifiedAt: now
    };

    const updatedDiscounts = [...currentDiscounts];
    updatedDiscounts[index] = updatedDiscount;
    this.discountsCache$.next(updatedDiscounts);

    return of(updatedDiscount).pipe(delay(500));
  }

  /**
   * DELETE /api/discounts/:id
   * Delete a company discount
   * @param id Discount ID
   * @returns Observable<boolean>
   */
  deleteDiscount(id: number): Observable<boolean> {
    const currentDiscounts = this.discountsCache$.value;
    const filtered = currentDiscounts.filter(d => d.id !== id);

    if (filtered.length === currentDiscounts.length) {
      return of(false).pipe(delay(200)); // Not found
    }

    this.discountsCache$.next(filtered);
    return of(true).pipe(delay(500));
  }

  /**
   * PATCH /api/discounts/:id/status
   * Toggle discount active status
   * @param id Discount ID
   * @param currentUser Current user making the change
   * @returns Observable<CompanyDiscount | null>
   */
  toggleDiscountStatus(id: number, currentUser = 'System'): Observable<CompanyDiscount | null> {
    const currentDiscounts = this.discountsCache$.value;
    const discount = currentDiscounts.find(d => d.id === id);

    if (!discount) {
      return of(null).pipe(delay(200));
    }

    return this.updateDiscount(id, { isActive: !discount.isActive }, currentUser);
  }

  /**
   * Force refresh discounts from source
   * @returns Observable<CompanyDiscount[]>
   */
  refreshDiscounts(): Observable<CompanyDiscount[]> {
    this.loadDiscounts();
    return this.getAllDiscounts();
  }
}
