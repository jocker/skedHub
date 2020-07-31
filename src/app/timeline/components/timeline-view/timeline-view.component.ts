import {
  AfterViewChecked,
  AfterViewInit,
  Component,
  ElementRef,
  Injector,
  OnInit,
  TemplateRef,
  ViewChild,
  ViewContainerRef
} from '@angular/core';
import {normalizeWheel, onElementResize} from "@sked/lib/utils";
import {takeUntil} from "rxjs/operators";
import {LifecycleHooks, onLifecycleDestroy} from "@sked/lib/lifecycle_utils";
import {TimeZoomHandler} from "@sked/app/timeline/TimelineRange";
import {DayZoomLevel} from "@sked/app/timeline/TimeZoomLevel";
import {LabelRenderer} from "@sked/app/timeline/renderers/LabelRenderer";
import {SvgBackgroundRenderer} from "@sked/app/timeline/renderers/SvgBackgroundRenderer";


@LifecycleHooks()
@Component({
  selector: 'app-timeline-view',
  templateUrl: './timeline-view.component.html',
  styleUrls: ['./timeline-view.component.scss']
})
export class TimelineViewComponent implements OnInit, AfterViewInit, AfterViewChecked {

  constructor(private injector: Injector, ) {
  }

  @ViewChild("timelineEl") timelineEl: ElementRef<HTMLElement>
  @ViewChild("scrollViewport") scrollViewportEl: ElementRef<HTMLElement>
  @ViewChild("scrollableContainer") scrollableContainerEl: ElementRef<HTMLElement>
  @ViewChild("backgroundSvgEl") backgroundSvgEl: ElementRef<SVGElement>
  @ViewChild('headerCellViewContainer', {
    read: ViewContainerRef,
    static: true
  }) headerCellViewContainer: ViewContainerRef;

  @ViewChild('headerLabelViewContainer', {
    read: ViewContainerRef,
    static: true
  }) headerLabelViewContainer: ViewContainerRef;

  @ViewChild('notWorkingViewContainer', {
    read: ViewContainerRef,
    static: true
  }) notWorkingViewContainer: ViewContainerRef;

  @ViewChild('scrollableContainer', {
    read: ViewContainerRef,
    static: true
  }) scrollableContainer: ViewContainerRef;

  @ViewChild('tplHeaderCell') tplHeaderCell: TemplateRef<any>
  @ViewChild('tplHeaderLabel') tplHeaderLabel: TemplateRef<any>
  @ViewChild('tplNotWorking') tplNotWorking: TemplateRef<any>
  @ViewChild('tplEventItem') tplEventItem: TemplateRef<any>

  private viewportSize = {
    width: 0,
    height: 0
  }

  private viewportScroll = {
    top: 0,
    left: 0,
  }

  zoomHandler = new TimeZoomHandler(DayZoomLevel, new Date('2020-1-1'), new Date('2021-1-1'))

  ngOnInit(): void {

  }

  ngAfterViewInit(): void {


    //new HeaderCellRenderer(this.tplHeaderCell, this.scrollableContainer).connect(this.zoomHandler)

    new LabelRenderer(this.tplHeaderLabel, this.scrollableContainer).connect(this.zoomHandler)
    new SvgBackgroundRenderer(this.backgroundSvgEl).connect(this.zoomHandler)
    //new WeekendRenderer(this.tplNotWorking, this.scrollableContainer).connect(this.zoomHandler)
/*
    const renderer = new ClipTimelineSeriesRenderer<EventItem>(this.tplEventItem, this.scrollableContainer)
    const dataSource = new ArrayTimelineDataSource<EventItem>()

    dataSource.setData([{
      startTime:new Date('2020-01-01T00:30:50').getTime(),
      endTime: new Date('2020-01-01T00:55:50').getTime(),
      color: '#4285F4',
      id: '1',
      title:'Event Title'
    },{
      startTime:new Date('2020-01-01T02:30:50').getTime(),
      endTime: new Date('2020-01-01T02:55:50').getTime(),
      color: '#fd683b',
      id: '2',
      title:'Event Title'
    },{
      startTime:new Date('2020-01-01T04:00:50').getTime(),
      endTime: new Date('2020-01-01T04:55:50').getTime(),
      color: '#fdd33b',
      id: '3',
      title:'Some long long Event Title'
    },{
      startTime:new Date('2020-01-03T03:30:50').getTime(),
      endTime: new Date('2020-01-03T03:55:50').getTime(),
      color: '#63f442',
      id: '4',
      title:'Event Title'
    },{
      startTime:new Date('2020-01-04T04:30:50').getTime(),
      endTime: new Date('2020-01-04T04:55:50').getTime(),
      color: '#f442eb',
      id: '5',
      title:'Event Title'
    }]);

    renderer.setDataSource(dataSource)

    renderer.connect(this.zoomHandler)*/


    onElementResize(this.scrollViewportEl).pipe(
      takeUntil(onLifecycleDestroy(this))
    ).subscribe((value: ResizeObserverEntry) => {
      this.handleViewportResize(value.contentRect.width, value.contentRect.height)
    });


  }

  private handleViewportResize(width: number, height: number) {

    if (this.viewportSize.width != width || this.viewportSize.height != height) {

      if (this.viewportSize.width + this.viewportSize.height == 0) {
        this.viewportSize.width = width;
        this.viewportSize.height = height;
      }

      this.zoomHandler.setup(120, width, this.scrollViewportEl.nativeElement.scrollLeft)
      //this.scrollViewportEl.nativeElement.scrollLeft =this.zoomHandler.getOffsetForDate(Date.now())
      this.scrollableContainerEl.nativeElement.style.width = (this.zoomHandler.scrollerSize) + 'px'

    }

  }

  handleHeaderWheel(ev: Event) {
    ev.preventDefault()
    ev.stopPropagation()
    this.zoomHandler.itemSize
    console.warn('header', ev)
  }

  handleScroll(ev: Event) {

    if (ev.type != 'scroll') {
      return
    }
    const el = ev.target as HTMLElement;
    if (!el) {
      return
    }
    let topChanged = false
    let delta = 0, scrollValue = 0;
    if (this.viewportScroll.left != el.scrollLeft) {
      delta = el.scrollLeft - this.viewportScroll.left
      this.viewportScroll.left = scrollValue = el.scrollLeft
    } else if (this.viewportScroll.top != el.scrollTop) {
      delta = el.scrollTop - this.viewportScroll.top
      this.viewportScroll.top = scrollValue = el.scrollTop
      topChanged = true
    } else {
      return
    }

    if (topChanged) {
      this.handleVerticalScroll(scrollValue, delta)
    } else {
      this.handleHorizontalScroll(scrollValue, delta)
    }

  }

  handleHorizontalScroll(scrollValue: number, delta: number, fromAnimationFrame = false) {
    this.zoomHandler.handleScroll(scrollValue, delta)
  }

  handleVerticalScroll(scrollValue: number, delta: number, fromAnimationFrame = false) {

  }


  handleWheel(ev: WheelEvent) {
    ev.preventDefault()
    const normalized = normalizeWheel(ev);
    const scroller = this.scrollViewportEl.nativeElement;

    const opt = {
      left: normalized.pixelX,
      top: normalized.pixelY,
    }
    scroller.scrollBy(opt)
  }

  ngAfterViewChecked(): void {

  }


}
