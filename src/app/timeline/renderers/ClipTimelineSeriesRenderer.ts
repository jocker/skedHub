import {
  TimelineSeriesItem,
  TimelineSeriesRenderer,
  TimelineViewData
} from "@sked/app/timeline/renderers/TimelineSeriesRenderer";
import {ScrollEvent} from "@sked/app/timeline/TimelineRange";
import {ListNode} from "@sked/lib/linked_list";
import {HtmlRecyclableViewRef} from "@sked/app/timeline/RecyclabeViewRef";

export class ClipTimelineSeriesRenderer<T extends TimelineSeriesItem> extends TimelineSeriesRenderer<T>{
  protected updateViews(ev: ScrollEvent, entries: TimelineViewData<T>[]) {
    super.updateViews(ev, entries);
    this.updateViewBox(ev, this.firstVisibleNode);
    if(this.firstVisibleNode != this.lastVisibleNode){
      this.updateViewBox(ev, this.lastVisibleNode);
    }
  }

  private updateViewBox(ev:ScrollEvent, node: ListNode<HtmlRecyclableViewRef<T>>){
    if(node){
      const view = node.value
      const data = this.getRenderData(view)
      if(data){
        const box = ev.source.getVisibleRenderBox(data.startTime, data.endTime)
        this.updateView(ev, {
          box: box,
          data: data,
          view: view
        })
      }
    }
  }
}
