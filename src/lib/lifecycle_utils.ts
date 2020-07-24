import {AsyncSubject, Observable, of} from "rxjs";
import {isDevMode} from "@angular/core";

const componentRefs: WeakMap<object, ComponentWatcher> = new WeakMap();
const lifecycleDecoratorSym = Symbol('__ng__lifecycle_decorated');

interface ComponentDefinition {
  onInit(): void;

  onDestroy(): void;
}

const getCmpDefinition = <T>(type: any): (ComponentDefinition | null) => {
  const lookupProps = [`ɵcmp`, 'ɵdir'];
  if (type) {
    for (const prop of lookupProps) {
      if (!!type[prop]) {
        return type[prop]
      }
    }
  }
  return null
};


function createDecorator(originalFn: any, decoratorFn: any): any {
  return function (): void {
    const args = Array.prototype.slice.call(arguments);
    if (typeof originalFn === 'function') {
      try {
        return originalFn.apply(this, args);
      } finally {
        decoratorFn.apply(this, arguments);
      }
    }
  };
}

class ComponentWatcher {
  private _destroySubject: AsyncSubject<any>;
  private _initSubject: AsyncSubject<any>;

  constructor() {
  }

  get initSubject(): AsyncSubject<any> {
    this._initSubject = this._initSubject || new AsyncSubject<any>();
    return this._initSubject;
  }

  get destroySubject(): AsyncSubject<any> {
    this._destroySubject = this._destroySubject || new AsyncSubject<any>();
    return this._destroySubject;
  }

  onInit() {
    if (this._initSubject) {
      this._initSubject.next(true);
      this._initSubject.complete()
    }
  }

  onDestroy() {
    if (this._destroySubject) {
      this._destroySubject.next(true);
      this._destroySubject.complete()
    }
  }
}

export function LifecycleHooks(): any {
  return function (target, propertyKey: string, _: PropertyDescriptor): void {

    const cmp = getCmpDefinition(target);
    if (!cmp) {
      return;
    }

    if (cmp[lifecycleDecoratorSym]) {
      return
    }
    const emptyFn = () => {
    };

    const onInit = cmp.onInit || emptyFn;
    const onDestroy = cmp.onDestroy || emptyFn;

    cmp.onDestroy = createDecorator(onDestroy, function () {
      const ref = componentRefs.get(this);
      if (ref) {
        ref.onDestroy();
      }
    });

    cmp.onInit = createDecorator(onInit, function () {
      const ref = componentRefs.get(this);
      if (ref) {
        ref.onInit();
      }
    });

    cmp[lifecycleDecoratorSym] = true;


  };
}

export function getComponentWatcher(instance: object): ComponentWatcher {

  const cmp = instance ? getCmpDefinition(instance.constructor) || null : null;
  if (!cmp) {
    return
  }

  if (!cmp[lifecycleDecoratorSym]) {
    // throw new Error('component not decorated')
    return
  }

  let watcher = componentRefs.get(instance);
  if (watcher) {
    return watcher
  }

  watcher = new ComponentWatcher();
  componentRefs.set(instance, watcher);


  return watcher;
}

export function onLifecycleDestroy(target: any): Observable<any> {
  const c = getComponentWatcher(target);
  if (!c) {
    if (isDevMode()) {
      throw new Error('not a component or component missing @LifecycleHooks annotation')
    } else {
      return of(true)
    }
  }
  return c.destroySubject;
}
