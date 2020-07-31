import {
  EmptyTimelineRenderBox,
  ScrollEvent,
  TimelineAxisRenderBox,
  TimeZoomHandler
} from "@sked/app/timeline/TimelineRange";
import {HtmlRecyclableViewRef, TimelineViewRef, ViewBox} from "@sked/app/timeline/RecyclabeViewRef";
import {animationFrameScheduler, EMPTY, Observable, Subject, Subscription} from "rxjs";
import {LinkedList, ListNode} from "@sked/lib/linked_list";
import {map, subscribeOn, take, takeUntil, tap} from "rxjs/operators";
import {makeTime, unsubscribe} from "@sked/lib/utils";
import {TimelineDatasource} from "@sked/app/timeline/datasource/TimelineDataSource";
import {TemplateRef, ViewContainerRef} from "@angular/core";

export type RenderAxis = 'x' | 'y'

export interface TimelineRenderAxisConfig {
  axis: RenderAxis
  offsetOppositeAxis: number,
  size: number
  startOffset: number
  endOffset: number
}


export interface TimelineSeriesItem {
  startTime: number
  endTime: number
  id: string
}

export interface LoadResult<T extends TimelineSeriesItem> {
  data: T,
  box: TimelineAxisRenderBox
}

export interface TimelineViewData<T extends TimelineSeriesItem> {
  view: TimelineViewRef<T>
  data: T
  box: TimelineAxisRenderBox
}

const DATASOURCE_EDGE_INVALID = -1

export class TimelineSeriesRenderer<T extends TimelineSeriesItem> {

  private _dataSource: TimelineDatasource<T>
  private _loadResults = new WeakMap<TimelineViewRef<T>, LoadResult<T>>();

  private datasourceSub: Subscription
  private _scrollCache = new Map()

  private _datasourceEdges: {
    start: number,
    end: number,
    version: number
  }

  private _renderAxisConfig: TimelineRenderAxisConfig = {
    size: 120,
    axis: 'x',
    offsetOppositeAxis: 0,
    startOffset: 100,
    endOffset: 100
  }

  protected renderedItems = new LinkedList<TimelineViewRef<T>>()
  protected recycledViews = new LinkedList<TimelineViewRef<T>>();
  protected lockedViews = new Set<TimelineViewRef<T>>();

  private _enabled = true
  private _lastReceivedEvent: ScrollEvent = null
  private _cancelRenderSubject = new Subject<boolean>()


  protected getViewForRender(appendToVisible = true): ListNode<TimelineViewRef<T>> {
    let node = this.recycledViews.shift()
    if (!node) {
      node = new ListNode<TimelineViewRef<T>>(this.createView())
    } else {
      node.value.setDisabled(false)
    }
    if (appendToVisible) {
      this.renderedItems.append(node)
    }

    return node
  }

  get lastReceivedEvent(): ScrollEvent {
    return this._lastReceivedEvent
  }


  protected recycleAll() {
    const it = this.renderedItems.iterator()
    while (it.hasNext) {
      this.recycle(it.next())
    }
  }


  protected recycle(item: ListNode<TimelineViewRef<T>>) {
    if (this.lockedViews.has(item.value)) {
      return
    }
    this._loadResults.delete(item.value)
    const node = this.renderedItems.remove(item);
    if (node) {
      node.value.setDisabled(true)
    }
    this.recycledViews.prepend(node)
  }

  protected destroyAllViews() {
    this.destroyViews(this.renderedItems)
    this.destroyViews(this.recycledViews)
  }

  private destroyViews(list: LinkedList<TimelineViewRef<T>>) {
    this.lockedViews.clear();
    for (let item = list.first; item; item = list.first) {
      item.value.destroy()
      item.remove()
      item.value.detectChanges()
    }

  }

  connect(zoomHandler: TimeZoomHandler) {
    this.createConnection(zoomHandler).subscribe(value => {
      this.cancelRender('scroll')
      if (this._lastReceivedEvent?.zoom != value.zoom) {
        this.recycleAll()
      }

      const prevEvent = this._lastReceivedEvent
      this._lastReceivedEvent = value;
      if (this._enabled) {
        this.handleEvent(prevEvent, value)
      }
    })
  }

  get isEnabled(): boolean {
    return this._enabled
  }

  setEnabled(enabled: boolean) {
    if (this._enabled != enabled) {
      this._enabled = enabled;
      if (enabled) {
        if (this._lastReceivedEvent) {
          this.handleEvent(null, this._lastReceivedEvent)
        }
      } else {
        if (this._lastReceivedEvent) {
          this.cancelRender('enabled changed')
        }
        this.destroyAllViews()
      }
    }
  }

  cancelRender(reason: string) {
    const ev = this._lastReceivedEvent
    this._cancelRenderSubject.next(true)
  }

  onRenderCancel(): Observable<boolean> {
    return this._cancelRenderSubject.pipe(
      take(1)
    )
  }

  constructor(protected tplItem: TemplateRef<any>, protected itemContainer: ViewContainerRef) {
  }


  protected createConnection(zoomHandler: TimeZoomHandler): Observable<ScrollEvent> {
    return zoomHandler.onUpdate().pipe(
      map(ev => ev.withOffsets(this._renderAxisConfig.startOffset, this._renderAxisConfig.endOffset))
    )
  }


  private loadItems(sibling: T | null, ev: ScrollEvent, asc: boolean): Observable<LoadResult<T>[]> {
    return new Observable<LoadResult<T>[]>(subscriber => {
      let subscription: Subscription
      const loadedItems: LoadResult<T>[] = []


      if (sibling) {
        let isDone = false
        if (asc && (this._datasourceEdges.end == sibling.endTime)) {
          isDone = true
        } else if (!asc && (this._datasourceEdges.start == sibling.startTime)) {
          isDone = true
        } else if (!ev.isRangeVisible(sibling.startTime, sibling.endTime)) {
          isDone = true
        }
        if (isDone) {
          subscriber.next([])
          subscriber.complete()
          return
        }
      }

      const loadNext = () => {
        let source: Observable<T>
        if (!this._dataSource) {
          source = EMPTY
        } else if (sibling) {
          if (asc) {
            source = this._dataSource.getItemAfter(sibling)
          } else {
            source = this._dataSource.getItemBefore(sibling)
          }
        } else {
          console.warn('getFirstItemForDate', ev.startTs)
          source = this._dataSource.getFirstItemForDate(ev.startTs)
        }

        subscription = source.pipe(
          take(1),
          takeUntil(this.onRenderCancel().pipe(
            tap(x => {
            })
          ))
        ).subscribe(item => {
          let isDone = false

          if (ev != this.lastReceivedEvent) {
            subscriber.complete()
            return
          }


          if (item) {
            if (item.endTime <= ev.globalStartTs) {
              this._datasourceEdges.start = ev.globalStartTs
              isDone = true
            }

            if (item.startTime >= ev.globalEndTs) {
              this._datasourceEdges.end = ev.globalEndTs
              isDone = true
            }
            if (asc && (item.endTime < makeTime(ev.startTs))) {
              throw new Error("invalid item")
            }
          }


          if (!isDone) {
            let box = item ? ev.getRenderBox(item.startTime, item.endTime) : null
            loadedItems.push({
              data: item,
              box: box
            })
            if (!item || (!ev.isRenderBoxVisible(box))) {
              isDone = true
            }
          }

          if (isDone) {
            subscriber.next(loadedItems)
            subscriber.complete()
          } else {
            sibling = item
            loadNext()
          }


        })

      }

      loadNext()

      return () => {
        unsubscribe(subscription)
      }

    })

  }

  get dataSource(): TimelineDatasource<T> {
    return this._dataSource
  }

  setDataSource(dataSource: TimelineDatasource<T>) {
    if (this._dataSource != dataSource) {
      this._dataSource = dataSource;
      this.onResetDataSource()
    }
  }

  protected onResetDataSource() {
    this.cancelRender('datasource reset');
    this.destroyAllViews();
    this._loadResults = new WeakMap<TimelineViewRef<T>, LoadResult<T>>()

    unsubscribe(this.datasourceSub)
    let edge = NaN
    if (!this._dataSource) {
      edge = DATASOURCE_EDGE_INVALID
    }
    this._datasourceEdges = {start: edge, end: edge, version: (this._datasourceEdges?.version || 0) + 1}
    if (this._dataSource) {

      this.datasourceSub = this._dataSource.onInvalidate().subscribe(value => {
        this.onResetDataSource()
      })
    }
    if (this._dataSource && this.lastReceivedEvent) {
      this.handleEvent(null, this.lastReceivedEvent)
    }

  }

  protected onItemsLoaded(ev: ScrollEvent, data: LoadResult<T>[], prepend: boolean,) {
    const toUpdate: TimelineViewData<T>[] = []
    if (data.length) {
      if (prepend) {
        data = data.reverse()
      }

      const visibleItemIds = new Set()
      for (let x = this.firstVisibleNode; x; x = x.next) {
        if (x == this.lastVisibleNode) {
          break
        }
        visibleItemIds.add(this._loadResults.get(x.value).data.id)
      }

      for (const loadedEntry of data) {
        if (visibleItemIds.has(loadedEntry.data.id)) {
          continue
        }
        visibleItemIds.add(loadedEntry.data.id)
        const view = this.getViewForRender(false);
        const data: TimelineViewData<T> = {
          box: loadedEntry.box,
          data: loadedEntry.data,
          view: view.value
        }
        if (prepend) {
          this.renderedItems.prepend(view)
          toUpdate.unshift(data)
        } else {
          this.renderedItems.append(view)
          toUpdate.push(data)
        }
        this._loadResults.set(view.value, loadedEntry)
      }
    }

    this.updateViews(ev, toUpdate)

  }

  protected onItemsLoadedUpdateAllVisible(ev: ScrollEvent, data: LoadResult<T>[], prepend: boolean,) {
    const visibleItemIds = new Map<any, TimelineViewData<T>>()
    if (data.length) {
      if (prepend) {
        data = data.reverse()
      }
      for (let x = this.firstVisibleNode; x; x = x.next) {
        if (x == this.lastVisibleNode) {
          break
        }
        const d = this._loadResults.get(x.value)
        visibleItemIds.set(d.data.id, {
          view: x.value,
          data: d.data,
          box: d.box
        })
      }

      for (const loadedEntry of data) {
        let view: TimelineViewRef<T>
        if (visibleItemIds.has(loadedEntry.data.id)) {
          view = visibleItemIds.get(loadedEntry.data.id).view
        } else {
          const nodeView = this.getViewForRender(false);
          if (prepend) {
            this.renderedItems.prepend(nodeView)
          } else {
            this.renderedItems.append(nodeView)
          }
          view = nodeView.value
        }
        const data: TimelineViewData<T> = {
          box: loadedEntry.box,
          data: loadedEntry.data,
          view: view
        }
        visibleItemIds.set(loadedEntry.data.id, data)

        this._loadResults.set(view, loadedEntry)
      }
    }
    this.updateViews(ev, Array.from(visibleItemIds.values()))

  }

  protected getRenderData(item: TimelineViewRef<T>): T {
    return this._loadResults.get(item).data
  }

  protected getRenderBox(item: TimelineViewRef<T>): TimelineAxisRenderBox {
    return this._loadResults.get(item)?.box || EmptyTimelineRenderBox
  }

  protected updateViews(ev: ScrollEvent, entries: TimelineViewData<T>[]) {
    for (const entry of entries) {
      this.updateView(ev, entry)
    }
  }

  protected recycleNotVisible(ev: ScrollEvent) {

    if (this.renderedItems.isEmpty) {
      return
    }

    let firstVisible: ListNode<TimelineViewRef<T>>, lastVisible: ListNode<TimelineViewRef<T>>;
    const recycle = new Set<ListNode<TimelineViewRef<T>>>()
    let it = this.renderedItems.iterator(false)
    while (it.hasNext) {
      let node = it.next()
      const box = this.getRenderBox(node.value), start = box.startOffset, end = box.endOffset;
      if (start < ev.endOffset && end > ev.startOffset) {
        if (!firstVisible) {
          firstVisible = node
        }
        lastVisible = node
      } else {
        recycle.add(node)
      }
    }
    recycle.delete(firstVisible?.prev)
    recycle.delete(lastVisible?.next)
    for (const node of recycle) {
      this.recycle(node)
    }

  }

  protected getViewBoxForOffsetAndSize(offset: number, size: number, original?: Partial<ViewBox>): Partial<ViewBox> {
    const viewBox: Partial<ViewBox> = original || {}
    if (this._renderAxisConfig.axis == 'x') {
      viewBox.top = this._renderAxisConfig.offsetOppositeAxis
      viewBox.height = this._renderAxisConfig.size
      viewBox.left = offset
      viewBox.width = size

    } else {
      viewBox.left = this._renderAxisConfig.offsetOppositeAxis
      viewBox.width = this._renderAxisConfig.size
      viewBox.top = offset
      viewBox.height = size
    }

    return viewBox
  }

  protected updateView(ev: ScrollEvent, data: TimelineViewData<T>) {
    const viewBox = this.getViewBoxForOffsetAndSize(data.box.startOffset, data.box.size, {
      visibility: "visible"
    })
    data.view.update(data.data, data.box, viewBox)

  }

  protected handleEvent(prev: ScrollEvent, ev: ScrollEvent) {
    if (!this.isActive) {
      console.warn('not active', this.isEnabled, this._dataSource)
      return
    }
    this._scrollCache.clear();
    if (prev?.viewportSize != ev?.viewportSize) {
      this.destroyAllViews()
    } else {
      this.recycleNotVisible(ev);
    }


    let asc = this.renderedItems.isEmpty || ev.delta >= 0;
    if (asc && !isNaN(this._datasourceEdges.end)) {
      if (this._datasourceEdges.end < ev.startTs) {
        return
      }
    } else if (!asc && !isNaN(this._datasourceEdges.start)) {
      if (this._datasourceEdges.start > ev.endTs) {
        return
      }
    }

    let sibling: T
    if (!this.renderedItems.isEmpty) {
      let siblingNode: ListNode<TimelineViewRef<T>>
      if (asc) {
        siblingNode = this.renderedItems.last
      } else {
        siblingNode = this.renderedItems.first
      }
      sibling = this._loadResults.get(siblingNode?.value)?.data
      if (sibling) {
        if (!ev.isRangeVisible(sibling.startTime, sibling.endTime)) {
          this.onViewsUpdated(ev)
          return
        }
        if (sibling.endTime < ev.startTs || sibling.startTime > ev.endTs) {
          //this.recycleAll()
          //sibling = null
        }
      }
    }

    this.loadItems(sibling, ev, asc).pipe(
      takeUntil(this.onRenderCancel()),
      subscribeOn(animationFrameScheduler)
    ).subscribe(data => {
      if (data.length) {
        const lastItem = data[data.length - 1];
        if (!lastItem?.data) {
          data.pop()
        }
        const canSetEdges = this._datasourceEdges.start != DATASOURCE_EDGE_INVALID

        if (canSetEdges && !lastItem?.data) {

          let minTs = NaN, maxTs = NaN
          for (const item of data) {
            const itemStart = item.data.startTime, itemEnd = item.data.endTime
            minTs = Math.min(minTs || itemStart, itemStart)
            maxTs = Math.max(maxTs || itemEnd, itemEnd)
          }

          if (sibling) {
            if (asc && isNaN(maxTs)) {
              maxTs = sibling.endTime
            }
            if (!asc && isNaN(minTs)) {
              minTs = sibling.startTime
            }
          }

          if (asc && isNaN(this._datasourceEdges.end)) {
            this._datasourceEdges.end = maxTs || ev.startTs
          }

          if (!asc && isNaN(this._datasourceEdges.start)) {
            this._datasourceEdges.start = minTs || ev.startTs
          }

          console.warn('datasource edges', this._datasourceEdges.start, this._datasourceEdges.end)
        }
      }
      this.onItemsLoaded(ev, data, !asc)
    }, error => {
    }, () => {
      if (this.lastReceivedEvent == ev) {
        this.onViewsUpdated(ev)
      }
    })

  }

  protected onViewsUpdated(ev: ScrollEvent) {

  }

  get isActive(): boolean {
    return !!this._dataSource && this.isEnabled
  }

  get firstVisibleNode(): ListNode<TimelineViewRef<T>> {
    return this.fetchCache('firstVisibleNode', () => {
      for (let node = this.renderedItems.first; node; node = node.next) {
        const box = this.getRenderBox(node.value);
        if (this.lastReceivedEvent.isRenderBoxVisible(box)) {
          return node
        }
      }
      return null
    })

  }

  get lastVisibleNode(): ListNode<TimelineViewRef<T>> {
    return this.fetchCache('lastVisibleNode', () => {
      for (let node = this.renderedItems.last; node; node = node.prev) {
        const box = this.getRenderBox(node.value);
        if (this.lastReceivedEvent.isRenderBoxVisible(box)) {
          return node
        }
      }
      return null
    })
  }


  fetchCache<Q>(key: string, fn: () => Q): Q {
    let v = this._scrollCache.get(key);
    if (v) {
      return v
    }
    v = fn()
    this._scrollCache.set(key, v);
    return v;
  }

  protected createView(): TimelineViewRef<T> {
    return new HtmlRecyclableViewRef<T>(this.tplItem, this.itemContainer,)
  }

}


