# Layer 5: Primary Governance Layer

## Overview

The **Governance Layer** is the law system of Portal-OS. It enforces:

- **Policies** - Rules that should be followed ("CPU should stay below 80%")
- **Constraints** - Boundaries that cannot be violated ("age must be 0-150")
- **Permissions** - Capabilities granted to agents ("alice can deploy")
- **Domain Rules** - Domain-specific laws (finance, security, operations)
- **Escalations** - Critical situations that need human attention

Governance is the enforcement layer. It ensures the system obeys its rules.

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│         Portal-OS Governance Layer (Law System)                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  POLICIES (System Rules)                                        │
│  ├─ "CPU should stay < 80%" → warn if violated                   │
│  ├─ "Memory leak detection" → enforce if violated                │
│  ├─ "Unauthorized access" → escalate if violated               │
│  ├─ Enabled/disabled                                             │
│  └─ Severity: info/warning/critical                              │
│                                                                  │
│  CONSTRAINTS (Boundaries)                                        │
│  ├─ Agent.age >= 0 AND age <= 150                                 │
│  ├─ Transaction.amount > 0                                       │
│  ├─ Resource.memory >= 0                                         │
│  ├─ Actions: warn / reject / repair                              │
│  └─ Severity: warning/critical                                   │
│                                                                  │
│  PERMISSIONS (Capabilities)                                      │
│  ├─ alice can [deploy] on [service:api]                           │
│  ├─ bob can [read] on [data:logs]                                │
│  ├─ conditions: {time_window: "business_hours"}                  │
│  ├─ expiresAt: timestamp                                         │
│  └─ status: active/revoked/expired                               │
│                                                                  │
│  DOMAIN RULES (Domain-Specific Laws)                            │
│  ├─ Finance Domain                                               │
│  │  ├─ Transactions must have approval                         │
│  │  ├─ Transfers over $10k need 2 signatures                  │
│  │  └─ Audit trail required                                 │
│  ├─ Security Domain                                              │
│  │  ├─ Passwords must be 12+ chars                           │
│  │  ├─ 2FA required for admin                                │
│  │  └─ Rate limiting on login                                │
│  ├─ Operations Domain                                            │
│  │  ├─ No deployments between 6pm-6am                        │
│  │  ├─ Maintenance windows must be scheduled                  │
│  │  └─ Rollback plan required                                │
│  ├─ Priority-sorted rules                                        │
│  ├─ Enforcement: soft (warn) / hard (block)                       │
│  └─ Cross-domain interactions possible                           │
│                                                                  │
│  VIOLATIONS & ESCALATIONS                                        │
│  ├─ Policy violations tracked                                     │
│  ├─ Constraint breaches logged                                   │
│  ├─ Escalations for critical issues                              │
│  ├─ Resolution tracking                                          │
│  └─ Audit trail maintained                                       │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

## Key Concepts

### Policy
A rule the system should follow. If violated, action is taken.

```typescript
const cpuPolicy = governance.registerPolicy(
  'cpu_threshold',
  'CPU usage should stay below 80%',
  'system',
  (state) => state.cpu < 80,
  'warn',      // Action if violated: warn
  'warning',   // Severity
  'system'     // Who created it
);
```

### Constraint
A hard boundary condition that should always be true.

```typescript
const ageConstraint = governance.registerConstraint(
  'age_valid',
  'Agent age must be non-negative and reasonable',
  'agent',
  (entity) => entity.age >= 0 && entity.age <= 150,
  'reject',    // On violation: reject the operation
  'critical'
);
```

### Permission
A capability grant to an agent.

```typescript
const deployPerm = governance.grantPermission(
  'alice',
  'deploy',
  'service:api',
  'system',
  Date.now() + 86400000,  // Expires tomorrow
  { time_window: 'business_hours' } // Conditions
);
```

### Domain Rule
Rules specific to a domain (finance, security, operations, etc.).

```typescript
const financeRule = governance.registerDomainRule(
  'finance',
  'requires_approval',
  'Large transactions must have approval',
  (context) => {
    if (context.amount > 10000 && !context.approved) {
      return { valid: false, reason: 'Large transaction requires approval' };
    }
    return { valid: true };
  },
  200,       // High priority
  'critical',
  'hard'     // Hard enforcement: block if violated
);
```

## Usage

```typescript
const governance = new GovernanceLayer();

// Register policies
governance.registerPolicy(
  'cpu_threshold',
  'CPU usage should stay below 80%',
  'system',
  (state) => state.cpu < 80,
  'warn'
);

governance.registerPolicy(
  'memory_leak',
  'Memory should not grow indefinitely',
  'system',
  (state) => state.memory < 8000,
  'enforce'
);

governance.registerPolicy(
  'unauthorized_access',
  'Prevent unauthorized access',
  'security',
  (state) => state.hasValidAuth,
  'escalate',
  'critical'
);

// Register constraints
governance.registerConstraint(
  'age_valid',
  'Agent age must be reasonable',
  'agent',
  (entity) => entity.age >= 0 && entity.age <= 150,
  'reject',
  'critical'
);

// Grant permissions
governance.grantPermission('alice', 'deploy', 'service:api', 'admin');
governance.grantPermission('bob', 'read', 'data:logs', 'admin', Date.now() + 86400000);

// Check permissions
const canAliceDeploy = governance.hasPermission('alice', 'deploy', 'service:api');
const canBobDelete = governance.hasPermission('bob', 'delete', 'service:api');

// Register domain rules
governance.registerDomainRule(
  'finance',
  'large_transfer_approval',
  'Large transfers need approval',
  (context) => {
    if (context.amount > 10000 && !context.approved) {
      return { valid: false, reason: 'Needs approval' };
    }
    return { valid: true };
  },
  200,
  'critical',
  'hard'
);

// Check policies
const systemState = { cpu: 85, memory: 7500, hasValidAuth: true };
const violations = governance.checkPolicies(
  systemState,
  'system-1',
  'system',
  'system'
);

if (violations.length > 0) {
  console.log(`Found ${violations.length} policy violations`);
  violations.forEach(v => console.log(`  - ${v.actionTaken}`));
}

// Check domain rules
const financeContext = { amount: 15000, approved: false };
const result = governance.checkDomainRules('finance', financeContext);

if (!result.valid) {
  console.log('Finance rule violations:', result.violations);
}

// Handle escalations
const openEscalations = governance.getOpenEscalations();
console.log(`${openEscalations.length} escalations awaiting attention`);

openEscalations.forEach(e => {
  console.log(`[${e.severity}] ${e.description}`);
  // Handle escalation...
  governance.resolveEscalation(e.id, 'Approved by admin');
});

// Get governance status
const status = governance.getStatus();
console.log(`Governance Status:`);
console.log(`  Policies: ${status.policiesCount}`);
console.log(`  Violations: ${status.totalViolations}`);
console.log(`  Open escalations: ${status.openEscalations}`);
```

## Integration with Other Layers

- **Runtime**: Governance checks run on each tick
- **Substrate**: Reads state/events to detect violations
- **SIM**: Analyzes trajectories against policies
- **Identity**: Enforces permissions based on roles
- **TEC**: Applies cost constraints
- **Routing**: Routes based on permissions
- **UI**: Shows policy status and escalations

## Enforcement Strategies

- **Warn** - Log violation, don't block
- **Enforce** - Block violating action, apply automatic fix
- **Escalate** - Alert humans, need manual approval
- **Hard** - Absolutely cannot proceed
- **Soft** - Warn but allow

## Next Steps

✅ Runtime Layer  
✅ Substrate Schema  
✅ SIM Engine  
✅ Identity Layer  
✅ Governance Layer (you are here)  
→ TEC Layer (cost analysis)  
→ Routing Layer (flow routing)  
→ UI Wiring (governance dashboard)  
