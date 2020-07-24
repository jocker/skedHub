export function isNullOrUndefined(v: any): boolean {
  if (v == null) {
    return true
  }
  if (typeof v == 'undefined') {
    return true
  }
  return false
}

export function isObject(v: any): boolean {
  if (isNullOrUndefined(v)) {
    return false
  }
  return typeof v === 'object';
}

export function isString(v: any): boolean {
  return typeof v === 'string' || (v instanceof String)
}

export function isFunction(v: any): boolean {
  return typeof v === 'function';
}

export function isDate(v: any): boolean {
  return v instanceof Date;
}

export function isNumber(v: any): boolean {
  return typeof v === 'number' || (v instanceof Number)
}

export function isBoolean(v: any): boolean {
  return typeof v === 'boolean' || (v instanceof Boolean)
}


export function isPrimitive(obj) {
  return (obj !== Object(obj));
}


