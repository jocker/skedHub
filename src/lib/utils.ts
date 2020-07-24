import {ElementRef, Type} from "@angular/core";
import {EMPTY, Observable} from "rxjs";
import {debounceTime, startWith} from "rxjs/operators";
import ResizeObserver from "resize-observer-polyfill";
import {Assignable} from "@sked/lib/types";
import {isPrimitive} from "@sked/lib/type_check_utils";

export function onElementResize(el: ElementRef, debounce = 100): Observable<ResizeObserverEntry> {

  if (!el) {
    return EMPTY;
  }

  const nativeEl = el.nativeElement as HTMLElement;

  const source: Observable<ResizeObserverEntry> = new Observable(subscriber => {
    const observer = new ResizeObserver((arg) => {
      subscriber.next(arg[0])
    });

    observer.observe(nativeEl);

    return () => {
      observer.unobserve(nativeEl);
      observer.disconnect();
    }
  });

  const entry: ResizeObserverEntry = {
    contentRect: nativeEl.getBoundingClientRect() as DOMRectReadOnly,
    target: nativeEl
  }

  return source.pipe(
    startWith(entry),
    debounceTime(debounce)
  )

}

export function deepClone<T>(src: T): T {
  return JSON.parse(JSON.stringify(src))
}


export function deepEqual(x: any, y: any): boolean {

  if (x === y) {
    return true;
  }

  if (isPrimitive(x) || isPrimitive(y)) {
    return x === y;
  }

  const xType = typeof x, yType = typeof y;
  if (xType !== yType) {
    return false;
  }

  switch (xType) {
    case "function":
      return false
    case "object":
      if (x.constructor !== y.constructor) {
        return false;
      }

      const objToString = Object.prototype.toString

      if (x.toString != objToString || y.toString != objToString) {
        return x.toString() == y.toString()
      }

      const xKeys = Object.keys(x), yKeys = Object.keys(y);
      if (xKeys.length !== yKeys.length) {
        return false
      }

      for (const prop of xKeys) {
        if (!y.hasOwnProperty(prop)) {
          return false
        }
        if (!deepEqual(x[prop], y[prop])) {
          return false
        }
      }
      return true;
    default:
      throw new Error("unhandled object type")
  }

}

export function getNestedObject<T>(src: any, ...props: string[]): T | null {
  for (let prop = props.shift(); prop && src; prop = props.shift()) {
    if (src.hasOwnProperty(prop)) {
      src = src[prop]
    } else {
      return null
    }
  }
  return src
}

export function getNestedTypedObject<T extends Assignable>(src: any, typeOfT: Type<T>, ...props: string[]): T {
  src = getNestedObject(src, ...props)
  if (src) {
    return new typeOfT().assign(src)
  }
  return null
}

export function getNestedTypedArray<T extends Assignable>(src: any, typeOfT: Type<T>, ...props: string[]): T[] {
  src = getNestedObject(src, ...props);
  if (Array.isArray(src)) {
    return (src as any[]).map(value => {
      return new typeOfT().assign(value)
    })
  }
  return null
}

const NORMALIZED_WHEEL_PIXEL_STEP = 10;
const NORMALIZED_WHEEL_LINE_HEIGHT = 40;
const NORMALIZED_WHEEL_PAGE_HEIGHT = 800;

export function normalizeWheel(event) /*object*/ {
  let sX = 0, sY = 0,       // spinX, spinY
    pX = 0, pY = 0;       // pixelX, pixelY

  // Legacy
  if ('detail' in event) {
    sY = event.detail;
  }
  if ('wheelDelta' in event) {
    sY = -event.wheelDelta / 120;
  }
  if ('wheelDeltaY' in event) {
    sY = -event.wheelDeltaY / 120;
  }
  if ('wheelDeltaX' in event) {
    sX = -event.wheelDeltaX / 120;
  }

  // side scrolling on FF with DOMMouseScroll
  if ('axis' in event && event.axis === event.HORIZONTAL_AXIS) {
    sX = sY;
    sY = 0;
  }

  pX = sX * NORMALIZED_WHEEL_PIXEL_STEP;
  pY = sY * NORMALIZED_WHEEL_PIXEL_STEP;

  if ('deltaY' in event) {
    pY = event.deltaY;
  }
  if ('deltaX' in event) {
    pX = event.deltaX;
  }

  if ((pX || pY) && event.deltaMode) {
    if (event.deltaMode == 1) {          // delta in LINE units
      pX *= NORMALIZED_WHEEL_LINE_HEIGHT;
      pY *= NORMALIZED_WHEEL_LINE_HEIGHT;
    } else {                             // delta in PAGE units
      pX *= NORMALIZED_WHEEL_PAGE_HEIGHT;
      pY *= NORMALIZED_WHEEL_PAGE_HEIGHT;
    }
  }

  // Fall-back if spin cannot be determined
  if (pX && !sX) {
    sX = (pX < 1) ? -1 : 1;
  }
  if (pY && !sY) {
    sY = (pY < 1) ? -1 : 1;
  }

  return {
    spinX: sX,
    spinY: sY,
    pixelX: pX,
    pixelY: pY,
    stepSize: Math.abs(pX | pY)
  };
}
