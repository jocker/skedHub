import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {TimelineViewComponent} from "@sked/app/timeline/components/timeline-view/timeline-view.component";

const routes: Routes = [{
  path: '',
  component: TimelineViewComponent
}];

@NgModule({
  imports: [RouterModule.forRoot(routes,{enableTracing: false})],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
