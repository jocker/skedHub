import {DateLike} from "@sked/lib/types";
import {Observable, of, Subject} from "rxjs";
import {TimelineSeriesItem} from "@sked/app/timeline/renderers/TimelineSeriesRenderer";
import {TimelineDatasource} from "@sked/app/timeline/datasource/TimelineDataSource";
import {makeTime} from "@sked/lib/utils";


export class ArrayTimelineDataSource<T extends TimelineSeriesItem> implements TimelineDatasource<T> {

  static create<T extends TimelineSeriesItem>(data: T[]): ArrayTimelineDataSource<T> {
    const ds = new ArrayTimelineDataSource<T>();
    ds.setData(data);
    return ds;
  }

  private invalidateSubject = new Subject<this>()
  private data: T[]

  getFirstItemForDate(d: DateLike): Observable<T> {
    const ts = makeTime(d)
    return of(this.data.find(item => {
      return (item.endTime >= ts)
    }) || null)
  }

  getItemAfter(item: T): Observable<T> {
    console.warn(`getItemAfter ${item.startTime} ${item.endTime}` )
    const idx = this.data.indexOf(item)
    if (idx >= 0) {
      if (idx == this.data.length) {
        return of(null)
      }
      return of(this.data[idx + 1])
    }
    return of(null)
  }

  getItemBefore(item: T): Observable<T> {
    console.warn(`getItemBefore ${item.startTime} ${item.endTime}` )
    const idx = this.data.indexOf(item)
    if (idx > 0) {
      return of(this.data[idx - 1])
    }
    return of(null)
  }

  onInvalidate(): Observable<this> {
    return this.invalidateSubject;
  }

  setData(data: T[]) {
    const sorted = data.sort((a, b) => {
      return a.startTime - b.startTime
    })
    this.data = [].concat(sorted)
  }


}
