import {TimelineSeriesItem, TimelineSeriesRenderer} from "@sked/app/timeline/renderers/TimelineSeriesRenderer";
import {WeekZoomLevel} from "@sked/app/timeline/TimeZoomLevel";
import {DateLike} from "@sked/lib/types";
import {EMPTY, Observable, of} from "rxjs";
import {TimelineDatasource} from "@sked/app/timeline/datasource/TimelineDataSource";
import {makeTime} from "@sked/lib/utils";

export class WeekendRenderer extends TimelineSeriesRenderer<TimelineSeriesItem> {
  protected init() {
    this.setDataSource(new DataSource())
  }
}


class DataSource implements TimelineDatasource<TimelineSeriesItem> {

  private zoomLevel = WeekZoomLevel

  getFirstItemForDate(src: DateLike): Observable<TimelineSeriesItem> {
    const endDate = WeekZoomLevel.trimToEnd(src)
    const startDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate() - 2)
    return this.makeItem(startDate, endDate)
  }

  getItemAfter(item: TimelineSeriesItem): Observable<TimelineSeriesItem> {
    const endDate = WeekZoomLevel.add(item.endTime, 1), startDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate() - 2)
    return this.makeItem(startDate, endDate)
  }

  getItemBefore(item: TimelineSeriesItem): Observable<TimelineSeriesItem> {

    const endDate = WeekZoomLevel.add(item.endTime, -1), startDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate() - 2)

    return this.makeItem(startDate, endDate)
  }

  private makeItem(startDate: DateLike, endDate: DateLike): Observable<TimelineSeriesItem> {
    const startTs = makeTime(startDate)
    return of({
      startTime: startTs,
      endTime: makeTime(endDate),
      id: startTs.toString(),
      text: this.zoomLevel.format('full', startDate)
    })
  }

  onInvalidate(): Observable<this> {
    return EMPTY;
  }

}
