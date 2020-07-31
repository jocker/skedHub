import {DateLike} from "@sked/lib/types";
import {Observable} from "rxjs";
import {TimelineSeriesItem} from "@sked/app/timeline/renderers/TimelineSeriesRenderer";

export interface TimelineDatasource<T extends TimelineSeriesItem> {
    // returns the first item which has the smallest startDate >= d
    getFirstItemForDate(d: DateLike): Observable<T>

    getItemBefore(item: T): Observable<T>

    getItemAfter(item: T): Observable<T>

    onInvalidate(): Observable<any>
}
