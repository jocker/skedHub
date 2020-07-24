import {
  AfterViewChecked,
  AfterViewInit,
  ApplicationRef,
  ChangeDetectorRef,
  Component,
  ComponentFactoryResolver,
  ElementRef,
  EmbeddedViewRef,
  Injector,
  OnInit,
  Renderer2,
  TemplateRef,
  ViewChild,
  ViewContainerRef
} from '@angular/core';
import {startOfYear} from 'date-fns';
import {normalizeWheel, onElementResize} from "@sked/lib/utils";
import {takeUntil} from "rxjs/operators";
import {LifecycleHooks, onLifecycleDestroy} from "@sked/lib/lifecycle_utils";
import {LinkedList, ListNode} from "@sked/lib/linked_list";


@LifecycleHooks()
@Component({
  selector: 'app-timeline-view',
  templateUrl: './timeline-view.component.html',
  styleUrls: ['./timeline-view.component.scss']
})
export class TimelineViewComponent implements OnInit, AfterViewInit, AfterViewChecked {

  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    private viewContainerRef: ViewContainerRef,
    private renderer: Renderer2,
    private cfr: ComponentFactoryResolver,
    private ar: ApplicationRef,
    private injector: Injector
  ) {

  }

  @ViewChild("timelineEl") timelineEl: ElementRef<HTMLElement>
  @ViewChild("scrollViewport") scrollViewportEl: ElementRef<HTMLElement>
  @ViewChild('cellViewContainer', {read: ViewContainerRef, static: true}) cellViewContainer: ViewContainerRef;
  @ViewChild('tplHeaderCell') tplHeaderCell: TemplateRef<any>

  private viewportSize = {
    width: 0,
    height: 0
  }

  private viewportScroll = {
    top: 0,
    left: 0,
  }

  private visibleHeaderNodes = new LinkedList<HeaderCell>()
  private recycledCells = new LinkedList<HeaderCell>()
  private cellSizePx = 100;

  ngOnInit(): void {

  }

  ngAfterViewInit(): void {

    /* for (let i = 0; i < 100; i++) {
       const cell = new HeaderCell(this.tplHeaderCell, this.cellViewContainer, {
         title: `cell ${i}`
       })
       cell.insert(i * 100, 100)
     }*/

    onElementResize(this.scrollViewportEl).pipe(
      takeUntil(onLifecycleDestroy(this))
    ).subscribe((value: ResizeObserverEntry) => {
      this.handleViewportResize(value.contentRect.width, value.contentRect.height)
    })

  }

  private handleViewportResize(width: number, height: number) {

    if (this.viewportSize.width != width || this.viewportSize.height != height) {
      if (this.viewportSize.width + this.viewportSize.height == 0) {
        this.viewportSize.width = width;
        this.viewportSize.height = height;
        this.ensureHeadersVisible()
        requestAnimationFrame(time => {
          let node = this.visibleHeaderNodes.first;
          while (node){
            node.value.insert()
            node = node.next
          }
        })
      }

    }
  }

  private ensureHeadersVisible() {
    if (this.visibleHeaderNodes.isEmpty) {
      let offset = Math.floor(this.viewportScroll.left / this.cellSizePx)*this.cellSizePx
      const maxOffset = offset + this.viewportSize.width
      while (offset < maxOffset) {
        const node = this.getCellForRender()
        node.value.position.setValues(offset, this.cellSizePx);
        offset += this.cellSizePx;
        this.visibleHeaderNodes.append(node)
      }

    }

  }

  handleScroll(ev: Event) {
    if (ev.type == 'scroll') {
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

      } else {
        this.handleHorizontalScroll(scrollValue, delta)
      }
    }
  }

  private pendingAnimationFrame = NaN

  handleHorizontalScroll(scrollValue: number, delta: number, fromAnimationFrame=false) {
    if(this.pendingAnimationFrame){
      cancelAnimationFrame(this.pendingAnimationFrame)
    }
    if(!fromAnimationFrame && Math.abs(delta) > 1000){

      this.pendingAnimationFrame = window.requestAnimationFrame(time => {
        console.warn('requestAnimationFrame', scrollValue, delta)
        this.pendingAnimationFrame = NaN;
        this.handleHorizontalScroll(scrollValue, delta, true)

      })
      return
    }
    console.warn('scrollValue', scrollValue, delta)

    if (!delta) {
      return
    }

    window.list = this.visibleHeaderNodes

    const viewportStart = scrollValue, viewportEnd = viewportStart + this.viewportSize.width
    const removedCells = [];
    // remove invisible cells
    for (let node = this.visibleHeaderNodes.first; ;) {
      if (!node) {
        break
      }
      const cell = node.value;
      const total = cell.position.size + cell.position.offset
      const next = node.next

      if (total < viewportStart || cell.position.offset > viewportEnd) {
        this.visibleHeaderNodes.remove(node)
        this.recycledCells.append(node)
      }
      node = next
    }


    const insertBefore = delta < 0;
    let insertedCells: HeaderCell[]

    if(!this.visibleHeaderNodes.isEmpty){
      for (; ;) {

        let targetNode = insertBefore ? this.visibleHeaderNodes.first : this.visibleHeaderNodes.last
        if (!targetNode) {
          break
        }

        const cell = targetNode.value
        let offset = 0

        if (insertBefore && (viewportStart <= cell.position.offset)) {
          offset = cell.position.offset - this.cellSizePx
        } else if (!insertBefore && (cell.position.total <= viewportEnd)) {
          offset = cell.position.total
        } else {
          break
        }

        let appendNode = this.getCellForRender()
        if (!insertedCells) {
          insertedCells = [appendNode.value]
        } else {
          insertedCells.push(appendNode.value)
        }


        appendNode.value.position.setValues(offset, this.cellSizePx)


        if (insertBefore) {
          this.visibleHeaderNodes.prepend(appendNode)
        } else {
          this.visibleHeaderNodes.append(appendNode)
        }

      }
    }else{
      this.ensureHeadersVisible()
      insertedCells = this.visibleHeaderNodes.values()
    }

    if (insertedCells) {

      //console.warn('insertedCells', insertedCells.map(value => value.position.offset))

        for (let cell of insertedCells) {
          cell.insert()
          cell.reposition()
        }
    }


  }

  private getCellForRender(): ListNode<HeaderCell> {
    let node = this.recycledCells.shift()
    if (!node) {
      const cell = new HeaderCell(this.tplHeaderCell, this.cellViewContainer, {
        title: `cell`
      })
      node = new ListNode<HeaderCell>(cell)
    }
    return node
  }

  handleWheel(ev: WheelEvent) {
    ev.preventDefault()
    const normalized = normalizeWheel(ev);
    const scroller = this.scrollViewportEl.nativeElement;

    const opt = {
      left: normalized.pixelX,
      top: normalized.pixelY,
    }
    scroller.scrollBy({
      left: normalized.pixelX,
      top: normalized.pixelY,
    })
  }

  ngAfterViewChecked(): void {

  }


}


class CellPosition {
  private is: Position
  private was: Position
  private _isDirty = true

  constructor(offset: number, size: number) {
    this.setValues(offset, size);
    this._isDirty = true;
  }

  get isDirty(): boolean {
    return this._isDirty
  }

  reset() {
    this._isDirty = false
    this.is = this.was;
  }

  realize() {
    this._isDirty = false
    this.was = this.is;
  }

  setValues(offset: number, size: number): boolean {
    const prevIs = this.is

    if (prevIs?.size != size || prevIs?.offset != offset) {
      if (!this._isDirty) {
        this.was = prevIs;
        this._isDirty = true
      }
      this.is = {
        offset: offset,
        size: size
      }
      return true
    }

    return false

  }

  get offset(): number {
    return this.is.offset
  }

  get size(): number {
    return this.is.size
  }

  get total(): number {
    return this.is.offset + this.is.size
  }


}

interface Position {
  offset: number
  size: number
}


class HeaderCell {
  private _isInserted = false
  private _isAttached = false
  private _isDestroyed = false

  private static instanceCounter = 0


  private embView: EmbeddedViewRef<any>

  private contextData = {style: null, title: 'xxx'}

  position = new CellPosition(0, 0)

  private horizontal = true

  public id = HeaderCell.instanceCounter += 1

  constructor(tmpl: TemplateRef<any>, private viewContainer: ViewContainerRef, contextData: object) {
    this.contextData = Object.assign(this.contextData, contextData)
    this.embView = tmpl.createEmbeddedView(this.contextData)
  }

  get isInserted(): boolean {
    return this._isInserted
  }

  get isDestroyed(): boolean {
    return this._isDestroyed
  }


  insert(offset?: number, size?: number): boolean {
    if (this.isInserted) {
      return false
    }
    if (!isNaN(offset) && !isNaN(size)) {
      this.position.setValues(offset, size)
    }
    this.position.realize()
    this.reposition(true)
    this.viewContainer.insert(this.embView)
    this._isInserted = true
    this._isAttached = true
    return true
  }

  destroy(): boolean {
    if (!this._isDestroyed) {
      this._isDestroyed = true
      this.embView.destroy()
      return true
    }
    return false
  }

  attach(): boolean {
    if (!this.isInserted) {
      return false
    }
    if (this._isAttached) {
      return false
    }
    if (this._isDestroyed) {
      return false
    }
    this.embView.reattach()
    return true
  }

  detach(): boolean {
    if (this._isAttached) {
      this.embView.detach()
      return true
    }
    return false
  }

  setStyle(style: object) {
    this.contextData.style = Object.assign(this.contextData.style || {}, style)
    this.embView.detectChanges()
  }

  reposition(force = false) {
    if (force || this.position.isDirty) {
      const root = this.embView.rootNodes[0] as HTMLElement;
      if (this.horizontal) {
        root.style.left = this.position.offset + 'px'
        root.style.width = this.position.size + 'px'
      } else {
        root.style.top = this.position.offset + 'px'
        root.style.height = this.position.size + 'px'
      }
      this.position.realize()
    }
  }

}

const x = {
  type: 'year',
  trimToBeginning(d: Date) {
    startOfYear(d)
  }
}

const
  minute = 60 * 1000,
  tenMinute = 10 * minute,
  fifteenMinute = 15 * minute,
  hour = 60 * minute,
  day = 24 * hour,
  week = day * 7,
  month = week * 4,
  year = 365 * day

type TimeSegmentType = 'minute' | 'tenMinute' | 'fifteenMinute' | 'hour' | 'day' | 'week' | 'month' | 'year' | null

interface TimeSegment {
  type: TimeSegmentType
  parentType: TimeSegmentType,
  minInterval: number // date diff when this activates
}

const yearTimeInterval: TimeSegment = {
  type: 'year',
  parentType: null,
  minInterval: 3 * year
}


function find(startDate: Date, endDate: Date) {
  const diff = endDate.getTime() - startDate.getTime()

}
