import {Inject, Injectable} from '@angular/core';
import {
  LayoutConfig,
  LayoutConfigSection,
  LayoutFooterConfig,
  LayoutNavbarConfig,
  LayoutSidebarConfig,
  LayoutThemeConfig,
  LayoutToolbarConfig
} from "@sked/app/layout/services/layout_config";
import {BehaviorSubject, Observable} from "rxjs";
import {deepClone, deepEqual, getNestedObject} from "@sked/lib/utils";
import {distinctUntilChanged, map} from "rxjs/operators";
import {isObject} from "@sked/lib/type_check_utils";
import {SidebarComponent} from "@sked/app/layout/components/sidebar/sidebar.component";
import {onLifecycleDestroy} from "@sked/lib/lifecycle_utils";
import {MediaObserver} from "@angular/flex-layout";
import {DOCUMENT} from "@angular/common";

const defaultLayoutConfig: Readonly<LayoutConfig> = Object.freeze({
  sidebar: {
    hidden: false,
  },
  theme: {
    colorTheme: 'theme-default',
    customScrollbars: false,
    style: 'vertical-layout-1'
  },
  navbar: {
    primaryBackground: 'fuse-navy-700',
    secondaryBackground: 'fuse-navy-900',
    folded: false,
    hidden: false,
    position: 'left',
    variant: 'vertical-style-1'
  },
  toolbar: {
    customBackgroundColor: false,
    background: 'fuse-white-500',
    hidden: false,
    position: 'below-static'
  },
  footer: {
    customBackgroundColor: true,
    background: 'fuse-navy-900',
    hidden: true,
    position: 'below-fixed'
  }
})


@Injectable({
  providedIn: 'root'
})
export class LayoutConfigService {

  private textMeasureCanvas: HTMLCanvasElement

  private configSubject = new BehaviorSubject(deepClone(defaultLayoutConfig) as LayoutConfig)

  private registeredSidebars = new Map<string, SidebarComponent>()

  constructor(
    private _observableMedia: MediaObserver,
    @Inject(DOCUMENT) private document: Document,
  ) {

    window['LayoutConfigService'] = this

    this.configSubject.pipe(
      map(value => value.theme.colorTheme),
      distinctUntilChanged()
    ).subscribe(newTheme => {
      const body = document.body
      for (const cssClass of Array.from(body.classList)) {
        if (cssClass.startsWith('theme-')) {
          if (cssClass == newTheme) {
            return
          }
          body.classList.remove(cssClass)
          break
        }
      }
      body.classList.add(newTheme)
    })



  }

  onActiveMediaQueryChanged(mediaQuery: string): Observable<boolean> {
    return this._observableMedia.asObservable().pipe(
      map(_ => this._observableMedia.isActive(mediaQuery)),
      distinctUntilChanged()
    )
  }

  getSidebar(sidebarName: string): SidebarComponent | null {
    return this.registeredSidebars.get(sidebarName) || null
  }

  getNavSidebar(): SidebarComponent | null {
    return this.getSidebar('navbar')
  }

  registerSidebar(cmp: SidebarComponent, key = cmp.name): boolean {
    if (this.registeredSidebars.has(key)) {
      console.error(`sidebar ${key} already registered`)
      return false
    }
    this.registeredSidebars.set(key, cmp);

    onLifecycleDestroy(cmp).subscribe(value => {
      if (this.registeredSidebars.get(key) === cmp) {
        this.registeredSidebars.delete(key)
      }
      console.warn('UNREGISTER')
    })

    return true
  }

  get layoutConfig(): LayoutConfig {
    return this.configSubject.value
  }

  onConfigChanged(which?: LayoutConfigSection): Observable<LayoutConfig> {
    return this.configSubject.pipe(
      distinctUntilChanged((x, y) => {
        if (which && defaultLayoutConfig[which]) {
          x = getNestedObject(x, which)
          y = getNestedObject(y, which)
        }
        return !deepEqual(x, y);
      })
    )
  }

  setThemeConfig(cfg: Partial<LayoutThemeConfig>) {
    this.applySectionConfig('theme', cfg)
  }

  setFooterConfig(cfg: Partial<LayoutFooterConfig>) {
    this.applySectionConfig('footer', cfg)
  }

  setNavbarConfig(cfg: Partial<LayoutNavbarConfig>) {
    this.applySectionConfig('navbar', cfg)
  }

  setSidebarConfig(cfg: Partial<LayoutSidebarConfig>) {
    this.applySectionConfig('sidebar', cfg)
  }

  setToolbarConfig(cfg: Partial<LayoutToolbarConfig>) {
    this.applySectionConfig('toolbar', cfg)
  }

  private applySectionConfig(section: LayoutConfigSection, cfg: object): boolean {
    const prev = this.configSubject.value as LayoutConfig;
    if (isObject(cfg) && prev.hasOwnProperty(section)) {
      const newCfg = deepClone(prev);
      (newCfg[section] as object) = Object.assign(newCfg[section], cfg)
      this.configSubject.next(newCfg)
      return true
    }
    return false
  }

  measureText(text: string, fontSize: string, fontFamily: string): number {
    if (!this.textMeasureCanvas) {
      this.textMeasureCanvas = document.createElement('canvas') as HTMLCanvasElement;
    }
    const context = this.textMeasureCanvas.getContext('2d');
    context.font = `${fontSize} ${fontFamily}`;

    return context.measureText(text).width
  }
}

