import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {TimelineViewComponent} from './components/timeline-view/timeline-view.component';
import {FlexLayoutModule} from "@angular/flex-layout";
import {LayoutModule} from "@sked/app/layout/layout.module";


@NgModule({
    declarations: [TimelineViewComponent],
    exports: [
        TimelineViewComponent
    ],
  imports: [
    CommonModule,
    FlexLayoutModule,
    LayoutModule
  ]
})
export class TimelineModule { }
