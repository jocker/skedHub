export interface Assignable {
  assign(values: any): this
}

export interface NavigationItem {
  title: string;
  icon?: string;
  type?: 'item' | 'group' | 'collapsible';
  translate?: string;
  hidden?: boolean;
  url?: string;
  classes?: string;
  exactMatch?: boolean;
  externalUrl?: boolean;
  badge?: {
    title?: string;
    translate?: string;
    bg?: string;
    fg?: string;
  };
  children?: NavigationItem[];
}

export function applyDefaults(item: NavigationItem): NavigationItem {
  if(item.children?.length){
    switch (item.type) {
      case 'group':
      case 'collapsible':
        break
      default:
        item.type = 'collapsible'
    }

    item.children = item.children.map(child => applyDefaults(child))
  }

  return item
}
