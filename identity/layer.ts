/**
 * LAYER 4: PRIMARY IDENTITY LAYER
 * Population graph - agents, collectives, institutions, roles, influence
 * 
 * Identity tracks:
 * - Agents (individual entities)
 * - Collectives (groups of agents)
 * - Institutions (formal structures)
 * - Roles (permissions and responsibilities)
 * - Influence graph (who affects whom)
 */

/**
 * AGENT: An individual entity in the system
 * Examples: User, service, device, organization
 */
export interface Agent {
  id: string;
  type: 'human' | 'service' | 'device' | 'organization';
  name: string;
  status: 'active' | 'suspended' | 'deactivated' | 'unknown';
  createdAt: number;
  lastActive: number;
  attributes: Record<string, any>; // Custom properties
  tags: string[];
  trustScore: number; // 0-100, how much we trust this agent
  metadata: Record<string, any>;
}

/**
 * COLLECTIVE: A group of agents
 * Examples: Team, department, cohort, guild
 */
export interface Collective {
  id: string;
  name: string;
  description: string;
  members: string[]; // Agent IDs
  type: 'team' | 'department' | 'cohort' | 'guild' | 'custom';
  status: 'active' | 'archived';
  createdAt: number;
  parentCollectiveId?: string; // For nested structures
  childCollectiveIds: string[];
  attributes: Record<string, any>;
  metadata: Record<string, any>;
}

/**
 * INSTITUTION: A formal structure with rules and governance
 * Examples: Company, government, DAO, protocol
 */
export interface Institution {
  id: string;
  name: string;
  description: string;
  type: 'corporation' | 'government' | 'dao' | 'protocol' | 'custom';
  status: 'active' | 'dormant' | 'dissolved';
  createdAt: number;
  members: string[]; // Agent IDs
  collectives: string[]; // Collective IDs
  governanceRules: string[]; // Rule IDs
  attributes: Record<string, any>;
  metadata: Record<string, any>;
}

/**
 * ROLE: A set of permissions and responsibilities
 */
export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[]; // What this role can do
  responsibilities: string[]; // What this role must do
  constraints: Record<string, any>; // Limitations
  salary?: number; // Monetary compensation
  status: 'active' | 'deprecated';
  createdAt: number;
  metadata: Record<string, any>;
}

/**
 * ROLE ASSIGNMENT: Binding between agent and role
 */
export interface RoleAssignment {
  id: string;
  agentId: string;
  roleId: string;
  institutionId?: string; // Which institution this role is in
  startTime: number;
  endTime?: number; // When role ends
  status: 'active' | 'on_leave' | 'suspended' | 'expired';
  performance?: {
    rating: number; // 0-100
    feedback: string;
    lastReview: number;
  };
}

/**
 * INFLUENCE: Directed relationship between agents
 * "A influences B" means A's actions can affect B
 */
export interface Influence {
  id: string;
  fromAgentId: string;  // Who influences
  toAgentId: string;    // Who is influenced
  strength: number;     // 0-1, how strong the influence
  type: 'direct' | 'indirect' | 'hierarchical' | 'peer' | 'expert';
  channels: string[];   // How influence flows: ["communication", "decision", "resource"]
  lastUpdated: number;
  metadata: Record<string, any>;
}

/**
 * INFLUENCE GRAPH: Network of all influences
 */
export class InfluenceGraph {
  private influences: Map<string, Influence[]> = new Map(); // fromAgentId -> influences
  private reverseInfluences: Map<string, Influence[]> = new Map(); // toAgentId -> influences

  /**
   * Add influence relationship
   */
  addInfluence(influence: Influence): void {
    const fromKey = influence.fromAgentId;
    const toKey = influence.toAgentId;

    if (!this.influences.has(fromKey)) {
      this.influences.set(fromKey, []);
    }
    if (!this.reverseInfluences.has(toKey)) {
      this.reverseInfluences.set(toKey, []);
    }

    this.influences.get(fromKey)!.push(influence);
    this.reverseInfluences.get(toKey)!.push(influence);
  }

  /**
   * Get all agents that influence a given agent
   */
  getInfluencers(agentId: string): Influence[] {
    return this.reverseInfluences.get(agentId) || [];
  }

  /**
   * Get all agents influenced by a given agent
   */
  getInfluencees(agentId: string): Influence[] {
    return this.influences.get(agentId) || [];
  }

  /**
   * Calculate total influence score for an agent
   */
  getInfluenceScore(agentId: string): number {
    const influencees = this.getInfluencees(agentId);
    return influencees.reduce((sum, inf) => sum + inf.strength, 0);
  }

  /**
   * Find influence path between two agents
   */
  findInfluencePath(fromAgentId: string, toAgentId: string, maxDepth: number = 5): string[] | null {
    if (fromAgentId === toAgentId) return [fromAgentId];

    const visited = new Set<string>();
    const queue: { agentId: string; path: string[] }[] = [{ agentId: fromAgentId, path: [fromAgentId] }];

    while (queue.length > 0) {
      const { agentId, path } = queue.shift()!;

      if (path.length > maxDepth) continue;
      if (visited.has(agentId)) continue;
      visited.add(agentId);

      const influencees = this.getInfluencees(agentId);
      for (const influence of influencees) {
        if (influence.toAgentId === toAgentId) {
          return [...path, toAgentId];
        }

        if (!visited.has(influence.toAgentId)) {
          queue.push({
            agentId: influence.toAgentId,
            path: [...path, influence.toAgentId]
          });
        }
      }
    }

    return null;
  }
}

export class IdentityLayer {
  private agents: Map<string, Agent> = new Map();
  private collectives: Map<string, Collective> = new Map();
  private institutions: Map<string, Institution> = new Map();
  private roles: Map<string, Role> = new Map();
  private roleAssignments: Map<string, RoleAssignment> = new Map();
  private influenceGraph: InfluenceGraph = new InfluenceGraph();

  /**
   * Register an agent
   */
  registerAgent(
    id: string,
    type: 'human' | 'service' | 'device' | 'organization',
    name: string,
    attributes: Record<string, any> = {}
  ): Agent {
    const agent: Agent = {
      id,
      type,
      name,
      status: 'active',
      createdAt: Date.now(),
      lastActive: Date.now(),
      attributes,
      tags: [],
      trustScore: 50, // Start neutral
      metadata: {}
    };

    this.agents.set(id, agent);
    return agent;
  }

  /**
   * Get an agent
   */
  getAgent(id: string): Agent | undefined {
    return this.agents.get(id);
  }

  /**
   * Update agent trust score
   */
  updateTrustScore(agentId: string, delta: number): void {
    const agent = this.agents.get(agentId);
    if (agent) {
      agent.trustScore = Math.max(0, Math.min(100, agent.trustScore + delta));
      agent.lastActive = Date.now();
    }
  }

  /**
   * Create a collective
   */
  createCollective(
    id: string,
    name: string,
    type: 'team' | 'department' | 'cohort' | 'guild' | 'custom',
    members: string[] = []
  ): Collective {
    const collective: Collective = {
      id,
      name,
      description: '',
      members,
      type,
      status: 'active',
      createdAt: Date.now(),
      childCollectiveIds: [],
      attributes: {},
      metadata: {}
    };

    this.collectives.set(id, collective);
    return collective;
  }

  /**
   * Add agent to collective
   */
  addAgentToCollective(agentId: string, collectiveId: string): void {
    const collective = this.collectives.get(collectiveId);
    if (collective && !collective.members.includes(agentId)) {
      collective.members.push(agentId);
    }
  }

  /**
   * Create an institution
   */
  createInstitution(
    id: string,
    name: string,
    type: 'corporation' | 'government' | 'dao' | 'protocol' | 'custom'
  ): Institution {
    const institution: Institution = {
      id,
      name,
      description: '',
      type,
      status: 'active',
      createdAt: Date.now(),
      members: [],
      collectives: [],
      governanceRules: [],
      attributes: {},
      metadata: {}
    };

    this.institutions.set(id, institution);
    return institution;
  }

  /**
   * Define a role
   */
  defineRole(
    id: string,
    name: string,
    permissions: string[] = [],
    responsibilities: string[] = []
  ): Role {
    const role: Role = {
      id,
      name,
      description: '',
      permissions,
      responsibilities,
      constraints: {},
      status: 'active',
      createdAt: Date.now(),
      metadata: {}
    };

    this.roles.set(id, role);
    return role;
  }

  /**
   * Assign a role to an agent
   */
  assignRole(
    agentId: string,
    roleId: string,
    institutionId?: string
  ): RoleAssignment | undefined {
    const agent = this.agents.get(agentId);
    const role = this.roles.get(roleId);

    if (!agent || !role) return undefined;

    const assignment: RoleAssignment = {
      id: `assignment-${agentId}-${roleId}-${Date.now()}`,
      agentId,
      roleId,
      institutionId,
      startTime: Date.now(),
      status: 'active',
      performance: {
        rating: 50,
        feedback: '',
        lastReview: Date.now()
      }
    };

    this.roleAssignments.set(assignment.id, assignment);
    return assignment;
  }

  /**
   * Get roles assigned to an agent
   */
  getAgentRoles(agentId: string): RoleAssignment[] {
    return Array.from(this.roleAssignments.values()).filter(
      a => a.agentId === agentId && a.status === 'active'
    );
  }

  /**
   * Check if agent has a permission
   */
  hasPermission(agentId: string, permission: string): boolean {
    const roles = this.getAgentRoles(agentId);
    return roles.some(a => {
      const role = this.roles.get(a.roleId);
      return role && role.permissions.includes(permission);
    });
  }

  /**
   * Add influence relationship
   */
  addInfluence(
    fromAgentId: string,
    toAgentId: string,
    strength: number,
    type: 'direct' | 'indirect' | 'hierarchical' | 'peer' | 'expert' = 'direct',
    channels: string[] = ['communication']
  ): Influence {
    const influence: Influence = {
      id: `inf-${fromAgentId}-${toAgentId}-${Date.now()}`,
      fromAgentId,
      toAgentId,
      strength: Math.max(0, Math.min(1, strength)),
      type,
      channels,
      lastUpdated: Date.now(),
      metadata: {}
    };

    this.influenceGraph.addInfluence(influence);
    return influence;
  }

  /**
   * Get influence graph for visualization
   */
  getInfluenceGraph() {
    return this.influenceGraph;
  }

  /**
   * Get identity snapshot
   */
  getIdentitySnapshot() {
    const agentsByType = new Map<string, number>();
    const roleDistribution = new Map<string, number>();
    let avgTrustScore = 0;
    let suspendedCount = 0;

    for (const agent of this.agents.values()) {
      const count = (agentsByType.get(agent.type) || 0) + 1;
      agentsByType.set(agent.type, count);
      avgTrustScore += agent.trustScore;

      if (agent.status === 'suspended') suspendedCount++;
    }

    avgTrustScore /= Math.max(this.agents.size, 1);

    for (const assignment of this.roleAssignments.values()) {
      if (assignment.status === 'active') {
        const role = this.roles.get(assignment.roleId);
        if (role) {
          const count = (roleDistribution.get(role.name) || 0) + 1;
          roleDistribution.set(role.name, count);
        }
      }
    }

    return {
      timestamp: Date.now(),
      agentsCount: this.agents.size,
      agentsByType: Object.fromEntries(agentsByType),
      collectivesCount: this.collectives.size,
      institutionsCount: this.institutions.size,
      rolesCount: this.roles.size,
      activeAssignmentsCount: Array.from(this.roleAssignments.values()).filter(
        a => a.status === 'active'
      ).length,
      roleDistribution: Object.fromEntries(roleDistribution),
      averageTrustScore: Math.round(avgTrustScore),
      suspendedAgentsCount: suspendedCount
    };
  }
}
