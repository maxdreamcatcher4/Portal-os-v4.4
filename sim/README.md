# Layer 3: Primary SIM Engine

## Overview

The **SIM** is the predictive mind of Portal-OS. It takes substrate data and generates:

- **Trajectories** - Predicted futures ("if we continue on this path...")
- **Invariants** - Constraints that must hold ("this should always be true")
- **Scenario Trees** - Branching possibilities (decision trees of futures)
- **Modal Predictions** - The most likely future + recommendations

SIM is what makes Portal-OS cognitive. It doesn't just observe the world—it anticipates what happens next.

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│         Portal-OS SIM Engine (Predictive Mind)                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  TRAJECTORIES (Futures)                                          │
│  ├─ Start state → End state (via steps)                          │
│  ├─ Confidence decay over horizon                                │
│  ├─ Anomaly detection within trajectory                          │
│  └─ Tags: bullish/bearish/stable/risk                            │
│                                                                  │
│  INVARIANTS (Constraints)                                        │
│  ├─ Condition: state → boolean                                   │
│  ├─ Examples: age >= 0, cost <= budget, health >= minimum        │
│  ├─ Violation tracking and resolution                            │
│  └─ Severity: info/warning/critical                              │
│                                                                  │
│  SCENARIOS (Branching Possibilities)                             │
│  ├─ Name, description, probability                               │
│  ├─ Impact score (0-1)                                           │
│  ├─ Triggers (conditions that lead here)                         │
│  ├─ Consequences (what happens)                                  │
│  └─ Mitigations (how to prevent/reduce)                          │
│                                                                  │
│  SCENARIO TREES (Decision Trees)                                 │
│  ├─ Branching depth and breadth                                  │
│  ├─ Multiple paths through scenarios                             │
│  ├─ Probability × Impact for each path                           │
│  └─ Timeline projections                                         │
│                                                                  │
│  MODAL PREDICTIONS (Most Likely Future)                          │
│  ├─ Most likely scenario                                         │
│  ├─ Confidence intervals                                         │
│  ├─ Secondary scenarios                                          │
│  └─ Recommendations (what to do)                                 │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

## Key Concepts

### Trajectory
A sequence of predicted states from now until some horizon.

```typescript
trajectory = {
  startTime: T0,
  startState: {...current state...},
  endTime: T0 + 1 hour,
  steps: [
    { timestamp: T0+10min, state: {...}, confidence: 0.93, anomalies: [] },
    { timestamp: T0+20min, state: {...}, confidence: 0.91, anomalies: [] },
    ...
  ],
  confidence: 0.75,
  tags: ['stable', 'bullish']
}
```

### Invariant
A predicate that should always be true. Used for:
- Safety constraints
- Domain rules
- Physical laws
- Business rules

```typescript
const ageInvariant = registerInvariant(
  'age_non_negative',
  'Agent age must be non-negative',
  'agent',
  (state) => state.age >= 0,
  'critical'
);
```

### Scenario
A possible future state with:
- Probability (how likely)
- Impact (how much it affects the system)
- Triggers (conditions that cause it)
- Consequences (what follows)
- Mitigations (how to prevent/reduce)

### Scenario Tree
A decision tree showing multiple branching futures.

### Modal Prediction
The most likely future, with alternatives and recommendations.

## Usage

```typescript
const sim = new SIMEngine();

// Generate a trajectory
const currentState = { 
  cpu: 45, 
  memory: 2000,
  requests_per_sec: 1200
};

const trajectory = sim.generateTrajectory(
  currentState,
  3600000,  // 1 hour horizon
  'default',
  60        // 60 steps
);

console.log(`Trajectory confidence: ${trajectory.confidence}`);
console.log(`Final predicted state:`, trajectory.steps[trajectory.steps.length - 1].state);

// Register invariants
sim.registerInvariant(
  'cpu_under_80',
  'CPU usage should stay under 80%',
  'system',
  (state) => state.cpu < 80,
  'warning'
);

sim.registerInvariant(
  'memory_available',
  'At least 512MB memory must be free',
  'system',
  (state) => (8192 - state.memory) >= 512,
  'critical'
);

// Check invariants against trajectory
for (const step of trajectory.steps) {
  const violations = sim.checkInvariants(step.state, 'system', 'compute');
  if (violations.length > 0) {
    console.warn(`Invariant violations at ${step.timestamp}:`, violations);
  }
}

// Create scenarios
const cpuSpikeScenario = sim.createScenario(
  'cpu_spike',
  'CPU usage spikes due to batch job',
  0.3,  // 30% probability
  0.7,  // High impact
  ['batch_job_starts'],
  { cpu: 95, latency_increase: 5 }
);

const memoryLeakScenario = sim.createScenario(
  'memory_leak',
  'Memory leak develops over time',
  0.1,  // Low probability
  0.9,  // Critical impact
  ['service_restart_age > 7days'],
  { memory: 7500, oom_risk: true }
);

// Build scenario tree
const tree = sim.buildScenarioTree(cpuSpikeScenario, 3, 2);

// Generate modal prediction
const prediction = sim.generateModalPrediction(3600000, 0.8);
console.log('Most likely scenario:', prediction.mostLikelyScenario.name);
console.log('Recommendations:', prediction.recommendations);

// Get SIM status
const status = sim.getStatus();
console.log(`SIM Status:`);
console.log(`  Trajectories: ${status.trajectoriesCount}`);
console.log(`  Invariants: ${status.invariantsCount}`);
console.log(`  Unresolved violations: ${status.totalViolations}`);
```

## Integration with Other Layers

- **Runtime**: SIM runs on every tick to predict system evolution
- **Substrate**: Reads metrics, states, events to feed prediction models
- **Governance**: Uses invariants and scenarios to enforce policies
- **TEC**: Analyzes cost trajectories to optimize economics
- **Identity**: Predicts agent behavior and influence flows
- **Routing**: Routes based on predicted state transitions
- **UI**: Displays trajectories and predictions to users

## Advanced Features (Future)

- Multi-model ensemble (combine multiple predictors)
- Counterfactual analysis ("what if X didn't happen")
- Sensitivity analysis (which inputs matter most)
- Inverse prediction ("how to reach this state")
- Causal reasoning (not just correlation)

## Next Steps

✅ Runtime Layer  
✅ Substrate Schema  
✅ SIM Engine (you are here)  
→ Identity Layer (tracks agent states and influence)  
→ Governance Layer (enforces policies and constraints)  
→ TEC Layer (analyzes and optimizes costs)  
→ Routing Layer (routes flows through the system)  
→ UI Wiring (displays predictions and controls)  
