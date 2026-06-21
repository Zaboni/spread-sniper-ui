import * as React from 'react';

export interface DashboardSidebarContextValue {
  onPageItemClick: (itemId: string, hasNestedNavigation: boolean) => void;
  mini: boolean;
  fullyExpanded: boolean;
  fullyCollapsed: boolean;
  hasDrawerTransitions: boolean;
}

const DashboardSidebarContext = React.createContext<DashboardSidebarContextValue | null>(null);

export default DashboardSidebarContext;
