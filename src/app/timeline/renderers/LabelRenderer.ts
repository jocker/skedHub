import {ScrollEvent, TimelineAxisRenderBox, TimeZoomHandler} from "@sked/app/timeline/TimelineRange";
import {TimelineSeriesItem, TimelineSeriesRenderer} from "@sked/app/timeline/renderers/TimelineSeriesRenderer";
import {DateLike} from "@sked/lib/types";
import {Observable, of, Subject} from "rxjs";
import {TimeZoomLevel} from "@sked/app/timeline/TimeZoomLevel";
import {getComputedElementStyle, makeTime, measureText} from "@sked/lib/utils";
import {ListNode} from "@sked/lib/linked_list";
import {TimelineViewRef} from "@sked/app/timeline/RecyclabeViewRef";
import {TimelineDatasource} from "@sked/app/timeline/datasource/TimelineDataSource";
import {TemplateRef, ViewContainerRef} from "@angular/core";

interface HeaderLabelContextData extends TimelineSeriesItem {
  text: string
}


export class LabelRenderer extends TimelineSeriesRenderer<HeaderLabelContextData> {

  constructor(tplItem: TemplateRef<any>, itemContainer: ViewContainerRef) {
    super(tplItem, itemContainer)
    this.setDataSource(new LDataSource(null))
  }

  get dataSource(): LDataSource {
    return super.dataSource as LDataSource;
  }


  private prevFirstVisibleNode: ListNode<TimelineViewRef<HeaderLabelContextData>>
  private prevWidth = 0
  private prevBox: TimelineAxisRenderBox

  connect(zoomHandler: TimeZoomHandler) {
    this.dataSource.setZoomLevel(zoomHandler.zoomLevel)
    super.connect(zoomHandler);
  }

  protected onResetDataSource() {
    super.onResetDataSource();
    this.prevFirstVisibleNode = null;
    this.prevWidth = 0
  }

  protected onViewsUpdated(ev: ScrollEvent) {
    super.onViewsUpdated(ev);
    let firstVisibleNode = this.firstVisibleNode

    if (!firstVisibleNode) {
      return
    }

    const view = firstVisibleNode.value

    let offset = ev.startOffset, size = this.prevWidth

    if (firstVisibleNode != this.prevFirstVisibleNode) {
      if (this.prevFirstVisibleNode && this.prevBox) {
        this.prevFirstVisibleNode.value.setPosition(this.getViewBoxForOffsetAndSize(this.prevBox.startOffset, this.prevBox.size), true)
      }
      this.prevFirstVisibleNode = firstVisibleNode;

      this.prevBox = this.getRenderBox(view)
      size = this.prevBox?.size
      offset = ev.startOffset
      const rootElement = view.rootElement
      if (rootElement) {
        const props = getComputedElementStyle(view.rootElement, 'font-family', 'font-size')
        const inner = rootElement.innerText
        size = Math.ceil(measureText(inner, props.get('font-size'), props.get('font-family'))) + 16
        this.prevWidth = size
      }
    }

    if (firstVisibleNode?.next) {
      const nextBox = this.getRenderBox(firstVisibleNode.next.value)
      offset -= Math.max(0, offset + size - nextBox.startOffset)
    }
    view.setPosition(this.getViewBoxForOffsetAndSize(offset, size), true)

  }


}

class LDataSource implements TimelineDatasource<HeaderLabelContextData> {

  private _zoomLevelChanged = new Subject<LDataSource>();

  constructor(private _zoomLevel: TimeZoomLevel) {
  }


  getFirstItemForDate(d: DateLike): Observable<HeaderLabelContextData> {
    if (!this._zoomLevel) {
      return of(null)
    }
    const startDate = this._zoomLevel.trimToStart(d), endDate = this._zoomLevel.add(startDate, 1)
    return this.makeItem(startDate, endDate)
  }

  getItemAfter(item: HeaderLabelContextData): Observable<HeaderLabelContextData> {
    if (!this._zoomLevel) {
      return of(null)
    }
    const startDate = item.endTime, endDate = this._zoomLevel.add(startDate, 1)
    return this.makeItem(startDate, endDate)
  }

  getItemBefore(item: HeaderLabelContextData): Observable<HeaderLabelContextData> {
    if (!this._zoomLevel) {
      return of(null)
    }
    const endDate = item.startTime
    const startDate = this._zoomLevel.add(endDate, -1)
    return this.makeItem(startDate, endDate)
  }

  private makeItem(startDate: DateLike, endDate: DateLike): Observable<HeaderLabelContextData> {
    if (!this._zoomLevel) {
      return of(null)
    }
    const startTs = makeTime(startDate)
    return of({
      startTime: startTs,
      endTime: makeTime(endDate),
      id: startTs.toString(),
      text: this._zoomLevel.format('full', startDate)
    })
  }

  onInvalidate(): Observable<any> {
    return this._zoomLevelChanged;
  }

  setZoomLevel(level: TimeZoomLevel) {

    if (level != this._zoomLevel) {
      this._zoomLevel = level
      this._zoomLevelChanged.next(this)
    }
  }

}
