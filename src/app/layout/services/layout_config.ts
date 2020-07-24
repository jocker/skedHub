export interface LayoutToolbarConfig {
  background: string,
  hidden: boolean,
  position: 'above' | 'above-static' | 'above-fixed' | 'below' | 'below-static' | 'below-fixed'
}

export interface LayoutFooterConfig {
  background: string,
  hidden: boolean,
  position: 'above' | 'above-static' | 'above-fixed' | 'below' | 'below-static' | 'below-fixed'
}

export interface LayoutSidebarConfig {
  hidden: boolean,
}

export interface LayoutNavbarConfig {
  primaryBackground?: string,
  secondaryBackground?: string,
  hidden: boolean,
  folded: boolean,
  position: 'left' | 'right' | 'top',
}

export interface LayoutThemeConfig {
  colorTheme?: string;
  customScrollbars: boolean;
  style?: string,
}

export type LayoutConfigSection = 'theme' | 'navbar' | 'toolbar' | 'footer' | 'sidebar'

export interface LayoutConfig {
  theme: LayoutThemeConfig,
  navbar: LayoutNavbarConfig,
  toolbar: LayoutToolbarConfig,
  footer: LayoutFooterConfig,
  sidebar: LayoutSidebarConfig
}
