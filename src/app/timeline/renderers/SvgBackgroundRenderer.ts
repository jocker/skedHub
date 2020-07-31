import {ElementRef} from "@angular/core";
import {TimeZoomHandler} from "@sked/app/timeline/TimelineRange";
import {Container, Line, Pattern, Rect, SVG} from "@svgdotjs/svg.js";

const fullSizePercent = '100%' as any as number

export class SvgBackgroundRenderer {

  private svgRoot: Container
  private gridPattern: Pattern
  private zoomHandler: TimeZoomHandler
  private gridHeight = 40
  private gridRect: Rect
  private todayLine: Line



  constructor(private svgElement: ElementRef<SVGElement>) {

    this.svgRoot = SVG(svgElement.nativeElement) as Container;

    svgElement.nativeElement.addEventListener('mousedown', ev => {
      console.warn('down');
      (ev.target as HTMLElement).addEventListener('mouseleave', ev1 => {
        console.warn('left')
      })
    })

  }


  connect(zoomHandler: TimeZoomHandler) {
    this.zoomHandler = zoomHandler;

    let prevItemSize = 0;

    this.zoomHandler.onUpdate().subscribe(value => {
      if (zoomHandler.itemSize != prevItemSize) {
        this.refreshPattern()
      }

    })

  }

  private refreshPattern() {
    if (this.gridPattern) {
      this.gridPattern.remove()
    }
    this.gridPattern = this.svgRoot.pattern(this.zoomHandler.itemSize, this.gridHeight, pattern => {
      pattern.path(`M 0 0 H ${this.zoomHandler.itemSize} V ${this.gridHeight}`).stroke({
        width: 1,
        color: 'blue'
      }).fill('none')
    })
    if (!this.gridRect) {
      this.gridRect = this.svgRoot.rect(fullSizePercent, fullSizePercent)
    }
    this.gridRect.fill(this.gridPattern)

    if (this.todayLine) {
      this.todayLine.remove()
    }

    const offset = this.zoomHandler.getOffsetForDate(Date.now())
    this.todayLine = this.svgRoot.line(100, 0, 100, fullSizePercent).stroke({
      width: 2,
      color: 'red'
    })

  }

  private fakeNumber(percentString: string): number {
    return percentString as any as number;
  }

}
