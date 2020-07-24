import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {PerfectScrollbarDirective} from "@sked/app/layout/directives/perfect-scroll-bar.directive";
import {MainVerticalNavbar} from "@sked/app/layout/components/main-vertical-navbar/main-vertical-navbar.component";
import {FlexLayoutModule} from "@angular/flex-layout";
import {MainLayoutComponent} from './components/main-layout/main-layout.component';
import {MatIconModule} from "@angular/material/icon";
import {MatButtonModule} from "@angular/material/button";
import {RouterModule} from "@angular/router";
import {MainToolbarComponent} from "@sked/app/layout/components/main-toolbar/main-toolbar.component";
import {MatMenuModule} from "@angular/material/menu";
import {MatToolbarModule} from "@angular/material/toolbar";
import {SidebarComponent} from './components/sidebar/sidebar.component';
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";
import {PageContentComponent} from './components/page-content/page-content.component';


@NgModule({
  declarations: [MainVerticalNavbar, PerfectScrollbarDirective, MainLayoutComponent, MainToolbarComponent, SidebarComponent, PageContentComponent],
  exports: [
    MainLayoutComponent,
    PageContentComponent
  ],
  imports: [
    BrowserAnimationsModule,
    CommonModule,
    FlexLayoutModule,
    MatIconModule,
    MatButtonModule,
    RouterModule,
    MatMenuModule,
    MatToolbarModule,
  ]
})
export class LayoutModule {
}
