# Layer 4: Primary Identity Layer

## Overview

The **Identity Layer** is the population graph of Portal-OS. It tracks:

- **Agents** - Individual entities (humans, services, devices, organizations)
- **Collectives** - Groups of agents (teams, departments, cohorts)
- **Institutions** - Formal structures (companies, governments, DAOs)
- **Roles** - Permissions and responsibilities
- **Influence Graph** - Network of who affects whom

Identity answers: "Who is in the system, what can they do, and how do they influence each other?"

## Architecture

```
┌──────────────────────────────────────────────────────────────────────────────┐
│          Portal-OS Identity Layer (Population Graph)                         │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  AGENTS (Individual Entities)                                               │
│  ├─ Human: alice, bob, charlie                                             │
│  ├─ Service: auth-service, api-gateway, worker-1                           │
│  ├─ Device: sensor-1, router-2, laptop-alice                               │
│  ├─ Organization: acme-corp, open-collective                               │
│  ├─ Status: active/suspended/deactivated                                   │
│  ├─ Trust score: 0-100                                                     │
│  └─ Attributes: custom properties                                          │
│                                                                              │
│  COLLECTIVES (Groups)                                                       │
│  ├─ Team: engineering-team                                                 │
│  │  └─ Members: [alice, bob, charlie]                                     │
│  ├─ Department: sales                                                      │
│  │  └─ Members: [dave, eve, frank]                                        │
│  ├─ Cohort: class-2024                                                    │
│  │  └─ Members: [student1, student2, ...]                                │
│  └─ Nested collectives: parent/child relationships                        │
│                                                                              │
│  INSTITUTIONS (Formal Structures)                                           │
│  ├─ Type: corporation, government, DAO, protocol                           │
│  ├─ Members: agents                                                        │
│  ├─ Collectives: internal structure                                        │
│  └─ Governance rules: how decisions are made                               │
│                                                                              │
│  ROLES (Permissions & Responsibilities)                                     │
│  ├─ Engineer                                                               │
│  │  ├─ Permissions: ["deploy", "review_pr", "access_logs"]               │
│  │  └─ Responsibilities: ["maintain_systems", "on_call"]                  │
│  ├─ Manager                                                                │
│  │  ├─ Permissions: ["hire", "budget", "review_performance"]             │
│  │  └─ Responsibilities: ["team_health", "roadmap"]                       │
│  └─ Role assignments: agent → role bindings                                │
│                                                                              │
│  INFLUENCE GRAPH (Who Affects Whom)                                         │
│  ├─ Direct: alice → bob (manager relationship)                             │
│  ├─ Hierarchical: ceo → managers → engineers                               │
│  ├─ Peer: alice ← → bob (collaboration)                                    │
│  ├─ Expert: expert → novice (knowledge flow)                               │
│  ├─ Strength: 0-1 (how strong the influence)                               │
│  └─ Channels: communication, decision, resource                            │
│                                                                              │
│  IDENTITY QUERIES                                                           │
│  ├─ Who can do X? → hasPermission(agent, permission)                       │
│  ├─ Who influences whom? → getInfluencees(agent)                           │
│  ├─ How does influence flow? → findInfluencePath(from, to)                 │
│  ├─ What's the influence score? → getInfluenceScore(agent)                 │
│  └─ Population snapshot? → getIdentitySnapshot()                           │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Data Structures

### Agent
```typescript
interface Agent {
  id: string;
  type: 'human' | 'service' | 'device' | 'organization';
  name: string;
  status: 'active' | 'suspended' | 'deactivated' | 'unknown';
  createdAt: number;
  lastActive: number;
  attributes: Record<string, any>;
  tags: string[];
  trustScore: number;  // 0-100
  metadata: Record<string, any>;
}
```

### Collective
```typescript
interface Collective {
  id: string;
  name: string;
  type: 'team' | 'department' | 'cohort' | 'guild' | 'custom';
  members: string[];  // Agent IDs
  parentCollectiveId?: string;
  childCollectiveIds: string[];
  status: 'active' | 'archived';
  createdAt: number;
}
```

### Influence
```typescript
interface Influence {
  id: string;
  fromAgentId: string;  // Who influences
  toAgentId: string;    // Who is influenced
  strength: number;     // 0-1
  type: 'direct' | 'indirect' | 'hierarchical' | 'peer' | 'expert';
  channels: string[];   // ["communication", "decision", "resource"]
  lastUpdated: number;
}
```

## Usage

```typescript
const identity = new IdentityLayer();

// Register agents
const alice = identity.registerAgent('alice', 'human', 'Alice Smith', {
  department: 'engineering',
  seniority: 'senior'
});

const bob = identity.registerAgent('bob', 'human', 'Bob Jones', {
  department: 'engineering',
  seniority: 'junior'
});

const authService = identity.registerAgent('auth-service', 'service', 'Auth Service', {
  replicas: 3,
  uptime: 99.99
});

// Create collectives
const engTeam = identity.createCollective(
  'eng-team',
  'Engineering Team',
  'team',
  ['alice', 'bob']
);

// Create institution
const company = identity.createInstitution(
  'acme-corp',
  'ACME Corporation',
  'corporation'
);

// Define roles
const engineerRole = identity.defineRole(
  'engineer',
  'Software Engineer',
  ['deploy', 'review_pr', 'access_logs'],
  ['maintain_systems', 'on_call']
);

const managerRole = identity.defineRole(
  'manager',
  'Engineering Manager',
  ['hire', 'budget', 'review_performance'],
  ['team_health', 'roadmap']
);

// Assign roles
identity.assignRole('alice', 'manager', 'acme-corp');
identity.assignRole('bob', 'engineer', 'acme-corp');

// Check permissions
const canAliceDeploy = identity.hasPermission('alice', 'deploy'); // true (manager can)
const canBobHire = identity.hasPermission('bob', 'hire');         // false (engineer can't)

// Add influence relationships
identity.addInfluence('alice', 'bob', 0.8, 'hierarchical', ['decision', 'career']);
identity.addInfluence('bob', 'alice', 0.2, 'expert', ['technical_advice']);
identity.addInfluence('authService', 'bob', 0.9, 'direct', ['resource']);

// Query influence
const influenceGraph = identity.getInfluenceGraph();
const aliceInfluenceScore = influenceGraph.getInfluenceScore('alice');
const influencePath = influenceGraph.findInfluencePath('alice', 'bob');

// Update trust
identity.updateTrustScore('alice', 5);  // Increase trust
identity.updateTrustScore('bob', -10);  // Decrease trust

// Get snapshot
const snapshot = identity.getIdentitySnapshot();
console.log(`${snapshot.agentsCount} agents, avg trust: ${snapshot.averageTrustScore}`);
```

## Influence Graph Queries

```typescript
// Who influences alice?
const influencers = influenceGraph.getInfluencers('alice');

// Who does alice influence?
const influencees = influenceGraph.getInfluencees('alice');

// What's alice's total influence score?
const score = influenceGraph.getInfluenceScore('alice');

// Is there a path of influence from alice to charlie?
const path = influenceGraph.findInfluencePath('alice', 'charlie');
// Returns: ['alice', 'bob', 'charlie'] or null
```

## Integration with Other Layers

- **Runtime**: Triggers on agent status changes, role assignments
- **Substrate**: Logs identity events (login, role change, suspension)
- **SIM**: Predicts agent behavior based on role and influence
- **Governance**: Enforces permissions and role constraints
- **TEC**: Tracks costs associated with roles and collectives
- **Routing**: Routes based on agent permissions and influence
- **UI**: Displays identity graph, org chart, trust scores

## Advanced Features (Future)

- **Delegation**: Temporary permission delegation
- **Revocation**: Immediate or scheduled role removal
- **Audit Trail**: Complete history of all identity changes
- **Graph Visualization**: Interactive influence graph
- **Group Dynamics**: Analyze team health and cohesion
- **Reputation System**: Beyond trust scores

## Next Steps

✅ Runtime Layer  
✅ Substrate Schema  
✅ SIM Engine  
✅ Identity Layer (you are here)  
→ Governance Layer (enforce rules based on identity)  
→ TEC Layer (cost allocation by role)  
→ Routing Layer (route based on permissions)  
→ UI Wiring (display identity graph)  
