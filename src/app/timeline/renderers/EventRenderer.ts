import {TimelineSeriesItem, TimelineSeriesRenderer} from "@sked/app/timeline/renderers/TimelineSeriesRenderer";

export interface EventItem extends TimelineSeriesItem{
  color: string
  title: string
}

class EventRenderer extends TimelineSeriesRenderer<EventItem>{

}
