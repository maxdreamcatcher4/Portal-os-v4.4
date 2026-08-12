/**
 * LAYER 7: PRIMARY ROUTING LAYER
 * Flow system - message routing, path selection, load balancing, flow optimization
 * 
 * Routing directs:
 * - Messages (where they go)
 * - Requests (optimal path)
 * - Flows (resource streams)
 * - Transactions (payment paths)
 */

/**
 * ROUTE: A path through the system
 */
export interface Route {
  id: string;
  from: string;                  // Source agent ID
  to: string;                    // Destination agent ID
  hops: string[];                // Intermediate nodes
  latency: number;               // Expected latency ms
  capacity: number;              // Throughput (rps, Mbps, etc.)
  costPerUnit: number;           // Cost per message/request
  reliability: number;           // 0-1, success probability
  congestion: number;            // 0-1, how full is this route
  priority: number;              // Higher = use first
  status: 'active' | 'congested' | 'failed';
  metadata: Record<string, any>;
}

/**
 * MESSAGE: Data flowing through the system
 */
export interface Message {
  id: string;
  fromAgentId: string;
  toAgentId: string;
  type: string;                  // "request", "response", "event", "transaction"
  payload: any;
  routeId?: string;              // Which route was used
  priority: number;              // 0-100
  timestamp: number;
  status: 'queued' | 'in_transit' | 'delivered' | 'failed';
  latency?: number;              // Actual latency
  retries: number;
  maxRetries: number;
}

/**
 * FLOW: Continuous stream of data
 */
export interface Flow {
  id: string;
  fromAgentId: string;
  toAgentId: string;
  flowType: string;              // "data", "compute", "resources"
  currentRate: number;           // Units per second
  maxRate: number;               // Capacity
  duration: number;              // How long it runs
  status: 'active' | 'paused' | 'completed' | 'failed';
  routeId?: string;
  timestamp: number;
}

/**
 * ROUTER CONFIG: Settings for routing decisions
 */
export interface RouterConfig {
  strategy: 'shortest_path' | 'lowest_cost' | 'load_balanced' | 'reliable' | 'custom';
  maxLatency?: number;           // Max acceptable latency
  minReliability?: number;       // Min acceptable reliability
  preferLowCost?: boolean;
  balanceLoad?: boolean;
  allowCircuits?: boolean;       // Allow routing that creates circuits
}

export class RoutingLayer {
  private routes: Map<string, Route> = new Map();
  private messages: Message[] = [];
  private flows: Map<string, Flow> = new Map();
  private config: RouterConfig;

  constructor(config: RouterConfig = { strategy: 'load_balanced' }) {
    this.config = config;
  }

  /**
   * Register a route
   */
  registerRoute(
    from: string,
    to: string,
    hops: string[] = [],
    latency: number = 10,
    capacity: number = 1000,
    costPerUnit: number = 1,
    reliability: number = 0.99
  ): Route {
    const route: Route = {
      id: `route-${from}-${to}-${Date.now()}`,
      from,
      to,
      hops,
      latency,
      capacity,
      costPerUnit,
      reliability,
      congestion: 0,
      priority: 50,
      status: 'active',
      metadata: {}
    };

    this.routes.set(route.id, route);
    return route;
  }

  /**
   * Find best route between two agents
   */
  findBestRoute(from: string, to: string): Route | null {
    const candidates = Array.from(this.routes.values()).filter(
      r => r.from === from && r.to === to && r.status === 'active'
    );

    if (candidates.length === 0) return null;

    // Sort by strategy
    switch (this.config.strategy) {
      case 'shortest_path':
        return candidates.sort((a, b) => a.latency - b.latency)[0];

      case 'lowest_cost':
        return candidates.sort((a, b) => a.costPerUnit - b.costPerUnit)[0];

      case 'load_balanced':
        return candidates.sort((a, b) => a.congestion - b.congestion)[0];

      case 'reliable':
        return candidates.sort((a, b) => b.reliability - a.reliability)[0];

      default:
        return candidates[0];
    }
  }

  /**
   * Send a message
   */
  sendMessage(
    fromAgentId: string,
    toAgentId: string,
    type: string,
    payload: any,
    priority: number = 50
  ): Message | null {
    const route = this.findBestRoute(fromAgentId, toAgentId);
    if (!route) return null;

    const message: Message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      fromAgentId,
      toAgentId,
      type,
      payload,
      routeId: route.id,
      priority,
      timestamp: Date.now(),
      status: 'queued',
      retries: 0,
      maxRetries: 3
    };

    this.messages.push(message);

    // Update route congestion
    route.congestion += 1 / route.capacity;
    if (route.congestion > 0.8) {
      route.status = 'congested';
    }

    return message;
  }

  /**
   * Deliver a message
   */
  deliverMessage(messageId: string): boolean {
    const message = this.messages.find(m => m.id === messageId);
    if (!message) return false;

    const route = message.routeId ? this.routes.get(message.routeId) : null;

    // Simulate delivery with reliability
    const random = Math.random();
    const reliability = route ? route.reliability : 0.99;

    if (random < reliability) {
      message.status = 'delivered';
      message.latency = route ? route.latency + Math.random() * route.latency * 0.2 : 10;
      return true;
    } else {
      message.retries++;
      if (message.retries < message.maxRetries) {
        message.status = 'queued';
        return false;
      } else {
        message.status = 'failed';
        return false;
      }
    }
  }

  /**
   * Create a flow
   */
  startFlow(
    fromAgentId: string,
    toAgentId: string,
    flowType: string,
    currentRate: number,
    maxRate: number,
    duration: number
  ): Flow | null {
    const route = this.findBestRoute(fromAgentId, toAgentId);
    if (!route) return null;

    // Check capacity
    if (currentRate > route.capacity) {
      return null; // Cannot start flow, capacity exceeded
    }

    const flow: Flow = {
      id: `flow-${fromAgentId}-${toAgentId}-${Date.now()}`,
      fromAgentId,
      toAgentId,
      flowType,
      currentRate,
      maxRate,
      duration,
      status: 'active',
      routeId: route.id,
      timestamp: Date.now()
    };

    this.flows.set(flow.id, flow);

    // Update route congestion
    route.congestion += currentRate / route.capacity;
    if (route.congestion > 0.8) {
      route.status = 'congested';
    }

    return flow;
  }

  /**
   * Pause a flow
   */
  pauseFlow(flowId: string): void {
    const flow = this.flows.get(flowId);
    if (flow && flow.status === 'active') {
      flow.status = 'paused';

      // Free up route capacity
      const route = flow.routeId ? this.routes.get(flow.routeId) : null;
      if (route) {
        route.congestion -= flow.currentRate / route.capacity;
        if (route.congestion < 0.5 && route.status === 'congested') {
          route.status = 'active';
        }
      }
    }
  }

  /**
   * Resume a flow
   */
  resumeFlow(flowId: string): boolean {
    const flow = this.flows.get(flowId);
    if (!flow || flow.status !== 'paused') return false;

    // Check if route has capacity
    const route = flow.routeId ? this.routes.get(flow.routeId) : null;
    if (route && route.congestion + flow.currentRate / route.capacity > 1.0) {
      return false; // Not enough capacity
    }

    flow.status = 'active';

    if (route) {
      route.congestion += flow.currentRate / route.capacity;
      if (route.congestion > 0.8) {
        route.status = 'congested';
      }
    }

    return true;
  }

  /**
   * Get routing status
   */
  getStatus() {
    const routesByStatus = new Map<string, number>();
    for (const route of this.routes.values()) {
      const count = (routesByStatus.get(route.status) || 0) + 1;
      routesByStatus.set(route.status, count);
    }

    const messagesByStatus = new Map<string, number>();
    for (const msg of this.messages) {
      const count = (messagesByStatus.get(msg.status) || 0) + 1;
      messagesByStatus.set(msg.status, count);
    }

    const avgCongestion =
      this.routes.size > 0
        ? Array.from(this.routes.values()).reduce((sum, r) => sum + r.congestion, 0) / this.routes.size
        : 0;

    return {
      timestamp: Date.now(),
      routesCount: this.routes.size,
      routesByStatus: Object.fromEntries(routesByStatus),
      messagesCount: this.messages.length,
      messagesByStatus: Object.fromEntries(messagesByStatus),
      flowsCount: this.flows.size,
      activeFlows: Array.from(this.flows.values()).filter(f => f.status === 'active').length,
      avgCongestion,
      congestionLevel: avgCongestion > 0.8 ? 'high' : avgCongestion > 0.5 ? 'medium' : 'low'
    };
  }
}
