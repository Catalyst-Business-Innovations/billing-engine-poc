import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  {
    path: 'billing-engine',
    loadChildren: () =>
      import('./prototypes/billing-engine/billing-engine.module').then(m => m.BillingEngineModule)
  },
  {
    path: 'analytics',
    loadChildren: () =>
      import('./prototypes/analytics/analytics.module').then(m => m.AnalyticsModule)
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
