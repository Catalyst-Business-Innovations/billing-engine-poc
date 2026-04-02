import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

import { BillingEngineComponent } from './billing-engine.component';
import { PlanBuilderComponent } from './features/subscription-plans/plan-builder/plan-builder.component';
import { PlansListComponent } from './features/subscription-plans/plans-list/plans-list.component';
import { NavigationComponent } from './shared/components/navigation/navigation.component';
import { IconComponent } from './shared/components/icon/icon.component';
import { BillableServicesListComponent } from './features/billable-services/billable-services-list/billable-services-list.component';
import { ServiceFormComponent } from './features/billable-services/service-form/service-form.component';
import { ChargeFormComponent } from './features/billable-services/charge-form/charge-form.component';
import { DiscountsListComponent } from './features/company-discounts/discounts-list/discounts-list.component';
import { DiscountFormComponent } from './features/company-discounts/discount-form/discount-form.component';
import { ConfirmationDialogComponent } from './shared/components/confirmation-dialog/confirmation-dialog.component';

const routes: Routes = [
  { path: '', component: BillingEngineComponent }
];

@NgModule({
  declarations: [
    BillingEngineComponent,
    PlanBuilderComponent,
    PlansListComponent,
    NavigationComponent,
    IconComponent,
    BillableServicesListComponent,
    ServiceFormComponent,
    ChargeFormComponent,
    DiscountsListComponent,
    DiscountFormComponent,
    ConfirmationDialogComponent
  ],
  imports: [
    CommonModule,
    HttpClientModule,
    FormsModule,
    RouterModule.forChild(routes)
  ]
})
export class BillingEngineModule {}
