/**
 * LAYER 5: PRIMARY GOVERNANCE LAYER
 * Law system - policies, constraints, permissions, domain rules, enforcement
 * 
 * Governance enforces:
 * - Policies (what should happen)
 * - Constraints (what cannot happen)
 * - Permissions (who can do what)
 * - Domain rules (domain-specific laws)
 * - Escalation (when things violate rules)
 */

/**
 * POLICY: A rule that should be enforced
 * Example: "CPU usage should stay below 80%"
 */
export interface Policy {
  id: string;
  name: string;
  description: string;
  domain: string;                // What domain this applies to: "system", "security", "finance"
  condition: (state: Record<string, any>) => boolean; // The check
  action: 'warn' | 'enforce' | 'escalate'; // What to do if violated
  severity: 'info' | 'warning' | 'critical';
  createdAt: number;
  createdBy: string;              // Agent ID who created this
  enabled: boolean;
  metadata: Record<string, any>;
}

/**
 * CONSTRAINT: A boundary condition that must not be violated
 * Example: "Age must be between 0 and 150"
 */
export interface Constraint {
  id: string;
  name: string;
  description: string;
  entityType: string;            // What this applies to: "agent", "resource", "transaction"
  check: (entity: Record<string, any>) => boolean; // Returns true if valid
  severity: 'warning' | 'critical';
  onViolation: 'warn' | 'reject' | 'repair';
  createdAt: number;
  metadata: Record<string, any>;
}

/**
 * PERMISSION: Capability grant
 * "Agent can perform action on resource"
 */
export interface Permission {
  id: string;
  agentId: string;               // Who has the permission
  action: string;                // What they can do (e.g., "deploy", "read", "delete")
  resource: string;              // What it applies to (e.g., "service:api", "data:logs")
  conditions: Record<string, any>; // Extra conditions (e.g., {"time_window": "business_hours"})
  grantedAt: number;
  grantedBy: string;              // Who granted it
  expiresAt?: number;            // When permission expires
  status: 'active' | 'revoked' | 'expired';
}

/**
 * DOMAIN RULE: Rule specific to a domain
 * Examples: Finance domain rule - "transactions must have approval"
 *           Security domain rule - "passwords must be 12+ chars"
 */
export interface DomainRule {
  id: string;
  domain: string;                // "finance", "security", "operations", etc.
  name: string;
  description: string;
  rule: (context: Record<string, any>) => { valid: boolean; reason?: string }; // Validation function
  priority: number;              // Higher priority = checked first
  severity: 'info' | 'warning' | 'critical';
  enforcement: 'soft' | 'hard'; // Soft = warn, Hard = block
  metadata: Record<string, any>;
}

/**
 * POLICY VIOLATION: When a policy is broken
 */
export interface PolicyViolation {
  id: string;
  policyId: string;
  timestamp: number;
  entityId: string;
  entityType: string;
  state: Record<string, any>;    // State that caused violation
  severity: 'warning' | 'critical';
  action: 'warn' | 'enforce' | 'escalate';
  actionTaken: string;           // What was actually done
  resolved: boolean;
  resolution?: {
    timestamp: number;
    action: string;
    result: any;
  };
}

/**
 * ESCALATION: Situation that needs human attention
 */
export interface Escalation {
  id: string;
  severity: 'warning' | 'critical';
  type: string;                  // "policy_violation", "constraint_breach", "anomaly"
  description: string;
  relatedEntity: string;          // Agent/resource ID
  timestamp: number;
  violationIds: string[];         // Related violation IDs
  status: 'open' | 'acknowledged' | 'resolved';
  assignedTo?: string;            // Agent ID responsible
  notes: string[];
}

export class GovernanceLayer {
  private policies: Map<string, Policy> = new Map();
  private constraints: Map<string, Constraint> = new Map();
  private permissions: Map<string, Permission[]> = new Map(); // agentId -> permissions
  private domainRules: Map<string, DomainRule[]> = new Map(); // domain -> rules
  private violations: PolicyViolation[] = [];
  private escalations: Escalation[] = [];

  /**
   * Register a policy
   */
  registerPolicy(
    name: string,
    description: string,
    domain: string,
    condition: (state: Record<string, any>) => boolean,
    action: 'warn' | 'enforce' | 'escalate' = 'warn',
    severity: 'info' | 'warning' | 'critical' = 'warning',
    createdBy: string = 'system'
  ): string {
    const policy: Policy = {
      id: `policy-${name}-${Date.now()}`,
      name,
      description,
      domain,
      condition,
      action,
      severity,
      createdAt: Date.now(),
      createdBy,
      enabled: true,
      metadata: {}
    };

    this.policies.set(policy.id, policy);
    return policy.id;
  }

  /**
   * Register a constraint
   */
  registerConstraint(
    name: string,
    description: string,
    entityType: string,
    check: (entity: Record<string, any>) => boolean,
    onViolation: 'warn' | 'reject' | 'repair' = 'warn',
    severity: 'warning' | 'critical' = 'warning'
  ): string {
    const constraint: Constraint = {
      id: `constraint-${name}-${Date.now()}`,
      name,
      description,
      entityType,
      check,
      severity,
      onViolation,
      createdAt: Date.now(),
      metadata: {}
    };

    this.constraints.set(constraint.id, constraint);
    return constraint.id;
  }

  /**
   * Check all policies against a state
   */
  checkPolicies(
    state: Record<string, any>,
    entityId: string,
    entityType: string,
    domain: string
  ): PolicyViolation[] {
    const violations: PolicyViolation[] = [];

    for (const policy of this.policies.values()) {
      if (!policy.enabled || policy.domain !== domain) continue;

      try {
        if (!policy.condition(state)) {
          const violation: PolicyViolation = {
            id: `violation-${policy.id}-${Date.now()}`,
            policyId: policy.id,
            timestamp: Date.now(),
            entityId,
            entityType,
            state,
            severity: policy.severity as 'warning' | 'critical',
            action: policy.action,
            actionTaken: this.executePolicy(policy, state, entityId),
            resolved: false
          };

          violations.push(violation);
          this.violations.push(violation);

          // Escalate if needed
          if (policy.action === 'escalate') {
            this.createEscalation(
              policy.severity as 'warning' | 'critical',
              'policy_violation',
              `Policy "${policy.name}" violated`,
              entityId,
              [violation.id]
            );
          }
        }
      } catch (error) {
        console.error(`Error checking policy ${policy.name}:`, error);
      }
    }

    return violations;
  }

  /**
   * Execute a policy action
   */
  private executePolicy(
    policy: Policy,
    state: Record<string, any>,
    entityId: string
  ): string {
    switch (policy.action) {
      case 'warn':
        return `Warned about ${policy.name}`;
      case 'enforce':
        // Could apply automatic fixes here
        return `Enforced ${policy.name}`;
      case 'escalate':
        return `Escalated ${policy.name}`;
      default:
        return 'Unknown action';
    }
  }

  /**
   * Check constraint against entity
   */
  checkConstraint(constraintId: string, entity: Record<string, any>): boolean {
    const constraint = this.constraints.get(constraintId);
    if (!constraint) return true;

    try {
      return constraint.check(entity);
    } catch (error) {
      console.error(`Error checking constraint ${constraint.name}:`, error);
      return false;
    }
  }

  /**
   * Grant a permission
   */
  grantPermission(
    agentId: string,
    action: string,
    resource: string,
    grantedBy: string,
    expiresAt?: number,
    conditions: Record<string, any> = {}
  ): Permission {
    const permission: Permission = {
      id: `perm-${agentId}-${action}-${Date.now()}`,
      agentId,
      action,
      resource,
      conditions,
      grantedAt: Date.now(),
      grantedBy,
      expiresAt,
      status: 'active'
    };

    if (!this.permissions.has(agentId)) {
      this.permissions.set(agentId, []);
    }
    this.permissions.get(agentId)!.push(permission);

    return permission;
  }

  /**
   * Revoke a permission
   */
  revokePermission(permissionId: string): void {
    for (const perms of this.permissions.values()) {
      const index = perms.findIndex(p => p.id === permissionId);
      if (index !== -1) {
        perms[index].status = 'revoked';
        break;
      }
    }
  }

  /**
   * Check if agent has permission
   */
  hasPermission(
    agentId: string,
    action: string,
    resource: string,
    context: Record<string, any> = {}
  ): boolean {
    const perms = this.permissions.get(agentId) || [];

    for (const perm of perms) {
      // Check if expired
      if (perm.expiresAt && perm.expiresAt < Date.now()) {
        perm.status = 'expired';
        continue;
      }

      // Check status
      if (perm.status !== 'active') continue;

      // Check action and resource match
      const actionMatch = perm.action === action || perm.action === '*';
      const resourceMatch = perm.resource === resource || perm.resource === '*';

      if (actionMatch && resourceMatch) {
        // Check conditions
        if (this.checkConditions(perm.conditions, context)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Check if all conditions are met
   */
  private checkConditions(
    conditions: Record<string, any>,
    context: Record<string, any>
  ): boolean {
    for (const [key, value] of Object.entries(conditions)) {
      if (context[key] !== value) {
        return false;
      }
    }
    return true;
  }

  /**
   * Register a domain rule
   */
  registerDomainRule(
    domain: string,
    name: string,
    description: string,
    rule: (context: Record<string, any>) => { valid: boolean; reason?: string },
    priority: number = 100,
    severity: 'info' | 'warning' | 'critical' = 'warning',
    enforcement: 'soft' | 'hard' = 'soft'
  ): string {
    const domainRule: DomainRule = {
      id: `rule-${domain}-${name}-${Date.now()}`,
      domain,
      name,
      description,
      rule,
      priority,
      severity,
      enforcement,
      metadata: {}
    };

    if (!this.domainRules.has(domain)) {
      this.domainRules.set(domain, []);
    }

    const rules = this.domainRules.get(domain)!;
    rules.push(domainRule);
    rules.sort((a, b) => b.priority - a.priority); // Sort by priority

    return domainRule.id;
  }

  /**
   * Check domain rules
   */
  checkDomainRules(
    domain: string,
    context: Record<string, any>
  ): { valid: boolean; violations: string[] } {
    const rules = this.domainRules.get(domain) || [];
    const violations: string[] = [];

    for (const rule of rules) {
      try {
        const result = rule.rule(context);
        if (!result.valid) {
          violations.push(result.reason || `Rule "${rule.name}" violated`);

          if (rule.enforcement === 'hard') {
            // Hard enforcement means we fail immediately
            return { valid: false, violations };
          }
        }
      } catch (error) {
        console.error(`Error checking domain rule ${rule.name}:`, error);
        violations.push(`Error in rule "${rule.name}"`);
      }
    }

    return { valid: violations.length === 0, violations };
  }

  /**
   * Create an escalation
   */
  private createEscalation(
    severity: 'warning' | 'critical',
    type: string,
    description: string,
    relatedEntity: string,
    violationIds: string[] = []
  ): string {
    const escalation: Escalation = {
      id: `escalation-${Date.now()}`,
      severity,
      type,
      description,
      relatedEntity,
      timestamp: Date.now(),
      violationIds,
      status: 'open',
      notes: []
    };

    this.escalations.push(escalation);
    return escalation.id;
  }

  /**
   * Get open escalations
   */
  getOpenEscalations(): Escalation[] {
    return this.escalations.filter(e => e.status === 'open');
  }

  /**
   * Resolve an escalation
   */
  resolveEscalation(escalationId: string, resolution: string): void {
    const escalation = this.escalations.find(e => e.id === escalationId);
    if (escalation) {
      escalation.status = 'resolved';
      escalation.notes.push(`Resolved: ${resolution}`);
    }
  }

  /**
   * Get governance status
   */
  getStatus() {
    const unresolved = this.violations.filter(v => !v.resolved);
    const openEscalations = this.getOpenEscalations();

    return {
      timestamp: Date.now(),
      policiesCount: this.policies.size,
      constraintsCount: this.constraints.size,
      permissionsCount: Array.from(this.permissions.values()).reduce((sum, p) => sum + p.length, 0),
      domainRulesCount: Array.from(this.domainRules.values()).reduce((sum, r) => sum + r.length, 0),
      totalViolations: this.violations.length,
      unresolvedViolations: unresolved.length,
      openEscalations: openEscalations.length,
      recentViolations: this.violations.slice(-20)
    };
  }
}
