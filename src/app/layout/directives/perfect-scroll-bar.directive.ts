import {AfterViewInit, Directive, ElementRef, HostListener, Input, OnDestroy} from '@angular/core';
import {NavigationEnd, Router} from "@angular/router";
import {debounceTime, filter, takeUntil} from "rxjs/operators";
import {Platform} from '@angular/cdk/platform';
import PerfectScrollbar from 'perfect-scrollbar';
import {Subject} from "rxjs";
import {LifecycleHooks, onLifecycleDestroy} from "@sked/lib/lifecycle_utils";

@LifecycleHooks()
@Directive({
  selector: '[perfectScrollBar]'
})
export class PerfectScrollbarDirective implements AfterViewInit, OnDestroy {
  ps: PerfectScrollbar;

  // Private
  private _enabled = false;
  private _options: PerfectScrollbarOptions = {updateOnRouteChange: false, suppressScrollX: false};
  private requestUpdateSubject = new Subject<boolean>()


  constructor(
    public elementRef: ElementRef,
    private _platform: Platform,
    private _router: Router
  ) {
    this.enabled = true;
  }

  @Input("perfectScollbarOptions")
  set perfectScrollbarOptions(value: Partial<PerfectScrollbarOptions>){
    this._options = {...this._options, ...value}
  }


  set enabled(value: boolean) {
    value = !!value;

    // Return, if both values are the same
    if (this._enabled === value) {
      return;
    }

    this._enabled = value;

    if (this._enabled) {
      this.init();
    } else {
      this.ngOnDestroy();
    }
  }

  get enabled(): boolean {
    return !!this._enabled;
  }


  ngAfterViewInit(): void {

    this.requestUpdateSubject.pipe(
      debounceTime(100),
      takeUntil(onLifecycleDestroy(this))
    ).subscribe(scrollToTop => {
      if (this.ps) {
        this.ps.update();
        if (scrollToTop) {
          this.scrollToTop()
        }
      }

    })

    // Scroll to the top on every route change
    if (this._options.updateOnRouteChange) {
      this._router.events
        .pipe(
          filter(event => event instanceof NavigationEnd),
          debounceTime(1),
          takeUntil(onLifecycleDestroy(this)),
        )
        .subscribe(() => {
          this.scrollToTop();
          this.requestUpdate();
        });
    }
  }


  ngOnDestroy(): void {
    if (!this.ps) {
      return;
    }

    this.ps.destroy();

    this.ps = null;

  }


  private init(): void {
    // Return, if already initialized
    if (this.ps) {
      return;
    }

    if (this._platform.ANDROID || this._platform.IOS) {
      return
    }

    // Initialize the perfect-scrollbar
    this.ps = new PerfectScrollbar(this.elementRef.nativeElement);
  }


  @HostListener('window:resize')
  handleWindowResize(): void {
    this.requestUpdate()
  }


  requestUpdate(scrollToTop = false): void {
    if (!this.ps) {
      return;
    }
    this.requestUpdateSubject.next(!!scrollToTop);
  }


  scrollToX(x: number, speed?: number): void {
    this.animateScrolling('scrollLeft', x, speed);
  }

  scrollToY(y: number, speed?: number): void {
    this.animateScrolling('scrollTop', y, speed);
  }


  scrollToTop(offset?: number, speed?: number): void {
    this.animateScrolling('scrollTop', (offset || 0), speed);
  }


  scrollToLeft(offset?: number, speed?: number): void {
    this.animateScrolling('scrollLeft', (offset || 0), speed);
  }


  scrollToRight(offset?: number, speed?: number): void {
    const width = this.elementRef.nativeElement.scrollWidth;

    this.animateScrolling('scrollLeft', width - (offset || 0), speed);
  }

  scrollToBottom(offset?: number, speed?: number): void {
    const height = this.elementRef.nativeElement.scrollHeight;

    this.animateScrolling('scrollTop', height - (offset || 0), speed);
  }

  animateScrolling(target: string, value: number, speed?: number): void {
    if (!speed) {
      this.elementRef.nativeElement[target] = value;

      // PS has weird event sending order, this is a workaround for that
      this.requestUpdate();
    } else if (value !== this.elementRef.nativeElement[target]) {
      let newValue = 0;
      let scrollCount = 0;

      let oldTimestamp = performance.now();
      let oldValue = this.elementRef.nativeElement[target];

      const cosParameter = (oldValue - value) / 2;

      const step = (newTimestamp) => {
        scrollCount += Math.PI / (speed / (newTimestamp - oldTimestamp));

        newValue = Math.round(value + cosParameter + cosParameter * Math.cos(scrollCount));

        // Only continue animation if scroll position has not changed
        if (this.elementRef.nativeElement[target] === oldValue) {
          if (scrollCount >= Math.PI) {
            this.elementRef.nativeElement[target] = value;

            this.requestUpdate();
          } else {
            this.elementRef.nativeElement[target] = oldValue = newValue;

            oldTimestamp = newTimestamp;

            window.requestAnimationFrame(step);
          }
        }
      };

      window.requestAnimationFrame(step);
    }
  }
}


export interface PerfectScrollbarOptions {
  updateOnRouteChange: boolean
  suppressScrollX: boolean
}
