import {EmbeddedViewRef, TemplateRef, ViewContainerRef} from "@angular/core";
import {TimelineAxisRenderBox} from "@sked/app/timeline/TimelineRange";

export type ViewBoxPosition = number | undefined
export type ViewBoxVisibility = 'visible' | 'hidden'


export interface ViewBox {
  top: ViewBoxPosition
  left: ViewBoxPosition
  width: ViewBoxPosition
  height: ViewBoxPosition
  visibility: ViewBoxVisibility
}

export interface TimelineViewRef<T extends object>{
  isInserted: boolean
  isDestroyed: boolean
  setPosition(position: Partial<ViewBox>, refresh: boolean)
  rootElement: HTMLElement
  refreshPosition(): boolean
  insert(): boolean
  attach(): boolean
  detach(): boolean
  update(data: Partial<T>, renderBox?: TimelineAxisRenderBox, viewBox?: Partial<ViewBox>)
  setDisabled(disable: boolean)
  destroy()
  detectChanges()
}

export class HtmlRecyclableViewRef<T extends object> implements TimelineViewRef<T>{
  private _isInserted = false
  private _isAttached = false

  private _viewBoxDirty = false

  private readonly _view: EmbeddedViewRef<any>
  private readonly _viewContext: { data: T, box: TimelineAxisRenderBox }

  private _viewBox: ViewBox = {
    width: undefined,
    height: undefined,
    left: undefined,
    top: undefined,
    visibility: "visible"
  }

  constructor(tmpl: TemplateRef<any>, private viewContainer: ViewContainerRef, contextData?: object) {
    this._viewContext = {
      data: {} as T,
      box: null
    }
    if (contextData) {
      Object.assign(this._viewContext.data, contextData)
    }
    this._view = tmpl.createEmbeddedView(this._viewContext)
  }

  get isInserted(): boolean {
    return this._isInserted
  }

  get isDestroyed(): boolean {
    return this._view.destroyed
  }

  setPosition(position: Partial<ViewBox>, refresh = false) {
    if (!position) {
      return
    }
    let changed = false
    for (const key in this._viewBox) {
      if ((position as object).hasOwnProperty(key)) {
        const prev = this._viewBox[key], current = position[key]
        if (prev != current) {
          changed = true
          this._viewBox[key] = current
        }
      }
    }
    this._viewBoxDirty = changed || this._viewBoxDirty

    if (refresh) {
      this.refreshPosition()
    }
  }

  get rootElement(): HTMLElement {
    if (this._view?.rootNodes?.length || 0 > 0) {
      return this._view.rootNodes[0]
    }
    return null
  }

  refreshPosition(): boolean {
    if (this.isDestroyed) {
      return false
    }
    if (this._viewBoxDirty) {
      const root = this._view.rootNodes[0] as HTMLElement;

      switch (this._viewBox.visibility) {
        case "hidden":
          if (root.style.display != 'none') {
            root.style.display = 'none'
            return true
          }
          break
        case "visible":
          let changed = true
          if (root.style.display == 'none') {
            root.style.removeProperty('display')
            changed = true
          }
          for (const prop of ['top', 'left', 'width', 'height']) {
            const prevValue = parseInt(root.style[prop])
            const newValue = parseInt(this._viewBox[prop])
            if ((prevValue == newValue) || (isNaN(prevValue) && isNaN(newValue))) {
              continue
            }
            changed = true
            if (isNaN(newValue)) {
              root.style.removeProperty(prop)
            } else {
              root.style[prop] = `${newValue}px`
            }
          }

          return changed
        default:
          throw new Error("unknown visibility " + this._viewBox.visibility)
      }

    }
    return false
  }

  insert(): boolean {
    if (this.isInserted) {
      return false
    }

    this.viewContainer.insert(this._view);
    this._isInserted = this._isAttached = true
    return true
  }

  attach(): boolean {
    if (this.isInserted) {
      if (!this._isAttached) {
        this._view.reattach()
        this._isAttached = true
        return true
      }
    }
    return false
  }

  detach(): boolean {
    if (this._isAttached) {
      this._view.detach();
      this._isAttached = false;
      return true;
    }
    return false
  }

  update(data: Partial<T>, renderBox?: TimelineAxisRenderBox, viewBox?: Partial<ViewBox>) {
    Object.assign(this._viewContext.data, data)
    if (renderBox) {
      this._viewContext.box = renderBox
    }
    if (viewBox) {
      this.setPosition(viewBox, false)
    }

    this.refreshPosition()
    this.insert()
    this._view.detectChanges()
  }

  setDisabled(disable: boolean) {
    const root = this._view.rootNodes[0] as HTMLElement;
    if (disable) {
      root.style.display = 'none'
    } else {
      root.style.removeProperty('display')
    }
  }

  destroy() {
    if (!this.isDestroyed) {
      this._isAttached = this._isInserted = false;
      this._view.detach()
      this._view.destroy()
      console.warn('destroy', this._view.rootNodes[0])
      this.viewContainer.detach()
    }
  }

  detectChanges() {
    this._view.detectChanges()
  }

}
