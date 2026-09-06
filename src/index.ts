// Modelo de menú (puro, sin React): tipos, construcción por contribuciones y matching de ruta.
export type { MenuBadge, MenuChild, MenuDivision, MenuIcon, MenuItem, MenuMatch, SidebarContribution, DashboardPlugin } from './menu/types';
export { DEFAULT_ORDER, isDivision } from './menu/types';
export { buildSidebarMenu, activePluginContributions } from './menu/build';
export { isItemActive, findActiveGroupIds } from './menu/active';

// Adaptador de router. El de Next vive en `@mataqque/sidebar/next`.
export type { NavigationAdapter, SidebarLinkProps } from './adapters/navigation';
export { defaultNavigationAdapter } from './adapters/navigation';

// Composición.
export { SidebarProvider, type SidebarProviderProps } from './components/sidebarProvider';
export { useSidebar, type SidebarContextValue } from './components/sidebarContext';
export { Sidebar, type SidebarProps } from './components/sidebar';
export { SidebarHeader, type SidebarHeaderProps } from './components/sidebarHeader';
export { SidebarMenu, type SidebarMenuProps } from './components/sidebarMenu';
export { SidebarMenuItem } from './components/sidebarMenuItem';
export { SidebarMenuGroup } from './components/sidebarMenuGroup';
export { SidebarSection } from './components/sidebarSection';
export { SidebarFlyout } from './components/sidebarFlyout';
export { SidebarBadge } from './components/sidebarBadge';
export { SidebarScroll, type SidebarScrollProps } from './components/sidebarScroll';

// Primitivos y theming, para que el contenido inyectado en los slots case con el resto.
export { SIDEBAR_ICON_CLASS, SIDEBAR_FOCUS_CLASS, SIDEBAR_ICON_STROKE, SidebarChevron, SidebarEyebrow, SidebarSeparator, SidebarText, renderMenuIcon } from './components/primitives';
export { themeToStyle, type SidebarTheme, type SidebarThemeToken } from './components/sidebarTheme';
export { cn } from './lib/cn';
