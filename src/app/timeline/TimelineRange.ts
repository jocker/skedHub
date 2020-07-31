import {animationFrameScheduler, BehaviorSubject, Observable} from "rxjs";
import {filter, subscribeOn} from "rxjs/operators";
import {TimeZoomLevel} from "@sked/app/timeline/TimeZoomLevel";
import {isNumber} from "@sked/lib/type_check_utils";
import {makeTime, roundNumber} from "@sked/lib/utils";
import {DateLike} from "@sked/lib/types";

export class TimeZoomHandler {
  private globalStartTs: number
  private globalEndTs: number
  private _itemCount: number;
  private _scrollerSize: number;
  private _itemSize = 0;
  private _viewportSize = 0;
  private _viewportItemCount = 0;

  private changeSubject = new BehaviorSubject<ScrollEvent>(null)

  constructor(
    public zoomLevel: TimeZoomLevel,
    fromDate: Date,
    toDate: Date,
  ) {
    let globalMinTime = zoomLevel.trimToStart(fromDate)

    let globalMaxTime = zoomLevel.trimToEnd(toDate)


    this._itemCount = zoomLevel.count(globalMinTime, globalMaxTime)
    this.globalStartTs = globalMinTime.getTime()
    this.globalEndTs = globalMaxTime.getTime()

  }


  getCenterOffset(rangeStart: DateLike, rangeEnd: DateLike, percent = 0.5): number {
    percent = Math.max(0, Math.min(percent, 1))
    const startTs = makeTime(rangeStart), endTs = makeTime(rangeEnd)
    const totalSize = this._scrollerSize;
    const tsDiff = endTs - startTs
    const boxSize = tsDiff / (this.globalEndTs - this.globalStartTs) * totalSize

    const offset = (startTs - this.globalStartTs) / (this.globalEndTs - this.globalStartTs) * totalSize

    return Math.max(0, offset - (this._viewportSize - boxSize) * percent)
  }

  getOffsetForDate(d: DateLike) {
    return this.getCenterOffset(d, d)
  }

  visibleOffsetForDate(d: DateLike): number {
    const lastEmitted = this.changeSubject.value;
    if (lastEmitted) {
      const dTs = getTimestamp(d);
      const startTs = lastEmitted.startTs, endTs = lastEmitted.endTs;
      if (startTs <= dTs && dTs < endTs) {
        const tsPercent = (dTs - startTs) / (endTs - startTs)
        return Math.round(lastEmitted.startOffset + (lastEmitted.endOffset - lastEmitted.startOffset) * tsPercent)
      }
    }
    return NaN
  }

  firstVisibleIndex(offsetSize: number): number {
    if (this._itemSize <= 0) {
      return -1
    }
    return Math.floor(offsetSize / this._itemSize)
  }

  startDateForIndex(index: number): Date {
    if (index < 0) {
      return null
    }
    return this.zoomLevel.add(new Date(this.globalStartTs), index)
  }

  dateRangeForIndex(index: number): { start: Date, end: Date } {
    const start = this.startDateForIndex(index)
    return {
      start: start,
      end: this.increment(start, 1)
    }
  }

  increment(date: DateLike, delta: number): Date {
    return this.zoomLevel.add(new Date(this.globalStartTs), delta)
  }

  setup(minItemSize: number, viewportSize: number, scrollOffset: number) {
    this._viewportSize = viewportSize;
    this._viewportItemCount = Math.min(Math.ceil(viewportSize / minItemSize), this._itemCount)
    this._itemSize = Math.ceil(viewportSize / this._viewportItemCount);
    this._scrollerSize = this._itemCount * this._itemSize
    this.handleScroll(scrollOffset, 1)
  }

  get itemSize(): number {
    return this._itemSize
  }

  get itemCount(): number {
    return this._itemCount
  }

  get scrollerSize(): number {
    return this._scrollerSize
  }


  handleScroll(scrollValue: number, delta: number) {
    const totalSize = this._scrollerSize;
    scrollValue = Math.min(scrollValue, totalSize - this._viewportSize)
    const viewportStart = scrollValue, viewportEnd = viewportStart + this._viewportSize
    const timeDiff = this.globalEndTs - this.globalStartTs

    const firstVisibleDate = Math.round(this.globalStartTs + (scrollValue / totalSize) * timeDiff)
    const lastVisibleDate = Math.round(this.globalStartTs + ((scrollValue + this._viewportSize) / totalSize) * timeDiff)

    const ev = new ScrollEvent({
      globalStartTs: this.globalStartTs,
      globalEndTs: this.globalEndTs,
      startTs: firstVisibleDate,
      endTs: lastVisibleDate,
      startOffset: scrollValue,
      endOffset: scrollValue + this._viewportSize,
      delta: delta,
      source: this,
      zoom: this.zoomLevel,
      viewportSize: this._viewportSize,
      totalSize: totalSize
    })
    //console.warn('scroll', ev.endOffset-ev.startOffset, delta)
    this.changeSubject.next(ev)
  }

  onUpdate(): Observable<ScrollEvent> {
    return this.changeSubject.pipe(
      filter(value => !!value),
      subscribeOn(animationFrameScheduler)
    )
  }


}


function getTimestamp(d: Date | number): number {
  return isNumber(d) ? d as number : (d as Date).getTime()
}

export interface ScrollEventData {
  globalStartTs: number,
  globalEndTs: number,
  startTs: number,
  endTs: number
  startOffset: number,
  endOffset: number,
  source: TimeZoomHandler,
  zoom: TimeZoomLevel
  delta: number,
  viewportSize: number,
  totalSize: number
  originalEvent?: ScrollEvent
}

export class ScrollEvent implements ScrollEventData {
  constructor(data: ScrollEventData) {
    Object.assign(this as any, data)
    Object.freeze(this)
  }


  withOffsets(startOffset: number, endOffset: number): ScrollEvent {
    if (startOffset == 0 && endOffset == 0) {
      return this
    }
    const
      newStartOffset = this.startOffset + startOffset,
      newEndOffset = this.endOffset - endOffset,
      newViewportSize = newEndOffset - newStartOffset,
      tsDiff = this.endTs - this.startTs,
      trimStartPercent = startOffset / this.viewportSize,
      trimEndPercent = endOffset / this.viewportSize,
      newStartTs = Math.round(this.startTs + (tsDiff*trimStartPercent)),
      newEndTs = Math.round(this.endTs-(tsDiff*trimEndPercent))


    return new ScrollEvent({
      globalStartTs: this.globalStartTs,
      globalEndTs: this.globalEndTs,
      startTs: newStartTs,
      endTs: newEndTs,
      startOffset: newStartOffset,
      endOffset: newEndOffset,
      source: this.source,
      zoom: this.zoom,
      delta: this.delta,
      viewportSize: newViewportSize,
      totalSize: this.totalSize,
      originalEvent: this.originalEvent || this
    })
  }

  delta: number;
  endOffset: number;
  endTs: number;
  globalEndTs: number;
  globalStartTs: number;
  originalEvent: ScrollEvent;
  source: TimeZoomHandler;
  startOffset: number;
  startTs: number;
  viewportSize: number;
  totalSize: number;
  zoom: TimeZoomLevel;


  private getRenderBoxInternal(startTs: number, endTs: number, isVisible: boolean): TimelineAxisRenderBox {
    if (startTs < this.globalStartTs) {
      return EmptyTimelineRenderBox
    }
    if (endTs > this.globalEndTs) {
      return EmptyTimelineRenderBox
    }
    if (startTs > endTs) {
      return EmptyTimelineRenderBox
    }
    const totalSize = this.totalSize;
    const tsDiff = endTs - startTs
    const boxSize = tsDiff / (this.globalEndTs - this.globalStartTs) * totalSize

    let clipStartPercent = 0, clipEndPercent = 0;
    if (isVisible) {
      clipStartPercent = Math.min(1, Math.max((this.startTs - startTs), 0) / tsDiff);
      clipEndPercent = Math.min(1, (Math.max(this.endTs, endTs) - this.endTs) / tsDiff)
    }

    const offset = (startTs - this.globalStartTs) / (this.globalEndTs - this.globalStartTs) * totalSize

    const clipStart = roundNumber(clipStartPercent * boxSize, 2)
    const clipEnd = roundNumber(clipEndPercent * boxSize)

    const size = roundNumber(boxSize, 2),
      start = roundNumber(offset, 2)
    return {
      size: size,
      visibleSize: isVisible ? 0 : Math.max(0, size - clipStart - clipEnd),
      startOffset: start,
      endOffset: start + size,
      clipStart: clipStart,
      clipEnd: clipEnd,
    }
  }

  getRenderBox(from: number, to: number): TimelineAxisRenderBox {
    return this.getRenderBoxInternal(from, to, this.isRangeVisible(from, to))
  }

  isRenderBoxVisible(box: TimelineAxisRenderBox): boolean {
    return box.startOffset < this.endOffset && box.endOffset > this.startOffset
  }

  getVisibleRenderBoxXXX(from: number, to: number): TimelineAxisRenderBox {
    if (this.isRangeVisible(from, to)) {
      return this.getRenderBoxInternal(from, to, true)
    }
    return EmptyTimelineRenderBox
  }

  isRangeVisible(from: DateLike, to: DateLike): boolean {
    const startTs = makeTime(from), endTs = makeTime(to);
    return startTs < this.endTs && endTs > this.startTs

  }

  getRangeOverlap(from: DateLike, to: DateLike): number {
    const startTs = makeTime(from), endTs = makeTime(to);
    return Math.max(0, Math.min(endTs, this.endTs) - Math.max(startTs, this.startTs))
  }
}

export interface TimelineAxisRenderBox {
  startOffset: number
  endOffset: number
  size: number
  visibleSize: number,
  clipStart: number
  clipEnd: number
}

export const EmptyTimelineRenderBox: TimelineAxisRenderBox = {
  clipEnd: 0,
  clipStart: 0,
  startOffset: 0,
  endOffset: 0,
  size: 0,
  visibleSize: 0,
}

Object.freeze(EmptyTimelineRenderBox)



