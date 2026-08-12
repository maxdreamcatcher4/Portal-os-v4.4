# Layers 6, 7, 8: TEC, Routing, UI

## Layer 6: TEC (Economics Engine)

The **TEC Layer** analyzes and optimizes costs and resource allocation.

### Features:
- **Cost Models** - Define how to calculate costs
- **Cost Tracking** - Record every cost incurrence
- **Budgets** - Set spending limits per agent
- **Incentives** - Reward agents for desired behavior
- **Resource Allocation** - Distribute resources efficiently
- **Trade-off Analysis** - Show Pareto frontiers

### Usage:
```typescript
const tec = new TECLayer();

// Register cost model
const computeModel = tec.registerCostModel(
  'linear_compute',
  'Linear cost based on CPU and memory',
  (usage) => usage.cpu_ms * 0.001 + usage.memory_mb * 0.1,
  { cpu_per_ms: 0.001, memory_per_mb: 0.1 }
);

// Set budget for agent
tec.setBudget('alice', 1000, 'daily', 'USD');

// Record costs
tec.recordCost('alice', computeModel, { cpu_ms: 50000, memory_mb: 512 }, 'compute');

// Register incentive
tec.registerIncentive(
  'reduce_latency',
  'Reduce latency by 10%',
  (state) => state.latency < 90,
  100,
  'USD',
  Date.now() + 2592000000,
  'bonus'
);

// Check budget
const withinBudget = tec.isWithinBudget('alice');
```

## Layer 7: Routing (Flow System)

The **Routing Layer** directs messages, requests, and data flows through the system.

### Features:
- **Routes** - Paths between agents
- **Messages** - Point-to-point communication
- **Flows** - Continuous data streams
- **Load Balancing** - Distribute traffic
- **Congestion Detection** - Monitor route health

### Usage:
```typescript
const routing = new RoutingLayer({ strategy: 'load_balanced' });

// Register routes
routing.registerRoute('alice', 'api', [], 10, 1000, 0.1, 0.99);
routing.registerRoute('alice', 'database', [], 50, 500, 0.2, 0.95);

// Send message
const msg = routing.sendMessage(
  'alice',
  'api',
  'request',
  { method: 'GET', path: '/users' },
  75  // high priority
);

if (msg) {
  // Try to deliver
  const delivered = routing.deliverMessage(msg.id);
}

// Start flow
const flow = routing.startFlow(
  'alice',
  'database',
  'data',
  100,    // current rate
  1000,   // max rate
  3600000 // 1 hour duration
);
```

## Layer 8: UI Wiring (Interface Layer)

The **UI Wiring** connects all layers to real-time dashboards and controls.

### Features:
- **Event Bus** - Real-time events from all layers
- **Subscriptions** - Live data streaming to clients
- **Dashboards** - Customizable widget-based UI
- **Event History** - Recent events for debugging

### Usage:
```typescript
const ui = new UIWiring();

// Connect to runtime
ui.connectRuntime(runtime);

// Create dashboard
const mainDash = ui.createDashboard('Main Dashboard', 'System overview');

// Add widgets
ui.addWidget(mainDash.id, 'CPU Usage', 'gauge', 'substrate:metrics', {
  min: 0,
  max: 100,
  threshold: 80
});

ui.addWidget(mainDash.id, 'Recent Events', 'table', 'ui:events', {
  columns: ['timestamp', 'type', 'source']
});

// Subscribe to live events
ui.subscribe(
  'client-1',
  'metric_update',
  (event) => console.log('Metric:', event.data),
  { metric: 'cpu' }
);

// Emit events
ui.emitEvent('metric_update', 'substrate', { metric: 'cpu', value: 75 }, 'high');

// Get recent events
const recentEvents = ui.getRecentEvents('metric_update', 20);
```

## Integration

All layers work together:
- **Runtime** ticks every 100ms
- **Substrate** collects metrics and events
- **SIM** predicts futures
- **Identity** tracks agents
- **Governance** enforces rules
- **TEC** tracks costs
- **Routing** delivers messages
- **UI** shows everything real-time

## Architecture Summary

```
┌─────────────────────────────────────────┐
│        Portal-OS: 8-Layer Primary Path            │
├─────────────────────────────────────────┤
│                                                  │
│  ✅ Layer 1: Runtime (Heartbeat)                  │
│  ✅ Layer 2: Substrate (World Model)              │
│  ✅ Layer 3: SIM (Mind)                           │
│  ✅ Layer 4: Identity (Population)                │
│  ✅ Layer 5: Governance (Law)                     │
│  ✅ Layer 6: TEC (Economics)                      │
│  ✅ Layer 7: Routing (Flows)                      │
│  ✅ Layer 8: UI (Interface)                       │
│                                                  │
└─────────────────────────────────────────┘
```

## Next Steps

With all 8 layers complete, you can:
1. Implement layer integrations (how they communicate)
2. Add persistence (save to Cloudflare KV)
3. Create API endpoints (expose to Hono)
4. Build dashboard UI (Svelte/React frontend)
5. Deploy to Cloudflare Workers
6. Scale to multi-domain orchestration
