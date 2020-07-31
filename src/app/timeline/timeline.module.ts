import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {TimelineViewComponent} from './components/timeline-view/timeline-view.component';
import {FlexLayoutModule} from "@angular/flex-layout";
import {LayoutModule} from "@sked/app/layout/layout.module";
import {MatIconModule} from "@angular/material/icon";


@NgModule({
    declarations: [TimelineViewComponent],
    exports: [
        TimelineViewComponent
    ],
    imports: [
        CommonModule,
        FlexLayoutModule,
        LayoutModule,
        MatIconModule
    ]
})
export class TimelineModule { }
