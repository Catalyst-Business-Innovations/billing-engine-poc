import { Component, EventEmitter, Output, Input, OnInit } from '@angular/core';
import { BillableServiceService } from '../services/billable-service.service';

@Component({
  selector: 'app-charge-form',
  templateUrl: './charge-form.component.html',
  styleUrls: ['./charge-form.component.scss']
})
export class ChargeFormComponent implements OnInit {
  @Input() serviceId: number | null = null;
  @Input() chargeId: number | null = null;
  @Output() closeForm = new EventEmitter<void>();
  @Output() saveCharge = new EventEmitter<any>();

  formData = {
    name: '',
    type: 'Flat' as 'Flat' | 'PerSeat' | 'PerTransaction' | 'PercentageOfRevenue',
    frequency: 'PerBillingCycle' as 'PerBillingCycle' | 'OneTime',
    defaultValue: 0,
    valueDataType: 'money' as 'money' | 'percentage',
    isSystemDefault: false
  };

  chargeTypes: Array<'Flat' | 'PerSeat' | 'PerTransaction' | 'PercentageOfRevenue'> = [
    'Flat',
    'PerSeat',
    'PerTransaction',
    'PercentageOfRevenue'
  ];

  frequencies: Array<'PerBillingCycle' | 'OneTime'> = ['PerBillingCycle', 'OneTime'];

  constructor(private billableServiceService: BillableServiceService) {}

  ngOnInit(): void {
    if (this.chargeId && this.serviceId) {
      // Load existing charge data
      this.loadChargeData();
    }
  }

  loadChargeData(): void {
    if (!this.chargeId || !this.serviceId) return;

    this.billableServiceService.loadData().subscribe(() => {
      const charges = this.billableServiceService.getChargesForService(this.serviceId!);
      const charge = charges.find(c => c.id === this.chargeId);

      if (charge) {
        this.formData = {
          name: charge.name,
          type: charge.type,
          frequency: charge.frequency,
          defaultValue: charge.defaultValue,
          valueDataType: charge.valueDataType,
          isSystemDefault: charge.isSystemDefault
        };
      }
    });
  }

  onSubmit(): void {
    if (this.formData.name.trim() && this.formData.defaultValue >= 0) {
      this.saveCharge.emit({
        ...this.formData,
        billableServiceId: this.serviceId,
        id: this.chargeId || Date.now()
      });
      this.closeForm.emit();
    }
  }

  onCancel(): void {
    this.closeForm.emit();
  }

  onTypeChange(): void {
    if (this.formData.type === 'PercentageOfRevenue') {
      this.formData.valueDataType = 'percentage';
    } else {
      this.formData.valueDataType = 'money';
    }
  }

  getTypeIcon(type: string): string {
    const map: Record<string, string> = {
      Flat: '$',
      PerSeat: '#',
      PerTransaction: '↻',
      PercentageOfRevenue: '%'
    };
    return map[type] || '$';
  }

  getTypeLabel(type: string): string {
    return type.replace(/([A-Z])/g, ' $1').trim();
  }
}
