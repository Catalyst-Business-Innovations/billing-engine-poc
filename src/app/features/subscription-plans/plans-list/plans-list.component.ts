import { Component, OnInit, EventEmitter, Output } from '@angular/core';
import { SubscriptionPlan, SubscriptionPlanItem } from '../models';
import {
  SubscriptionPlanType,
  Status,
  SubscriptionPlanTypeLabels,
  StatusLabels,
  Apps,
  AppLabels
} from '../../../models';
import { SubscriptionPlanService } from '../services/subscription-plan.service';

export interface SubscriptionPlanSummary {
  id: number;
  name: string;
  description: string;
  planType: SubscriptionPlanType;
  planTypeDisplay: string;
  status: Status;
  statusDisplay: string;
  subscriptionCount: number;
  serviceCount: number;
  appIds: number[];
}

@Component({
  selector: 'app-plans-list',
  templateUrl: './plans-list.component.html',
  styleUrls: ['./plans-list.component.scss']
})
export class PlansListComponent implements OnInit {
  @Output() addPlanClicked = new EventEmitter<void>();
  @Output() editPlanClicked = new EventEmitter<number>();
  @Output() duplicatePlanClicked = new EventEmitter<number>();

  plans: SubscriptionPlanSummary[] = [];
  filteredPlans: SubscriptionPlanSummary[] = [];
  searchText = '';
  filterStatus: 'all' | 'active' | 'inactive' = 'all';
  
  // Confirmation dialog state
  showDeleteConfirmDialog = false;
  planToDelete: SubscriptionPlanSummary | null = null;

  // Enum label references for easy access
  private readonly planTypeLabels = SubscriptionPlanTypeLabels;
  private readonly statusLabels = StatusLabels;

  constructor(private subscriptionPlanService: SubscriptionPlanService) {}

  ngOnInit(): void {
    this.loadPlans();
  }

  // ─── Data Loading ─────────────────────────────────────────────────────────────

  loadPlans(): void {
    this.subscriptionPlanService.getAllPlans().subscribe(plans => {
      console.log('Received plans in component:', plans);
      // Transform plans with nested data into summary format
      this.plans = plans.map(plan => {
        // Extract unique app IDs from plan items
        const appIds = plan.items
          ? [
              ...new Set(
                plan.items
                  .map(item => item.service?.appId)
                  .filter((appId): appId is number => appId !== null && appId !== undefined)
              )
            ]
          : [];

        return {
          id: plan.id,
          name: plan.name,
          description: plan.description || `Plan with ${plan.items?.length || 0} service(s)`,
          planType: plan.type,
          planTypeDisplay: this.planTypeLabels[plan.type],
          status: plan.status,
          statusDisplay: this.statusLabels[plan.status],
          subscriptionCount: plan.subscriptionCount,
          serviceCount: plan.items?.length || 0,
          appIds: appIds
        };
      });

      this.applyFilters();
    });
  }

  applyFilters(): void {
    this.filteredPlans = this.plans.filter(plan => {
      const matchesSearch =
        !this.searchText ||
        plan.name.toLowerCase().includes(this.searchText.toLowerCase()) ||
        plan.description.toLowerCase().includes(this.searchText.toLowerCase());

      const matchesStatus =
        this.filterStatus === 'all' ||
        (this.filterStatus === 'active' && plan.status === Status.Active) ||
        (this.filterStatus === 'inactive' && plan.status === Status.Inactive);

      return matchesSearch && matchesStatus;
    });
  }

  getActiveCount(): number {
    return this.plans.filter(p => p.status === Status.Active).length;
  }

  getInactiveCount(): number {
    return this.plans.filter(p => p.status === Status.Inactive).length;
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  setStatusFilter(status: 'all' | 'active' | 'inactive'): void {
    this.filterStatus = status;
    this.applyFilters();
  }

  onAddPlan(): void {
    this.addPlanClicked.emit();
  }

  onEditPlan(planId: number): void {
    this.editPlanClicked.emit(planId);
  }

  togglePlanStatus(plan: SubscriptionPlanSummary, event: Event): void {
    event.stopPropagation();
    
    // Prevent deactivation if plan has active subscribers
    if (plan.status === Status.Active && plan.subscriptionCount > 0) {
      console.warn(`Cannot deactivate "${plan.name}" as it has ${plan.subscriptionCount} active subscriber(s). Please ensure all subscribers are removed before deactivating this plan.`);
      return;
    }
    
    plan.status = plan.status === Status.Active ? Status.Inactive : Status.Active;
    plan.statusDisplay = this.statusLabels[plan.status];
    this.applyFilters();
  }

  duplicatePlan(plan: SubscriptionPlanSummary, event: Event): void {
    event.stopPropagation();
    this.duplicatePlanClicked.emit(plan.id);
  }

  deletePlan(plan: SubscriptionPlanSummary, event: Event): void {
    event.stopPropagation();
    
    // Prevent deletion if plan has active subscribers
    if (plan.subscriptionCount > 0) {
      console.warn(`Cannot delete "${plan.name}" as it has ${plan.subscriptionCount} active subscriber(s). Please ensure all subscribers are removed before deleting this plan.`);
      return;
    }
    
    this.planToDelete = plan;
    this.showDeleteConfirmDialog = true;
  }

  onConfirmDelete(): void {
    if (this.planToDelete) {
      this.subscriptionPlanService.deletePlan(this.planToDelete.id).subscribe(success => {
        if (success) {
          this.loadPlans();
        }
      });
    }
    this.showDeleteConfirmDialog = false;
    this.planToDelete = null;
  }

  onCancelDelete(): void {
    this.showDeleteConfirmDialog = false;
    this.planToDelete = null;
  }

  getDeleteMessage(): string {
    return this.planToDelete 
      ? `Are you sure you want to delete "${this.planToDelete.name}"? This action cannot be undone.`
      : 'Are you sure you want to delete this plan?';
  }

  // ─── Helper Methods ───────────────────────────────────────────────────────────

  getAppLogo(appId: number): string {
    const logos: Record<number, string> = {
      1: 'assets/TPMLogo.png', // TPM Portal
      2: 'assets/POSLogo.png', // POS
      4: 'assets/ListerLogo.png' // Lister
    };
    return logos[appId] || '';
  }

  getAppName(appId: number): string {
    return AppLabels[appId as Apps] || 'Unknown';
  }

  canDeactivate(plan: SubscriptionPlanSummary): boolean {
    return plan.status === Status.Inactive || plan.subscriptionCount === 0;
  }

  canDelete(plan: SubscriptionPlanSummary): boolean {
    return plan.subscriptionCount === 0;
  }

  getDeactivateTooltip(plan: SubscriptionPlanSummary): string {
    if (plan.status === Status.Inactive) {
      return 'Activate';
    }
    if (plan.subscriptionCount > 0) {
      return `Cannot deactivate - ${plan.subscriptionCount} active subscriber(s)`;
    }
    return 'Deactivate';
  }

  getDeleteTooltip(plan: SubscriptionPlanSummary): string {
    if (plan.subscriptionCount > 0) {
      return `Cannot delete - ${plan.subscriptionCount} active subscriber(s)`;
    }
    return 'Delete';
  }
}
