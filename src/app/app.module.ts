import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
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

@NgModule({
  declarations: [
    AppComponent,
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
  imports: [BrowserModule, CommonModule, HttpClientModule, FormsModule],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {}
