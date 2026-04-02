import {
  Component,
  OnInit,
  OnDestroy,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CompanyDiscount } from '../models/company-discount.model';
import { Company } from '../models/company.interface';
import { DiscountTypeOption } from '../models/discount-types';
import { DISCOUNT_CONSTANTS } from '../constants/discount.constants';
import { CompanyService } from '../services/company.service';
import { DiscountService } from '../services/discount.service';

/**
 * Company Discount Form Component
 *
 * A smart form component for creating and editing company-specific discounts.
 *
 * Features:
 * - OnPush change detection for optimal performance
 * - Searchable company dropdown with autocomplete
 * - Type-safe form data with proper interfaces
 * - Reactive getters instead of method calls in templates
 * - TrackBy functions for ngFor optimization
 *
 * @example
 * <app-discount-form
 *   [discountId]="selectedDiscountId"
 *   (closeForm)="handleClose()"
 *   (saveDiscount)="handleSave($event)">
 * </app-discount-form>
 */

@Component({
  selector: 'app-discount-form',
  templateUrl: './discount-form.component.html',
  styleUrls: ['./discount-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DiscountFormComponent implements OnInit, OnDestroy {
  @Input() discountId: number | null = null;
  @Output() closeForm = new EventEmitter<void>();
  @Output() saveDiscount = new EventEmitter<Partial<CompanyDiscount>>();

  private destroy$ = new Subject<void>();

  formData = {
    companyId: 0,
    companyName: '',
    discountType: 'Percentage' as 'Percentage' | 'FlatAmount',
    discountValue: 0,
    effectiveStartDate: '',
    effectiveEndDate: '',
    reason: '',
    notes: '',
    isActive: true
  };

  companySearchText = '';
  showCompanyDropdown = false;
  showCalculationInfo = false;

  allCompanies: Company[] = [];

  readonly discountTypes: ReadonlyArray<DiscountTypeOption> = [
    { value: 'Percentage', label: 'Percentage Discount', description: 'Percentage off total subscription' },
    { value: 'FlatAmount', label: 'Flat Amount', description: 'Fixed dollar amount off' }
  ];

  // Constants
  readonly maxPercentageValue = DISCOUNT_CONSTANTS.MAX_PERCENTAGE_VALUE;
  readonly maxFlatAmountValue = DISCOUNT_CONSTANTS.MAX_FLAT_AMOUNT_VALUE;
  readonly percentageStep = DISCOUNT_CONSTANTS.PERCENTAGE_STEP;
  readonly flatAmountStep = DISCOUNT_CONSTANTS.FLAT_AMOUNT_STEP;

  constructor(
    private companyService: CompanyService,
    private discountService: DiscountService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Load companies from service
    this.companyService
      .getAllCompanies()
      .pipe(takeUntil(this.destroy$))
      .subscribe(companies => {
        this.allCompanies = companies;
        this.cdr.markForCheck();
      });

    if (this.discountId) {
      this.loadDiscount();
    } else {
      // Set default start date to today
      const today = new Date().toISOString().split('T')[0];
      this.formData.effectiveStartDate = today;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadDiscount(): void {
    if (!this.discountId) return;

    this.discountService
      .getDiscountById(this.discountId)
      .pipe(takeUntil(this.destroy$))
      .subscribe(discount => {
        if (discount) {
          this.formData = {
            companyId: discount.companyId,
            companyName: discount.company.name,
            discountType: discount.discountType,
            discountValue: discount.discountValue,
            effectiveStartDate: discount.effectiveStartDate,
            effectiveEndDate: discount.effectiveEndDate || '',
            reason: discount.reason,
            notes: discount.notes || '',
            isActive: discount.isActive
          };
          this.companySearchText = discount.company.name;
          this.cdr.markForCheck();
        }
      });
  }

  get filteredCompanies(): ReadonlyArray<Company> {
    if (!this.companySearchText.trim()) {
      return this.allCompanies.slice(0, DISCOUNT_CONSTANTS.DEFAULT_COMPANIES_DISPLAY_COUNT);
    }
    const searchLower = this.companySearchText.toLowerCase();
    return this.allCompanies.filter(
      c => c.name.toLowerCase().includes(searchLower) || c.code.toLowerCase().includes(searchLower)
    );
  }

  onCompanyInputFocus(): void {
    this.showCompanyDropdown = true;
  }

  onCompanyInputChange(): void {
    this.showCompanyDropdown = true;
    // Clear selection if user modifies the text
    if (this.companySearchText !== this.formData.companyName) {
      this.formData.companyId = 0;
      this.formData.companyName = '';
    }
  }

  selectCompany(company: Company): void {
    this.formData.companyId = company.id;
    this.formData.companyName = company.name;
    this.companySearchText = company.name;
    this.showCompanyDropdown = false;
  }

  closeCompanyDropdown(): void {
    setTimeout(() => {
      this.showCompanyDropdown = false;
      // Restore company name if no selection was made
      if (!this.formData.companyId) {
        this.companySearchText = '';
      }
    }, DISCOUNT_CONSTANTS.DROPDOWN_CLOSE_DELAY);
  }

  setDiscountType(type: string): void {
    this.formData.discountType = type as 'Percentage' | 'FlatAmount';
    // Reset value when type changes
    this.formData.discountValue = 0;
  }

  get maxDiscountValue(): number {
    return this.formData.discountType === 'Percentage' ? this.maxPercentageValue : this.maxFlatAmountValue;
  }

  get discountStep(): number {
    return this.formData.discountType === 'Percentage' ? this.percentageStep : this.flatAmountStep;
  }

  trackByCompanyId(index: number, company: Company): number {
    return company.id;
  }

  trackByDiscountTypeValue(index: number, type: DiscountTypeOption): string {
    return type.value;
  }

  isFormValid(): boolean {
    return (
      this.formData.companyId > 0 &&
      this.formData.discountValue > 0 &&
      this.formData.effectiveStartDate.length > 0 &&
      this.formData.reason.trim().length > 0
    );
  }

  onCancel(): void {
    this.closeForm.emit();
  }

  onSubmit(): void {
    if (this.isFormValid()) {
      const selectedCompany = this.allCompanies.find(c => c.id === this.formData.companyId);

      this.saveDiscount.emit({
        ...this.formData,
        company: selectedCompany,
        id: this.discountId || Date.now()
      });
      this.closeForm.emit();
    }
  }
}
