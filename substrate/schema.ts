/**
 * LAYER 2: PRIMARY SUBSTRATE SCHEMA
 * World model - the data structures that represent reality
 * 
 * The substrate is the "nervous system" of Portal-OS.
 * It captures:
 * - Metrics (measurements)
 * - States (current conditions)
 * - Events (what happened)
 * - Temporal deltas (how things changed)
 */

/**
 * METRICS: Quantitative measurements of the world
 * Examples: CPU usage, memory, latency, throughput, temperature
 */
export interface Metric {
  id: string;
  namespace: string;           // e.g., "system.cpu", "network.latency"
  name: string;                // e.g., "usage_percent"
  value: number | boolean | string;
  unit: string;                // e.g., "percent", "ms", "bytes"
  timestamp: number;
  tags: Record<string, string>; // Dimensions: {"zone": "us-west", "service": "api"}
  source: string;              // Where this metric came from
  ttl: number;                 // Time to live in KV
}

/**
 * STATE: Current condition of a domain or agent
 * Examples: Agent status, service health, resource allocation
 */
export interface State {
  id: string;
  entityType: string;          // "agent", "service", "resource", "domain"
  entityId: string;            // Unique identifier
  status: 'active' | 'inactive' | 'degraded' | 'failed' | 'unknown';
  data: Record<string, any>;   // Domain-specific state data
  timestamp: number;
  version: number;             // State version for conflict detection
  metadata: Record<string, any>;
}

/**
 * EVENT: Discrete point-in-time occurrence
 * Examples: Agent login, policy violation, trajectory change, cost update
 */
export interface Event {
  id: string;
  eventType: string;           // e.g., "agent.login", "policy.violation", "sim.trajectory_updated"
  timestamp: number;
  source: string;              // Which layer generated this
  entityId: string;            // What triggered it
  entityType: string;
  data: Record<string, any>;   // Event payload
  severity: 'info' | 'warning' | 'error' | 'critical';
  tags: string[];              // For filtering: ["security", "audit", "performance"]
}

/**
 * TEMPORAL DELTA: Change over time
 * Captures the derivative - how something changed from T-1 to T
 */
export interface TemporalDelta {
  id: string;
  entityId: string;
  entityType: string;
  metricName: string;
  valueT0: number | boolean | string;     // Value at T-1
  valueT1: number | boolean | string;     // Value at T
  delta: number;                           // Change magnitude
  percentChange: number;                   // Percent change
  timestamp: number;
  period: number;                          // Time span (ms)
  trend: 'increasing' | 'decreasing' | 'stable';
  significance: 'normal' | 'anomaly' | 'critical';
}

/**
 * SUBSTRATE SCHEMA: Collection of all world data
 * This is what gets persisted in KV namespace
 */
export class SubstrateSchema {
  // Metrics bucket
  metrics: Map<string, Metric> = new Map();
  
  // States bucket
  states: Map<string, State> = new Map();
  
  // Events bucket (time-series)
  events: Event[] = [];
  
  // Deltas bucket
  deltas: Map<string, TemporalDelta> = new Map();
  
  // Metadata
  schemaVersion: string = '1.0';
  lastUpdate: number = Date.now();
  updateCount: number = 0;

  /**
   * Write a metric to substrate
   */
  writeMetric(metric: Metric): void {
    const key = `${metric.namespace}:${metric.name}:${JSON.stringify(metric.tags)}`;
    this.metrics.set(key, metric);
    this.lastUpdate = Date.now();
    this.updateCount++;
  }

  /**
   * Read a metric from substrate
   */
  readMetric(namespace: string, name: string, tags?: Record<string, string>): Metric | undefined {
    const key = `${namespace}:${name}:${JSON.stringify(tags || {})}`;
    return this.metrics.get(key);
  }

  /**
   * Query metrics by namespace
   */
  queryMetrics(namespace: string): Metric[] {
    return Array.from(this.metrics.values()).filter(
      m => m.namespace === namespace
    );
  }

  /**
   * Write state
   */
  writeState(state: State): void {
    const key = `${state.entityType}:${state.entityId}`;
    this.states.set(key, state);
    this.lastUpdate = Date.now();
    this.updateCount++;
  }

  /**
   * Read state
   */
  readState(entityType: string, entityId: string): State | undefined {
    const key = `${entityType}:${entityId}`;
    return this.states.get(key);
  }

  /**
   * Query states by type
   */
  queryStates(entityType: string): State[] {
    return Array.from(this.states.values()).filter(
      s => s.entityType === entityType
    );
  }

  /**
   * Append event
   */
  appendEvent(event: Event): void {
    this.events.push(event);
    this.lastUpdate = Date.now();
    this.updateCount++;
  }

  /**
   * Query events by type
   */
  queryEvents(eventType: string, since?: number): Event[] {
    return this.events.filter(e => {
      const typeMatch = e.eventType === eventType;
      const timeMatch = since ? e.timestamp >= since : true;
      return typeMatch && timeMatch;
    });
  }

  /**
   * Query events by time range
   */
  queryEventsByTimeRange(startTime: number, endTime: number): Event[] {
    return this.events.filter(e => e.timestamp >= startTime && e.timestamp <= endTime);
  }

  /**
   * Write temporal delta
   */
  writeDelta(delta: TemporalDelta): void {
    const key = `${delta.entityId}:${delta.metricName}:${delta.timestamp}`;
    this.deltas.set(key, delta);
    this.lastUpdate = Date.now();
    this.updateCount++;
  }

  /**
   * Get recent deltas for entity
   */
  getRecentDeltas(entityId: string, limit: number = 100): TemporalDelta[] {
    return Array.from(this.deltas.values())
      .filter(d => d.entityId === entityId)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * Analyze trend from recent deltas
   */
  analyzeTrend(entityId: string, metricName: string, windowSize: number = 10): {
    trend: 'increasing' | 'decreasing' | 'stable';
    avgDelta: number;
    volatility: number;
  } {
    const deltas = Array.from(this.deltas.values())
      .filter(d => d.entityId === entityId && d.metricName === metricName)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, windowSize);

    if (deltas.length === 0) {
      return { trend: 'stable', avgDelta: 0, volatility: 0 };
    }

    const avgDelta = deltas.reduce((sum, d) => sum + d.delta, 0) / deltas.length;
    const variance = deltas.reduce((sum, d) => sum + Math.pow(d.delta - avgDelta, 2), 0) / deltas.length;
    const volatility = Math.sqrt(variance);

    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (avgDelta > volatility * 0.5) trend = 'increasing';
    if (avgDelta < -volatility * 0.5) trend = 'decreasing';

    return { trend, avgDelta, volatility };
  }

  /**
   * Get substrate health snapshot
   */
  getHealthSnapshot() {
    const activeDomains = new Set(Array.from(this.states.values()).map(s => s.entityType));
    const recentEvents = this.events.slice(-100);
    const errorEvents = recentEvents.filter(e => e.severity === 'error' || e.severity === 'critical');
    const anomalies = Array.from(this.deltas.values()).filter(d => d.significance === 'anomaly');

    return {
      timestamp: Date.now(),
      metricsCount: this.metrics.size,
      statesCount: this.states.size,
      eventsCount: this.events.length,
      activeDomains: Array.from(activeDomains),
      recentErrorRate: errorEvents.length / Math.max(recentEvents.length, 1),
      anomalyCount: anomalies.length,
      lastUpdate: this.lastUpdate,
      updateCount: this.updateCount
    };
  }

  /**
   * Export substrate to JSON (for persistence)
   */
  export() {
    return {
      metrics: Array.from(this.metrics.values()),
      states: Array.from(this.states.values()),
      events: this.events,
      deltas: Array.from(this.deltas.values()),
      metadata: {
        schemaVersion: this.schemaVersion,
        lastUpdate: this.lastUpdate,
        updateCount: this.updateCount,
        exportTime: Date.now()
      }
    };
  }

  /**
   * Import substrate from JSON (for recovery)
   */
  import(data: any): void {
    this.metrics.clear();
    this.states.clear();
    this.events = [];
    this.deltas.clear();

    (data.metrics || []).forEach((m: Metric) => this.writeMetric(m));
    (data.states || []).forEach((s: State) => this.writeState(s));
    (data.events || []).forEach((e: Event) => this.appendEvent(e));
    (data.deltas || []).forEach((d: TemporalDelta) => this.writeDelta(d));

    this.schemaVersion = data.metadata?.schemaVersion || this.schemaVersion;
  }
}

/**
 * Helper: Create a metric
 */
export function createMetric(
  namespace: string,
  name: string,
  value: number | boolean | string,
  unit: string,
  tags: Record<string, string> = {},
  source: string = 'unknown',
  ttl: number = 3600
): Metric {
  return {
    id: `${namespace}:${name}:${Date.now()}`,
    namespace,
    name,
    value,
    unit,
    timestamp: Date.now(),
    tags,
    source,
    ttl
  };
}

/**
 * Helper: Create a state
 */
export function createState(
  entityType: string,
  entityId: string,
  status: 'active' | 'inactive' | 'degraded' | 'failed' | 'unknown',
  data: Record<string, any> = {}
): State {
  return {
    id: `${entityType}:${entityId}:${Date.now()}`,
    entityType,
    entityId,
    status,
    data,
    timestamp: Date.now(),
    version: 1,
    metadata: {}
  };
}

/**
 * Helper: Create an event
 */
export function createEvent(
  eventType: string,
  entityType: string,
  entityId: string,
  data: Record<string, any> = {},
  source: string = 'unknown',
  severity: 'info' | 'warning' | 'error' | 'critical' = 'info',
  tags: string[] = []
): Event {
  return {
    id: `${eventType}:${Date.now()}`,
    eventType,
    timestamp: Date.now(),
    source,
    entityId,
    entityType,
    data,
    severity,
    tags
  };
}

/**
 * Helper: Create a temporal delta
 */
export function createTemporalDelta(
  entityId: string,
  entityType: string,
  metricName: string,
  valueT0: number | boolean | string,
  valueT1: number | boolean | string,
  period: number
): TemporalDelta {
  const delta = typeof valueT1 === 'number' && typeof valueT0 === 'number' ? valueT1 - valueT0 : 0;
  const percentChange = typeof valueT0 === 'number' && valueT0 !== 0 ? (delta / valueT0) * 100 : 0;

  let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
  if (delta > 0) trend = 'increasing';
  if (delta < 0) trend = 'decreasing';

  const significance = Math.abs(percentChange) > 20 ? 'anomaly' : 'normal';

  return {
    id: `${entityId}:${metricName}:${Date.now()}`,
    entityId,
    entityType,
    metricName,
    valueT0,
    valueT1,
    delta,
    percentChange,
    timestamp: Date.now(),
    period,
    trend,
    significance: significance as 'normal' | 'anomaly' | 'critical'
  };
}
