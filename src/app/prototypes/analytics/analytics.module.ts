import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AnalyticsComponent } from './analytics.component';

const routes: Routes = [
  { path: '', component: AnalyticsComponent }
];

@NgModule({
  declarations: [AnalyticsComponent],
  imports: [RouterModule.forChild(routes)]
})
export class AnalyticsModule {}
