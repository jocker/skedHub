import {format} from "date-fns";
import {DateLike} from "@sked/lib/types";
import {makeDate, makeTime} from "@sked/lib/utils";

type timeZoomLevel = 'minute' | 'tenMinute' | 'fifteenMinute' | 'hour' | 'day' | 'week' | 'month' | 'year'

export type timeLevelFormat = 'short' | 'medium' | 'full'

export interface TimeZoomLevel {
  key: string
  parent?: TimeZoomLevel,

  trimToStart(d: DateLike): Date

  trimToEnd(d: DateLike): Date

  add(d: DateLike, delta: number): Date

  count(startDate: DateLike, endDate: DateLike): number

  format(pattern: timeLevelFormat, date: DateLike): string
}


function createTimeZoomLevel(levelKey: timeZoomLevel, parent?: TimeZoomLevel): TimeZoomLevel {
  return {
    parent: parent,
    key: levelKey,
    trimToEnd(d: DateLike): Date {
      return trimToEnd(d, levelKey)
    },
    trimToStart(d: DateLike): Date {
      return trimToStart(d, levelKey)
    },
    add(d: DateLike, delta: number): Date {
      const res = add(d, levelKey, delta)
      return res
    },
    count(startDate: DateLike, endDate: DateLike): number {
      return divisionCount(levelKey, startDate, endDate)
    },
    format(pattern: timeLevelFormat, date: DateLike): string {
      return formatDate(date, pattern, levelKey)
    }
  }
}

function formatDate(date: DateLike, pattern: timeLevelFormat, intervalType: timeZoomLevel): string {
  switch (intervalType) {
    case "day":
      switch (pattern) {
        case "short":
          return format(date, 'd')
        case "medium":
          return format(date, 'd MMMM')
        case "full":
          return format(date, "d MMMM yyyy")
        default:
          return ""
      }
    case "hour":
      switch (pattern) {
        case "short":
          return format(date, 'HH')
        case "medium":
          return format(date, 'HH:mm')
        case "full":
          return format(date, "HH:mm")
        default:
          return ""
      }
    case "month":
      switch (pattern) {
        case "short":
          return format(date, 'MMM')
        case "medium":
          return format(date, 'yyyy MMM')
        case "full":
          return format(date, "yyyy MMMM")
        default:
          return ""
      }
    case "week":
      const weekEnd = trimToEnd(date, 'week')
      return `${format(date, 'd MMM')} - ${format(weekEnd, 'd MMM')}`
      switch (pattern) {
        case "short":
          return `${format(date, 'd')} - ${format(weekEnd, 'd')}`
        case "medium":
          return `${format(date, 'd')} - ${format(weekEnd, 'd')}`
        case "full":
          return `${format(date, 'd')} - ${format(weekEnd, 'd')}`
        default:
          return ""
      }
    case "tenMinute":
    case "fifteenMinute":
    case "minute":
      return `${format(date, 'HH:mm')} `
      switch (pattern) {
        case "short":
          return `${format(date, 'd')} - ${format(weekEnd, 'd')}`
        case "medium":
          return `${format(date, 'd')} - ${format(weekEnd, 'd')}`
        case "full":
          return `${format(date, 'd')} - ${format(weekEnd, 'd')}`
        default:
          return ""
      }

    default:
      return "unknown"
  }
}

function trimToStart(d: DateLike, intervalType: timeZoomLevel): Date {
  const date = makeDate(d);



  let year = date.getFullYear(),
    month = date.getMonth(),
    day = date.getDate(),
    hour = date.getHours(),
    minute = date.getMinutes();
  switch (intervalType) {
    case 'year':
      month = 1
    case 'month':
      day = 1
    case 'day':
      hour = 0;
    case 'hour':
      minute = 0;
      break
    case 'tenMinute':
      minute = Math.floor(minute/10)*10
      break
    case 'fifteenMinute':
      minute = Math.floor(minute/15)*15
      break
    case 'minute':
      break
    default:
      break
  }

  if (intervalType == 'week') {
    const wDay = date.getDay()
    day = date.getDate() - wDay + (wDay == 0 ? -6 : 1)
  }
  return new Date(year, month, day, hour, minute, 0)
}


function trimToEnd(d: DateLike, intervalType: timeZoomLevel): Date {
  const date = makeDate(d)
  let year = date.getFullYear(),
    month = date.getMonth(),
    day = date.getDate(),
    hour = date.getHours(),
    minute = date.getMinutes(),
    seconds = 0;
  switch (intervalType) {
    case 'week':
      return trimToStart(new Date(year, month, day + 7, hour, minute, seconds), intervalType)
    case 'year':
      year += 1
      month = 1
      break
    case 'month':
      month+=1
      day = 1
      break
    case 'day':
      day +=1;
      hour=0;
      break
    default:

      minute = 0;
      seconds = 0
      break
  }

  return new Date(year, month, day, hour, 0, 0)
}

function add(d: DateLike, intervalType: timeZoomLevel, delta: number): Date {
  const date = makeDate(d)
  if (delta == 0) {
    return new Date()
  }

  let year = date.getFullYear(),
    month = date.getMonth(),
    day = date.getDate(),
    hour = date.getHours(),
    minute = date.getMinutes(),
    seconds = date.getSeconds();

  switch (intervalType) {
    case 'minute':
      minute += delta;
      break;
    case 'tenMinute':
      minute += 10 * delta;
      break;
    case 'fifteenMinute':
      minute += 15 * delta;
      break;
    case 'hour':
      hour += delta
      break
    case 'day':
      day += delta
      break
    case 'week':
      day += 7 * delta
      break
    case 'month':
      month += delta
      break
    case 'year':
      year += delta;
      break
  }

  return new Date(year, month, day, hour, minute, seconds)
}

function divisionCount(intervalType: timeZoomLevel, from: DateLike, to: DateLike): number {
  let minuteDiv = 0;
  switch (intervalType) {
    case 'minute':
      minuteDiv = 1;
      break;
    case 'tenMinute':
      minuteDiv = 10;
      break;
    case 'fifteenMinute':
      minuteDiv = 15;
      break;
    case 'hour':
      minuteDiv = 60;
      break;
    case 'day':
      minuteDiv = 60 * 24;
      break;
    case 'week':
      minuteDiv = 7 * 60 * 24;
      break;
  }

  if (minuteDiv > 0) {
    return Math.ceil(makeTime(to) - makeTime(from)) / (1000 * 60 * minuteDiv)
  }

  const startDate = makeDate(from), endDate = makeDate(to)

  switch (intervalType) {
    case 'month':
      return (endDate.getFullYear() - startDate.getFullYear()) * 12 + endDate.getMonth()
    case 'year':
      return endDate.getFullYear() - startDate.getFullYear() - 1
  }

  return 1

}


export const YearZoomLevel = createTimeZoomLevel('year')
export const MonthZoomLevel = createTimeZoomLevel('month', YearZoomLevel)
export const WeekZoomLevel = createTimeZoomLevel('week', MonthZoomLevel)
export const DayZoomLevel = createTimeZoomLevel('day', WeekZoomLevel)
export const HourZoomLevel = createTimeZoomLevel('hour', DayZoomLevel)
export const FifteenMinuteZoomLevel = createTimeZoomLevel('fifteenMinute', HourZoomLevel)
export const TenMinuteZoomLevel = createTimeZoomLevel('tenMinute', HourZoomLevel)
export const MinuteZoomLevel = createTimeZoomLevel('minute', TenMinuteZoomLevel)

