import {
  Component,
  OnInit,
  OnDestroy,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CompanyDiscount } from '../models/company-discount.model';
import { DiscountFilterStatus } from '../models/discount-types';
import { DiscountService } from '../services/discount.service';

/**
 * Company Discounts List Component
 *
 * A smart list component displaying and managing company-specific discounts.
 *
 * Features:
 * - OnPush change detection for optimal performance
 * - Real-time search filtering across multiple fields
 * - Status-based filtering with memoized counts
 * - TrackBy functions for ngFor optimization
 * - Type-safe enum for filter statuses
 *
 * Performance Optimizations:
 * - Status counts are memoized to avoid recalculation on every change detection cycle
 * - OnPush strategy ensures component only updates when inputs change or events fire
 * - TrackBy prevents unnecessary DOM re-renders
 *
 * @example
 * <app-discounts-list
 *   (addDiscountClicked)="handleAdd()"
 *   (editDiscountClicked)="handleEdit($event)">
 * </app-discounts-list>
 */

@Component({
  selector: 'app-discounts-list',
  templateUrl: './discounts-list.component.html',
  styleUrls: ['./discounts-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DiscountsListComponent implements OnInit, OnDestroy {
  @Output() addDiscountClicked = new EventEmitter<void>();
  @Output() editDiscountClicked = new EventEmitter<number>();

  private destroy$ = new Subject<void>();
  
  // Confirmation dialog state
  showDeleteConfirmDialog = false;
  discountToDelete: CompanyDiscount | null = null;

  discounts: CompanyDiscount[] = [];
  filteredDiscounts: CompanyDiscount[] = [];
  searchText = '';
  filterStatus: DiscountFilterStatus = DiscountFilterStatus.All;

  // Memoized status counts
  private statusCountsCache = new Map<DiscountFilterStatus, number>();

  constructor(
    private discountService: DiscountService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadDiscounts();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadDiscounts(): void {
    this.discountService
      .getAllDiscounts()
      .pipe(takeUntil(this.destroy$))
      .subscribe(discounts => {
        this.discounts = discounts;
        this.applyFilters();
        this.updateStatusCounts();
        this.cdr.markForCheck();
      });
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  setStatusFilter(status: DiscountFilterStatus): void {
    this.filterStatus = status;
    this.applyFilters();
  }

  applyFilters(): void {
    this.filteredDiscounts = this.discounts.filter(discount => {
      const matchesSearch =
        !this.searchText ||
        discount.company.name.toLowerCase().includes(this.searchText.toLowerCase()) ||
        discount.company.code.toLowerCase().includes(this.searchText.toLowerCase()) ||
        discount.reason.toLowerCase().includes(this.searchText.toLowerCase());

      const matchesStatus =
        this.filterStatus === DiscountFilterStatus.All ||
        (this.filterStatus === DiscountFilterStatus.Active && discount.isActive && !this.isExpired(discount)) ||
        (this.filterStatus === DiscountFilterStatus.Inactive && !discount.isActive) ||
        (this.filterStatus === DiscountFilterStatus.Expired && this.isExpired(discount));

      return matchesSearch && matchesStatus;
    });
  }

  isExpired(discount: CompanyDiscount): boolean {
    if (!discount.effectiveEndDate) return false;
    return new Date(discount.effectiveEndDate) < new Date();
  }

  private updateStatusCounts(): void {
    this.statusCountsCache.clear();
    this.statusCountsCache.set(DiscountFilterStatus.All, this.discounts.length);
    this.statusCountsCache.set(
      DiscountFilterStatus.Active,
      this.discounts.filter(d => d.isActive && !this.isExpired(d)).length
    );
    this.statusCountsCache.set(DiscountFilterStatus.Inactive, this.discounts.filter(d => !d.isActive).length);
    this.statusCountsCache.set(DiscountFilterStatus.Expired, this.discounts.filter(d => this.isExpired(d)).length);
  }

  getStatusCount(status: DiscountFilterStatus): number {
    return this.statusCountsCache.get(status) ?? 0;
  }

  formatDiscountValue(discount: CompanyDiscount): string {
    return discount.discountType === 'Percentage'
      ? `${discount.discountValue}%`
      : `$${discount.discountValue.toFixed(2)}`;
  }

  formatDate(date: string | null): string {
    if (!date) return 'No end date';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  getStatusBadgeClass(discount: CompanyDiscount): string {
    if (this.isExpired(discount)) return 'expired';
    return discount.isActive ? 'active' : 'inactive';
  }

  getStatusLabel(discount: CompanyDiscount): string {
    if (this.isExpired(discount)) return 'Expired';
    return discount.isActive ? 'Active' : 'Inactive';
  }

  onAddDiscount(): void {
    this.addDiscountClicked.emit();
  }

  onEditDiscount(discountId: number): void {
    this.editDiscountClicked.emit(discountId);
  }

  deleteDiscount(discount: CompanyDiscount, event: Event): void {
    event.stopPropagation();
    this.discountToDelete = discount;
    this.showDeleteConfirmDialog = true;
    this.cdr.markForCheck();
  }

  onConfirmDelete(): void {
    if (this.discountToDelete) {
      this.discountService
        .deleteDiscount(this.discountToDelete.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe(success => {
          if (success) {
            this.loadDiscounts();
          }
        });
    }
    this.showDeleteConfirmDialog = false;
    this.discountToDelete = null;
    this.cdr.markForCheck();
  }

  onCancelDelete(): void {
    this.showDeleteConfirmDialog = false;
    this.discountToDelete = null;
    this.cdr.markForCheck();
  }

  getDeleteMessage(): string {
    return this.discountToDelete 
      ? `Are you sure you want to delete the discount for ${this.discountToDelete.company.name}? This action cannot be undone.`
      : 'Are you sure you want to delete this discount?';
  }

  trackByDiscountId(index: number, discount: CompanyDiscount): number {
    return discount.id;
  }

  // Expose enum to template
  readonly DiscountFilterStatus = DiscountFilterStatus;
}
