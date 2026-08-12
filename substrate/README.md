# Layer 2: Primary Substrate Schema

## Overview

The **Substrate** is the world model. It's the data structure that captures everything Portal-OS knows about reality:

- **Metrics** - Quantitative measurements (CPU, memory, latency, throughput)
- **States** - Current conditions of entities (agent status, service health)
- **Events** - Discrete occurrences (logins, violations, trajectory changes)
- **Temporal Deltas** - How things changed (trends, anomalies, derivatives)

The substrate is the "nervous system" — it feeds data to all other layers.

## Architecture

```
┌─────────────────────────────────────────┐
│    Portal-OS Substrate (World Model)      │
├─────────────────────────────────────────┤
│                                         │
│  METRICS (Measurements)                 │
│  ├─ system.cpu.usage_percent             │
│  ├─ network.latency_ms                   │
│  ├─ memory.available_bytes               │
│  ├─ service.throughput_rps               │
│  ├─ [Tagged with dimensions]             │
│  └─ [TTL for auto-expiration]             │
│                                         │
│  STATES (Current Conditions)            │
│  ├─ agent:alice -> status: active        │
│  ├─ service:auth -> status: healthy      │
│  ├─ resource:vm1 -> status: degraded     │
│  ├─ [Versioned for conflict detection]   │
│  └─ [Domain-specific data]                │
│                                         │
│  EVENTS (Discrete Occurrences)         │
│  ├─ agent.login { who: alice, ... }      │
│  ├─ policy.violation { ... }              │
│  ├─ sim.trajectory_updated { ... }        │
│  ├─ tec.cost_changed { ... }              │
│  ├─ [Time-series ordered]                │
│  ├─ [Severity tagged]                    │
│  └─ [Queryable by time range]             │
│                                         │
│  TEMPORAL DELTAS (Change Analysis)      │
│  ├─ valueT0 -> valueT1 (period)          │
│  ├─ delta, percentChange                  │
│  ├─ trend (increasing/stable/decreasing) │
│  ├─ significance (normal/anomaly)        │
│  └─ [For SIM trend analysis]              │
│                                         │
└─────────────────────────────────────────┘
```

## Data Structures

### Metric
```typescript
interface Metric {
  id: string;                   // Unique identifier
  namespace: string;            // e.g., "system.cpu", "network.latency"
  name: string;                 // e.g., "usage_percent"
  value: number | boolean | string; // The measurement
  unit: string;                 // e.g., "percent", "ms", "bytes"
  timestamp: number;            // When measured
  tags: Record<string, string>; // Dimensions: {"zone": "us-west", "service": "api"}
  source: string;               // Where it came from
  ttl: number;                  // Time to live in KV
}
```

### State
```typescript
interface State {
  id: string;
  entityType: string;           // "agent", "service", "resource", "domain"
  entityId: string;             // Unique identifier
  status: 'active' | 'inactive' | 'degraded' | 'failed' | 'unknown';
  data: Record<string, any>;    // Domain-specific state data
  timestamp: number;
  version: number;              // For conflict detection
  metadata: Record<string, any>;
}
```

### Event
```typescript
interface Event {
  id: string;
  eventType: string;            // e.g., "agent.login", "policy.violation"
  timestamp: number;
  source: string;               // Which layer generated this
  entityId: string;             // What triggered it
  entityType: string;
  data: Record<string, any>;    // Event payload
  severity: 'info' | 'warning' | 'error' | 'critical';
  tags: string[];               // For filtering
}
```

### Temporal Delta
```typescript
interface TemporalDelta {
  id: string;
  entityId: string;
  entityType: string;
  metricName: string;
  valueT0: number | boolean | string;     // Value at T-1
  valueT1: number | boolean | string;     // Value at T
  delta: number;                           // Change
  percentChange: number;                   // Percent change
  timestamp: number;
  period: number;                          // Time span
  trend: 'increasing' | 'decreasing' | 'stable';
  significance: 'normal' | 'anomaly' | 'critical';
}
```

## Usage

```typescript
const substrate = new SubstrateSchema();

// Write a metric
const cpuMetric = createMetric(
  'system.cpu',
  'usage_percent',
  78.5,
  'percent',
  { zone: 'us-west', service: 'api' },
  'prometheus',
  3600
);
substrate.writeMetric(cpuMetric);

// Write state
const agentState = createState(
  'agent',
  'alice',
  'active',
  { role: 'admin', department: 'engineering' }
);
substrate.writeState(agentState);

// Append event
const loginEvent = createEvent(
  'agent.login',
  'agent',
  'alice',
  { method: 'sso', timestamp: Date.now() },
  'identity-layer',
  'info',
  ['security', 'audit']
);
substrate.appendEvent(loginEvent);

// Record temporal delta
const delta = createTemporalDelta(
  'alice',
  'agent',
  'activity_score',
  75.2,
  82.1,
  1000
);
substrate.writeDelta(delta);

// Query
const cpuMetrics = substrate.queryMetrics('system.cpu');
const agentState = substrate.readState('agent', 'alice');
const loginEvents = substrate.queryEvents('agent.login', Date.now() - 86400000);
const trend = substrate.analyzeTrend('alice', 'activity_score');

// Get health snapshot
const health = substrate.getHealthSnapshot();
console.log(`Active domains: ${health.activeDomains.length}, Error rate: ${health.recentErrorRate}`);
```

## Persistence

The substrate can be exported and imported for persistence in Cloudflare KV:

```typescript
// Export to KV
const exported = substrate.export();
await KV.put('substrate:state', JSON.stringify(exported));

// Import from KV
const stored = await KV.get('substrate:state', 'json');
substrate.import(stored);
```

## Integration Points

The substrate feeds all other layers:
- **Runtime**: Consumes metrics for health checks
- **SIM**: Analyzes deltas for trajectory prediction
- **Identity**: Reads agent states
- **Governance**: Monitors for policy violations (events)
- **TEC**: Tracks cost-relevant metrics
- **Routing**: Routes actions based on state
- **UI**: Displays metrics, states, events in real-time

## Next Steps

✅ Runtime Layer  
✅ Substrate Schema (you are here)  
⏭️ SIM Engine (uses deltas to predict)  
⏭️ Identity Layer (tracks agent states)  
⏭️ Governance Layer (monitors events for violations)  
⏭️ TEC Layer (analyzes cost metrics)  
⏭️ Routing Layer (routes based on state)  
⏭️ UI Wiring (displays substrate data)
