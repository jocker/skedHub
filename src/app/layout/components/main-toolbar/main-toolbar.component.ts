import {Component, OnDestroy, OnInit} from '@angular/core';
import {takeUntil} from 'rxjs/operators';
import {LayoutConfigService} from "@sked/app/layout/services/layout-config.service";
import {LifecycleHooks, onLifecycleDestroy} from "@sked/lib/lifecycle_utils";

@LifecycleHooks()
@Component({
  selector: 'app-main-toolbar',
  templateUrl: './main-toolbar.component.html',
  styleUrls: ['./main-toolbar.component.scss']
})

export class MainToolbarComponent implements OnInit, OnDestroy {
  horizontalNavbar: boolean;
  rightNavbar: boolean;
  hiddenNavbar: boolean;
  languages: any;
  navigation: any;
  userStatusOptions: any[];


  constructor(
    private svcLayoutConfig: LayoutConfigService,
  ) {
    this.userStatusOptions = [
      {
        title: 'Online',
        icon: 'icon-checkbox-marked-circle',
        color: '#4CAF50'
      },
      {
        title: 'Away',
        icon: 'icon-clock',
        color: '#FFC107'
      },
      {
        title: 'Do not Disturb',
        icon: 'icon-minus-circle',
        color: '#F44336'
      },
      {
        title: 'Invisible',
        icon: 'icon-checkbox-blank-circle-outline',
        color: '#BDBDBD'
      },
      {
        title: 'Offline',
        icon: 'icon-checkbox-blank-circle-outline',
        color: '#616161'
      }
    ];

    this.languages = [
      {
        id: 'en',
        title: 'English',
        flag: 'us'
      },
      {
        id: 'tr',
        title: 'Turkish',
        flag: 'tr'
      }
    ];

  }

  ngOnInit(): void {
    // Subscribe to the config changes
    this.svcLayoutConfig.onConfigChanged('toolbar')
      .pipe(takeUntil(onLifecycleDestroy(this)))
      .subscribe((settings) => {
        this.horizontalNavbar = settings.navbar.position === 'top';
        this.rightNavbar = settings.navbar.position === 'right';
        this.hiddenNavbar = settings.navbar.hidden === true;
      });

  }

  ngOnDestroy(): void {
  }

  toggleSidebarOpen(key): void {
    this.svcLayoutConfig.getNavSidebar().toggleOpen()
  }

  search(value): void {
    console.log(value);
  }

  /**
   * Set the language
   *
   * @param lang
   */
  setLanguage(lang): void {

  }
}
