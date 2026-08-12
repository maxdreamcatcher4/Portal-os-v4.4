/**
 * LAYER 6: PRIMARY TEC LAYER
 * Economics engine - cost analysis, resource allocation, incentives, optimization
 * 
 * TEC tracks and optimizes:
 * - Costs (computational, memory, bandwidth, latency)
 * - Resources (allocation, utilization, waste)
 * - Incentives (what motivates agents)
 * - Economics (supply, demand, pricing)
 * - Optimization (pareto frontiers, trade-offs)
 */

/**
 * COST MODEL: How to calculate costs
 */
export interface CostModel {
  id: string;
  name: string;                  // e.g., "linear_compute", "exponential_bandwidth"
  description: string;
  formula: (usage: Record<string, number>) => number; // Compute cost from usage
  parameters: Record<string, number>; // Model parameters
  currency: string;              // "USD", "credit", "token"
  createdAt: number;
}

/**
 * COST ENTRY: A single cost incurrence
 */
export interface CostEntry {
  id: string;
  agentId: string;               // Who incurred it
  costModelId: string;           // Which model was used
  amount: number;                // Cost amount
  currency: string;
  usage: Record<string, number>; // What resources were used
  timestamp: number;
  category: string;              // "compute", "storage", "bandwidth", "latency"
  billable: boolean;             // Is this charged to the agent?
  metadata: Record<string, any>;
}

/**
 * BUDGET: Spending limit for an agent
 */
export interface Budget {
  id: string;
  agentId: string;               // Who has the budget
  limit: number;                 // Maximum spending
  currency: string;
  period: 'hourly' | 'daily' | 'monthly' | 'yearly';
  spent: number;                 // Current spending
  remaining: number;             // Limit - spent
  resetAt: number;               // When budget resets
  alerts: {
    threshold_80: boolean;        // Alert at 80% spent
    threshold_100: boolean;       // Alert at 100% spent
  };
  status: 'active' | 'exceeded' | 'paused';
}

/**
 * INCENTIVE: Motivation for agents to do something
 * Example: "Reduce latency by 10% → get 100 tokens"
 */
export interface Incentive {
  id: string;
  name: string;
  description: string;
  condition: (state: Record<string, any>) => boolean; // When does agent qualify?
  reward: number;                // How much they get
  currency: string;
  expiresAt: number;             // When incentive ends
  type: 'bonus' | 'penalty' | 'rebate';
  targetAgentType?: string;      // Applies to agents of this type
  metadata: Record<string, any>;
}

/**
 * RESOURCE ALLOCATION: How resources are distributed
 */
export interface ResourceAllocation {
  id: string;
  agentId: string;
  resourceType: string;          // "compute", "memory", "bandwidth"
  allocated: number;             // How much allocated
  used: number;                  // How much used
  utilization: number;           // Used / allocated %
  timestamp: number;
  priority: number;              // Higher = gets more if scarce
}

/**
 * TRADE-OFF: Pareto frontier showing cost vs performance
 */
export interface TradeOff {
  id: string;
  name: string;
  description: string;
  options: Array<{
    name: string;
    cost: number;
    performance: number;          // 0-1 quality score
    latency: number;
    throughput: number;
  }>;
  dominantOptions: string[];     // Pareto optimal options
}

export class TECLayer {
  private costModels: Map<string, CostModel> = new Map();
  private costEntries: CostEntry[] = [];
  private budgets: Map<string, Budget> = new Map();
  private incentives: Map<string, Incentive> = new Map();
  private resourceAllocations: Map<string, ResourceAllocation[]> = new Map();
  private tradeOffs: Map<string, TradeOff> = new Map();

  /**
   * Register a cost model
   */
  registerCostModel(
    name: string,
    description: string,
    formula: (usage: Record<string, number>) => number,
    parameters: Record<string, number> = {},
    currency: string = 'USD'
  ): string {
    const model: CostModel = {
      id: `model-${name}-${Date.now()}`,
      name,
      description,
      formula,
      parameters,
      currency,
      createdAt: Date.now()
    };

    this.costModels.set(model.id, model);
    return model.id;
  }

  /**
   * Record a cost
   */
  recordCost(
    agentId: string,
    costModelId: string,
    usage: Record<string, number>,
    category: string,
    billable: boolean = true
  ): CostEntry | null {
    const model = this.costModels.get(costModelId);
    if (!model) return null;

    const amount = model.formula(usage);

    const entry: CostEntry = {
      id: `cost-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      agentId,
      costModelId,
      amount,
      currency: model.currency,
      usage,
      timestamp: Date.now(),
      category,
      billable,
      metadata: {}
    };

    this.costEntries.push(entry);

    // Update budget if billable
    if (billable) {
      const budget = this.budgets.get(agentId);
      if (budget) {
        budget.spent += amount;
        budget.remaining = budget.limit - budget.spent;

        if (budget.remaining < 0) {
          budget.status = 'exceeded';
        }
      }
    }

    return entry;
  }

  /**
   * Set a budget for an agent
   */
  setBudget(
    agentId: string,
    limit: number,
    period: 'hourly' | 'daily' | 'monthly' | 'yearly' = 'monthly',
    currency: string = 'USD'
  ): Budget {
    const now = Date.now();
    const resetIntervals: Record<string, number> = {
      hourly: 3600000,
      daily: 86400000,
      monthly: 2592000000,
      yearly: 31536000000
    };

    const budget: Budget = {
      id: `budget-${agentId}-${Date.now()}`,
      agentId,
      limit,
      currency,
      period,
      spent: 0,
      remaining: limit,
      resetAt: now + resetIntervals[period],
      alerts: {
        threshold_80: false,
        threshold_100: false
      },
      status: 'active'
    };

    this.budgets.set(agentId, budget);
    return budget;
  }

  /**
   * Get budget for agent
   */
  getBudget(agentId: string): Budget | undefined {
    return this.budgets.get(agentId);
  }

  /**
   * Check if agent is within budget
   */
  isWithinBudget(agentId: string): boolean {
    const budget = this.budgets.get(agentId);
    if (!budget) return true; // No budget = unlimited

    // Check if budget period has reset
    if (Date.now() > budget.resetAt) {
      budget.spent = 0;
      budget.remaining = budget.limit;
      budget.status = 'active';
      budget.alerts = { threshold_80: false, threshold_100: false };
    }

    return budget.remaining >= 0;
  }

  /**
   * Register an incentive
   */
  registerIncentive(
    name: string,
    description: string,
    condition: (state: Record<string, any>) => boolean,
    reward: number,
    currency: string = 'USD',
    expiresAt: number = Date.now() + 2592000000, // 30 days default
    type: 'bonus' | 'penalty' | 'rebate' = 'bonus'
  ): string {
    const incentive: Incentive = {
      id: `incentive-${name}-${Date.now()}`,
      name,
      description,
      condition,
      reward,
      currency,
      expiresAt,
      type,
      metadata: {}
    };

    this.incentives.set(incentive.id, incentive);
    return incentive.id;
  }

  /**
   * Check which incentives an agent qualifies for
   */
  getQualifyingIncentives(agentId: string, state: Record<string, any>): Incentive[] {
    const qualifying: Incentive[] = [];

    for (const incentive of this.incentives.values()) {
      if (Date.now() > incentive.expiresAt) continue; // Expired

      try {
        if (incentive.condition(state)) {
          qualifying.push(incentive);
        }
      } catch (error) {
        console.error(`Error checking incentive ${incentive.name}:`, error);
      }
    }

    return qualifying;
  }

  /**
   * Allocate resources to an agent
   */
  allocateResource(
    agentId: string,
    resourceType: string,
    amount: number,
    priority: number = 50
  ): ResourceAllocation {
    const allocation: ResourceAllocation = {
      id: `alloc-${agentId}-${resourceType}-${Date.now()}`,
      agentId,
      resourceType,
      allocated: amount,
      used: 0,
      utilization: 0,
      timestamp: Date.now(),
      priority
    };

    if (!this.resourceAllocations.has(agentId)) {
      this.resourceAllocations.set(agentId, []);
    }
    this.resourceAllocations.get(agentId)!.push(allocation);

    return allocation;
  }

  /**
   * Update resource usage
   */
  updateResourceUsage(
    allocationId: string,
    usedAmount: number
  ): ResourceAllocation | undefined {
    for (const allocations of this.resourceAllocations.values()) {
      const allocation = allocations.find(a => a.id === allocationId);
      if (allocation) {
        allocation.used = usedAmount;
        allocation.utilization = allocation.allocated > 0 ? (usedAmount / allocation.allocated) * 100 : 0;
        allocation.timestamp = Date.now();
        return allocation;
      }
    }
    return undefined;
  }

  /**
   * Calculate total costs for an agent
   */
  calculateAgentCosts(
    agentId: string,
    startTime?: number,
    endTime?: number
  ): { total: number; byCategory: Record<string, number> } {
    let entries = this.costEntries.filter(e => e.agentId === agentId);

    if (startTime) entries = entries.filter(e => e.timestamp >= startTime);
    if (endTime) entries = entries.filter(e => e.timestamp <= endTime);

    const byCategory: Record<string, number> = {};
    let total = 0;

    for (const entry of entries) {
      total += entry.amount;
      if (!byCategory[entry.category]) {
        byCategory[entry.category] = 0;
      }
      byCategory[entry.category] += entry.amount;
    }

    return { total, byCategory };
  }

  /**
   * Analyze resource utilization
   */
  analyzeUtilization(agentId: string): {
    avgUtilization: number;
    resources: Record<string, number>;
    wastedCapacity: number;
  } {
    const allocations = this.resourceAllocations.get(agentId) || [];

    if (allocations.length === 0) {
      return { avgUtilization: 0, resources: {}, wastedCapacity: 0 };
    }

    const resources: Record<string, number> = {};
    let totalCapacity = 0;
    let totalUsed = 0;

    for (const allocation of allocations) {
      resources[allocation.resourceType] = allocation.utilization;
      totalCapacity += allocation.allocated;
      totalUsed += allocation.used;
    }

    const avgUtilization = totalCapacity > 0 ? (totalUsed / totalCapacity) * 100 : 0;
    const wastedCapacity = totalCapacity - totalUsed;

    return { avgUtilization, resources, wastedCapacity };
  }

  /**
   * Create a trade-off analysis
   */
  createTradeOff(
    name: string,
    description: string,
    options: Array<{
      name: string;
      cost: number;
      performance: number;
      latency: number;
      throughput: number;
    }>
  ): TradeOff {
    // Find Pareto optimal options
    const dominantOptions: string[] = [];

    for (let i = 0; i < options.length; i++) {
      let isDominated = false;

      for (let j = 0; j < options.length; j++) {
        if (i === j) continue;

        // Check if option j dominates option i
        const jBetterCost = options[j].cost < options[i].cost;
        const jBetterPerformance = options[j].performance > options[i].performance;
        const jBetterLatency = options[j].latency < options[i].latency;

        if (
          (jBetterCost && jBetterPerformance) ||
          (jBetterCost && jBetterLatency) ||
          (jBetterPerformance && jBetterLatency)
        ) {
          isDominated = true;
          break;
        }
      }

      if (!isDominated) {
        dominantOptions.push(options[i].name);
      }
    }

    const tradeOff: TradeOff = {
      id: `tradeoff-${name}-${Date.now()}`,
      name,
      description,
      options,
      dominantOptions
    };

    this.tradeOffs.set(tradeOff.id, tradeOff);
    return tradeOff;
  }

  /**
   * Get TEC status
   */
  getStatus() {
    const totalCosts = this.costEntries.reduce((sum, e) => sum + e.amount, 0);
    const costsByAgent = new Map<string, number>();

    for (const entry of this.costEntries) {
      const current = costsByAgent.get(entry.agentId) || 0;
      costsByAgent.set(entry.agentId, current + entry.amount);
    }

    const budgetsExceeded = Array.from(this.budgets.values()).filter(
      b => b.status === 'exceeded'
    ).length;

    return {
      timestamp: Date.now(),
      costModelsCount: this.costModels.size,
      totalCostsRecorded: totalCosts,
      totalCostEntries: this.costEntries.length,
      agentsWithBudgets: this.budgets.size,
      budgetsExceeded,
      incentivesCount: this.incentives.size,
      activeIncentives: Array.from(this.incentives.values()).filter(
        i => Date.now() <= i.expiresAt
      ).length,
      topAgentsBySpend: Array.from(costsByAgent.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([agentId, cost]) => ({ agentId, cost }))
    };
  }
}
