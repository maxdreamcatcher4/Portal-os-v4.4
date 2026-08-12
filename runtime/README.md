# Layer 1: Primary Runtime Layer

## Overview

The **Runtime** is the heartbeat of Portal-OS. It's the continuous, clock-driven system that:

- **Ticks** at regular intervals (e.g., every 100ms)
- **Syncs** state across all layers
- **Dispatches** actions to the appropriate layer handlers
- **Manages lifecycle** events (boot, run, pause, halt)

## Architecture

```
┌─────────────────────────────────────────┐
│      Portal-OS Runtime Heartbeat        │
├─────────────────────────────────────────┤
│                                         │
│  TICK (Heartbeat)                       │
│  ├─ Process dispatch queue              │
│  ├─ Update metrics                      │
│  └─ Check system health                 │
│                                         │
│  SYNC (Consensus)                       │
│  ├─ Collect state deltas                │
│  ├─ Detect conflicts                    │
│  └─ Broadcast updates                   │
│                                         │
│  DISPATCH (Action Router)               │
│  ├─ Route to Substrate                  │
│  ├─ Route to SIM                        │
│  ├─ Route to Identity                   │
│  ├─ Route to Governance                 │
│  ├─ Route to TEC                        │
│  ├─ Route to Routing                    │
│  └─ Route to UI                         │
│                                         │
│  LIFECYCLE (State Machine)              │
│  ├─ boot() → run() → halt()             │
│  ├─ pause() → recovery()                │
│  └─ error handling                      │
│                                         │
└─────────────────────────────────────────┘
```

## Key Concepts

### Tick
A single heartbeat. During each tick:
1. Dequeue and process actions from dispatch queue
2. Update runtime metrics
3. Check system health
4. Track timing and error rates

### Sync
Periodic synchronization across all layers. Ensures:
- State consistency
- Conflict detection
- Eventual consistency

### Dispatch
Action routing engine. Every action has:
- `type` - What it does
- `layer` - Where it goes
- `priority` - When it runs
- `payload` - The data

### Lifecycle
State machine with events:
- `boot` - Initialize the system
- `run` - Start heartbeat
- `pause` - Pause without halting
- `halt` - Graceful shutdown
- `error` - Error state
- `recovery` - Recovery from error

## Configuration

```typescript
const runtimeConfig: RuntimeConfig = {
  tickInterval: 100,           // Tick every 100ms
  maxTickDuration: 50,         // Max 50ms per tick
  syncInterval: 1000,          // Sync every 1 second
  dispatchConcurrency: 10,     // Process 10 actions per tick
  enableMetrics: true          // Enable metric collection
};
```

## Usage

```typescript
const runtime = new PortalOSRuntime(runtimeConfig);

// Boot the system
await runtime.boot();

// Start the heartbeat
await runtime.run();

// Queue an action
const actionId = runtime.queueAction({
  type: 'READ_METRIC',
  layer: 'substrate',
  payload: { metric: 'cpu_usage' },
  priority: 50
});

// Check status
const status = runtime.getStatus();
console.log(`Tick ${status.tickNumber}, ${status.dispatchQueueLength} actions queued`);

// Halt gracefully
await runtime.halt();
```

## Metrics

Each tick collects:
- `tickNumber` - Sequential tick ID
- `timestamp` - Wall-clock time
- `duration` - Time to execute tick
- `eventCount` - Number of actions processed
- `successCount` - Successful actions
- `errorCount` - Failed actions
- `state` - Tick state (pending/executing/complete/error)

## Next Steps

Once the Runtime is established, build:
1. ✅ Runtime Layer (you are here)
2. → Substrate Schema (data structures)
3. → SIM Engine (predictions)
4. → Identity Layer (agents)
5. → Governance Layer (rules)
6. → TEC Layer (economics)
7. → Routing Layer (flows)
8. → UI Wiring (interface)
