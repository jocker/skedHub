import {Component, OnInit} from '@angular/core';
import {LayoutConfig} from "@sked/app/layout/services/layout_config";
import {LayoutConfigService} from "@sked/app/layout/services/layout-config.service";

@Component({
  selector: 'app-main-layout',
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.scss'],
  host: {id: 'main_layout'}
})
export class MainLayoutComponent implements OnInit {

  layoutConfig: LayoutConfig

  constructor(
    private svcLayout: LayoutConfigService
  ) {
    this.layoutConfig = svcLayout.layoutConfig
  }

  ngOnInit(): void {
  }

}
