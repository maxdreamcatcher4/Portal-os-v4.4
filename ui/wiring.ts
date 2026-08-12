/**
 * LAYER 8: PRIMARY UI WIRING
 * Interface layer - real-time updates, dashboards, controls, visualizations
 * 
 * UI wiring connects:
 * - Runtime metrics (live heartbeat)
 * - Substrate data (world model)
 * - SIM predictions (futures)
 * - Identity graph (agents and influence)
 * - Governance status (policies and violations)
 * - TEC economics (costs and budgets)
 * - Routing flows (message and data flows)
 */

import { PortalOSRuntime } from '../runtime/core';

/**
 * UI EVENT: Real-time update to push to clients
 */
export interface UIEvent {
  id: string;
  type: string;                  // "metric_update", "violation", "prediction", etc.
  timestamp: number;
  source: string;                // Which layer generated this
  data: any;                     // Event payload
  priority: 'low' | 'normal' | 'high' | 'critical';
}

/**
 * DASHBOARD WIDGET: A piece of UI
 */
export interface DashboardWidget {
  id: string;
  title: string;
  type: string;                  // "gauge", "graph", "table", "alert", etc.
  refreshRate: number;           // Milliseconds
  dataSource: string;            // Where to get data from
  config: Record<string, any>;   // Widget-specific config
  position: { x: number; y: number };
  size: { width: number; height: number };
}

/**
 * DASHBOARD: Collection of widgets
 */
export interface Dashboard {
  id: string;
  name: string;
  description: string;
  widgets: DashboardWidget[];
  createdAt: number;
  updatedAt: number;
}

/**
 * REAL-TIME SUBSCRIPTION: Client subscribed to live data
 */
export interface Subscription {
  id: string;
  clientId: string;
  eventType: string;             // What events to receive
  callback: (event: UIEvent) => void; // What to call when event occurs
  filters?: Record<string, any>; // Optional filters
  active: boolean;
}

export class UIWiring {
  private eventBus: UIEvent[] = [];
  private subscriptions: Map<string, Subscription> = new Map();
  private dashboards: Map<string, Dashboard> = new Map();
  private runtime: PortalOSRuntime | null = null;

  /**
   * Connect to runtime for live updates
   */
  connectRuntime(runtime: PortalOSRuntime): void {
    this.runtime = runtime;
    // Would set up event listeners here
  }

  /**
   * Emit a UI event
   */
  emitEvent(
    type: string,
    source: string,
    data: any,
    priority: 'low' | 'normal' | 'high' | 'critical' = 'normal'
  ): void {
    const event: UIEvent = {
      id: `event-${Date.now()}`,
      type,
      timestamp: Date.now(),
      source,
      data,
      priority
    };

    this.eventBus.push(event);

    // Notify relevant subscriptions
    for (const subscription of this.subscriptions.values()) {
      if (subscription.active && subscription.eventType === type) {
        // Check filters
        if (this.matchesFilters(event, subscription.filters)) {
          subscription.callback(event);
        }
      }
    }

    // Keep last 1000 events
    if (this.eventBus.length > 1000) {
      this.eventBus.shift();
    }
  }

  /**
   * Check if event matches subscription filters
   */
  private matchesFilters(
    event: UIEvent,
    filters?: Record<string, any>
  ): boolean {
    if (!filters) return true;

    for (const [key, value] of Object.entries(filters)) {
      if (event.data[key] !== value) {
        return false;
      }
    }

    return true;
  }

  /**
   * Subscribe to events
   */
  subscribe(
    clientId: string,
    eventType: string,
    callback: (event: UIEvent) => void,
    filters?: Record<string, any>
  ): string {
    const subscription: Subscription = {
      id: `sub-${clientId}-${Date.now()}`,
      clientId,
      eventType,
      callback,
      filters,
      active: true
    };

    this.subscriptions.set(subscription.id, subscription);
    return subscription.id;
  }

  /**
   * Unsubscribe from events
   */
  unsubscribe(subscriptionId: string): void {
    const subscription = this.subscriptions.get(subscriptionId);
    if (subscription) {
      subscription.active = false;
    }
  }

  /**
   * Create a dashboard
   */
  createDashboard(name: string, description: string = ''): Dashboard {
    const dashboard: Dashboard = {
      id: `dash-${Date.now()}`,
      name,
      description,
      widgets: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    this.dashboards.set(dashboard.id, dashboard);
    return dashboard;
  }

  /**
   * Add widget to dashboard
   */
  addWidget(
    dashboardId: string,
    title: string,
    type: string,
    dataSource: string,
    config: Record<string, any> = {}
  ): DashboardWidget | null {
    const dashboard = this.dashboards.get(dashboardId);
    if (!dashboard) return null;

    const widget: DashboardWidget = {
      id: `widget-${Date.now()}`,
      title,
      type,
      refreshRate: 1000,
      dataSource,
      config,
      position: { x: 0, y: 0 },
      size: { width: 300, height: 200 }
    };

    dashboard.widgets.push(widget);
    dashboard.updatedAt = Date.now();

    return widget;
  }

  /**
   * Get a dashboard
   */
  getDashboard(dashboardId: string): Dashboard | undefined {
    return this.dashboards.get(dashboardId);
  }

  /**
   * Get recent events
   */
  getRecentEvents(type?: string, limit: number = 50): UIEvent[] {
    let events = this.eventBus.slice(-limit);

    if (type) {
      events = events.filter(e => e.type === type);
    }

    return events.reverse(); // Most recent first
  }

  /**
   * Get UI status
   */
  getStatus() {
    const eventsByType = new Map<string, number>();
    const eventsByPriority = new Map<string, number>();

    for (const event of this.eventBus) {
      const typeCount = (eventsByType.get(event.type) || 0) + 1;
      eventsByType.set(event.type, typeCount);

      const priorityCount = (eventsByPriority.get(event.priority) || 0) + 1;
      eventsByPriority.set(event.priority, priorityCount);
    }

    return {
      timestamp: Date.now(),
      eventBusSize: this.eventBus.length,
      eventsByType: Object.fromEntries(eventsByType),
      eventsByPriority: Object.fromEntries(eventsByPriority),
      subscriptionsCount: this.subscriptions.size,
      activeSubscriptions: Array.from(this.subscriptions.values()).filter(s => s.active).length,
      dashboardsCount: this.dashboards.size,
      recentEvents: this.getRecentEvents(undefined, 10)
    };
  }
}
