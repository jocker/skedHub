import {Component, OnInit} from '@angular/core';
import {LifecycleHooks} from "@sked/lib/lifecycle_utils";
import {LayoutNavbarConfig} from "@sked/app/layout/services/layout_config";
import {LayoutConfigService} from "@sked/app/layout/services/layout-config.service";
import {NavigationItem} from "@sked/lib/types";
import {layoutAnimations} from "@sked/app/layout/layout-animations";


const navSections = {
  Dashboard: {
    id: 'dashboard',
    icon: 'dashboard',
    title: 'Dashboard',
    type: 'item',
    url: 'dashboard',
  } as NavigationItem,
  DeviceList: {
    id: 'devices-list',
    icon: 'list',
    title: 'List',
    type: 'item',
    url: 'devices',
  } as NavigationItem,
  DeviceCommandResultsList: {
    id: 'command-results',
    icon: 'settings_remote',
    title: 'Command Results',
    type: 'item',
    url: 'command-results',
  } as NavigationItem,
  CampaignsList: {
    id: 'campaigns',
    icon: 'videocam',
    title: 'Campaigns',
    type: 'item',
    url: 'campaigns',
  } as NavigationItem,
  BulkImport: {
    id: 'bulk-import',
    icon: 'import_export',
    title: 'Bulk Import',
    type: 'item',
    url: 'bulk-import',
  } as NavigationItem,
  DeviceSlotImages: {
    id: 'device-slot-images',
    icon: 'insert_photo',
    title: 'Store Images',
    type: 'item',
    url: 'device-slot-images',
  } as NavigationItem,
  Users: {
    id: 'users',
    icon: 'person',
    title: 'Users',
    type: 'item',
    url: 'users',
  } as NavigationItem,
  BrandPartnersLibrary: {
    id: 'brand-partners',
    icon: 'stars',
    title: 'Brand Partners',
    type: 'item',
    url: 'brand-partners',
  } as NavigationItem,
  ProductLibrary: {
    id: 'brand-products',
    icon: 'shopping_basket',
    title: 'Products',
    type: 'item',
    url: 'brand-products',
  } as NavigationItem,
  RetailerLibrary: {
    id: 'retailers',
    icon: 'business',
    title: 'Retailers',
    type: 'item',
    url: 'retailers',
  } as NavigationItem,
  StoreLibrary: {
    id: 'stores',
    icon: 'shopping_cart',
    title: 'Stores',
    type: 'item',
    url: 'stores',
  } as NavigationItem,
  DeviceSlots: {
    id: 'device-slots',
    icon: 'important_devices',
    title: 'Device Slots',
    type: 'item',
    url: 'device-slots',
  } as NavigationItem,
  FilmLibrary: {
    id: 'media-files',
    icon: 'videocam',
    title: 'Films',
    type: 'item',
    url: 'play-list-library',
  } as NavigationItem,
  PromoPrograms: {
    id: 'promo-programs',
    icon: 'videocam',
    title: 'Programs',
    type: 'item',
    url: 'promo-programs',
  } as NavigationItem,
  PromoSchedule: {
    id: 'promo-schedules',
    icon: 'videocam',
    title: 'Schedule',
    type: 'item',
    url: 'promo-schedules',
  } as NavigationItem,
};

export const navigationItems: NavigationItem[] = [{
  title: 'Sections',
  type: 'group',
  children: [
    navSections.Dashboard,
    {
      icon: 'tablet_android',
      title: 'Devices',
      url: '/devices',
      type: 'collapsible',
      children: [
        navSections.DeviceList,
        navSections.DeviceCommandResultsList,
        {
          icon: 'info',
          title: 'Library',
          type: 'collapsible',
          children: [
            navSections.BrandPartnersLibrary,
            navSections.ProductLibrary,
            navSections.RetailerLibrary,
            navSections.StoreLibrary,
            navSections.DeviceSlots,
            navSections.FilmLibrary
          ]
        },
      ]
    },
    navSections.CampaignsList,
    navSections.BulkImport,
    navSections.DeviceSlotImages,
    navSections.Users,

    {
      icon: 'videocam',
      title: 'Promo Campaigns',
      type: 'collapsible',
      children: [
        navSections.PromoPrograms,
        navSections.PromoSchedule,
      ]
    },
  ]
}
];

@LifecycleHooks()
@Component({
  selector: 'app-main-vertical-navbar',
  templateUrl: './main-vertical-navbar.component.html',
  styleUrls: ['./main-vertical-navbar.component.scss'],
  animations : layoutAnimations
})
export class MainVerticalNavbar implements OnInit {

  layoutConfig: LayoutNavbarConfig
  navigationItems = navigationItems

  private expandedItems = new Set<NavigationItem>()

  constructor(
    private svcLayout: LayoutConfigService
  ) {
    this.layoutConfig = svcLayout.layoutConfig.navbar
  }

  ngOnInit(): void {
  }

  toggleSidebarOpened() {
    this.svcLayout.getNavSidebar().toggleOpen()
  }

  toggleSidebarFolded() {
    this.svcLayout.getNavSidebar().toggleFold()
  }

  toggleExpanded(item: NavigationItem, ev: any){
    if(this.expandedItems.has(item)){
      this.expandedItems.delete(item)
    }else {
      this.expandedItems.add(item)
    }
  }

  isItemExpanded(item: NavigationItem): boolean{
    return this.expandedItems.has(item)
  }

}
