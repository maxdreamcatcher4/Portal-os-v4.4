/**
 * LAYER 3: PRIMARY SIM ENGINE
 * The mind of Portal-OS - trajectory prediction, invariant generation, scenario trees
 * 
 * SIM is the predictive engine.
 * It takes substrate data and:
 * - Generates trajectories (predicted futures)
 * - Computes invariants (constraints that must hold)
 * - Builds scenario trees (branching possibilities)
 * - Makes modal predictions (what's most likely)
 */

/**
 * TRAJECTORY: A predicted future state
 * Represents: "If we continue on this path, here's where we end up"
 */
export interface Trajectory {
  id: string;
  startTime: number;              // When prediction was made
  startState: Record<string, any>; // Initial condition
  endTime: number;                // Prediction horizon
  steps: TrajectoryStep[];
  confidence: number;             // 0-1, how confident is this prediction
  baseModel: string;              // Which model generated this
  parameters: Record<string, any>; // Model parameters used
  tags: string[];                 // Categories: ["bullish", "risk", "stable"]
  status: 'active' | 'superceded' | 'invalidated';
}

/**
 * TRAJECTORY STEP: Single point along a trajectory
 */
export interface TrajectoryStep {
  timestamp: number;
  state: Record<string, any>;
  metrics: Record<string, number>;
  confidence: number;
  anomalies: string[];            // Detected in this step
}

/**
 * INVARIANT: A constraint that must hold
 * Represents: "This property should always be true"
 * Examples: "agent.age >= 0", "resource.memory >= 0", "total_cost <= budget"
 */
export interface Invariant {
  id: string;
  name: string;                   // e.g., "age_non_negative"
  description: string;
  domain: string;                 // What this applies to: "agent", "resource", "system"
  condition: (state: Record<string, any>) => boolean; // The actual check
  severity: 'info' | 'warning' | 'critical';
  enforcedAt: 'substrate' | 'sim' | 'governance';
  violations: InvariantViolation[];
  lastChecked: number;
}

/**
 * INVARIANT VIOLATION: When an invariant is broken
 */
export interface InvariantViolation {
  id: string;
  invariantId: string;
  timestamp: number;
  entityId: string;
  entityType: string;
  state: Record<string, any>;
  severity: 'warning' | 'critical';
  resolved: boolean;
  resolution?: {
    timestamp: number;
    action: string;
    result: any;
  };
}

/**
 * SCENARIO: A branching possibility in the future
 */
export interface Scenario {
  id: string;
  name: string;                   // e.g., "cost_spike", "service_degradation"
  description: string;
  probability: number;            // 0-1
  impactScore: number;            // 0-1, how much this affects the system
  triggers: string[];             // What conditions trigger this scenario
  consequences: Record<string, any>; // What happens if this occurs
  mitigations: Mitigation[];       // What can prevent/reduce this
  relatedTrajectories: string[];   // Trajectory IDs that lead here
}

/**
 * MITIGATION: Action to prevent or reduce a scenario
 */
export interface Mitigation {
  id: string;
  description: string;
  costEstimate: number;
  effectiveness: number;          // 0-1, how much it reduces impact
  implementationTime: number;      // Milliseconds
  owner: string;                  // Who implements this
}

/**
 * SCENARIO TREE: Decision tree of possible futures
 */
export interface ScenarioTree {
  id: string;
  rootScenario: string;           // Scenario ID at root
  depth: number;                  // How many levels
  breadth: number;                // Branching factor
  timestamp: number;
  scenarios: Scenario[];
  paths: ScenarioPath[];           // Different paths through tree
}

/**
 * SCENARIO PATH: A specific path through the scenario tree
 */
export interface ScenarioPath {
  id: string;
  scenarioIds: string[];          // Sequence of scenario IDs
  probability: number;            // Combined probability
  totalImpact: number;            // Sum of impacts
  timeline: number[];             // When each scenario occurs
}

/**
 * MODAL PREDICTION: The most likely future
 */
export interface ModalPrediction {
  id: string;
  timestamp: number;
  horizon: number;                // How far ahead we're predicting
  mostLikelyScenario: Scenario;
  confidenceInterval: [number, number]; // Lower and upper bounds
  secondaryScenarios: Scenario[];
  recommendations: string[];      // What should we do
}

export class SIMEngine {
  private trajectories: Map<string, Trajectory> = new Map();
  private invariants: Map<string, Invariant> = new Map();
  private scenarios: Map<string, Scenario> = new Map();
  private scenarioTrees: Map<string, ScenarioTree> = new Map();
  private modalPredictions: ModalPrediction[] = [];
  private simulationCount: number = 0;

  /**
   * Generate a trajectory based on current substrate state
   */
  generateTrajectory(
    startState: Record<string, any>,
    horizon: number = 3600000, // 1 hour default
    model: string = 'default',
    steps: number = 60
  ): Trajectory {
    const now = Date.now();
    const trajectory: Trajectory = {
      id: `traj-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      startTime: now,
      startState,
      endTime: now + horizon,
      steps: [],
      confidence: 0.75, // Base confidence
      baseModel: model,
      parameters: { steps, horizon },
      tags: [],
      status: 'active'
    };

    // Generate steps along the trajectory
    const stepInterval = horizon / steps;
    let currentState = { ...startState };
    let currentConfidence = 0.95;

    for (let i = 0; i < steps; i++) {
      const stepTime = now + i * stepInterval;
      
      // Simple model: decay confidence as we go further out
      currentConfidence *= 0.98;

      // Simulate state evolution (this would be more sophisticated in reality)
      const newState = this.evolveState(currentState, stepInterval);

      trajectory.steps.push({
        timestamp: stepTime,
        state: newState,
        metrics: this.extractMetrics(newState),
        confidence: currentConfidence,
        anomalies: []
      });

      currentState = newState;
    }

    // Detect anomalies in trajectory
    this.detectTrajectoryAnomalies(trajectory);
    
    // Assign tags based on trajectory characteristics
    this.tagTrajectory(trajectory);

    this.trajectories.set(trajectory.id, trajectory);
    return trajectory;
  }

  /**
   * Simple state evolution (can be replaced with complex model)
   */
  private evolveState(state: Record<string, any>, dt: number): Record<string, any> {
    const evolved = { ...state };
    
    // Apply simple dynamics: slight drift, noise
    for (const key in evolved) {
      if (typeof evolved[key] === 'number') {
        evolved[key] += (Math.random() - 0.5) * 0.1 * evolved[key]; // ±5% noise
      }
    }

    return evolved;
  }

  /**
   * Extract metrics from state
   */
  private extractMetrics(state: Record<string, any>): Record<string, number> {
    const metrics: Record<string, number> = {};
    for (const key in state) {
      if (typeof state[key] === 'number') {
        metrics[key] = state[key];
      }
    }
    return metrics;
  }

  /**
   * Detect anomalies within a trajectory
   */
  private detectTrajectoryAnomalies(trajectory: Trajectory): void {
    for (let i = 1; i < trajectory.steps.length; i++) {
      const prev = trajectory.steps[i - 1];
      const curr = trajectory.steps[i];

      for (const key in prev.metrics) {
        const change = Math.abs(curr.metrics[key] - prev.metrics[key]) / prev.metrics[key];
        if (change > 0.5) { // >50% change is anomalous
          curr.anomalies.push(`Large change in ${key}: ${(change * 100).toFixed(1)}%`);
        }
      }
    }
  }

  /**
   * Tag trajectory based on characteristics
   */
  private tagTrajectory(trajectory: Trajectory): void {
    const finalState = trajectory.steps[trajectory.steps.length - 1];
    
    // Check if trajectory is bullish (improving), bearish (degrading), or stable
    let improvement = 0;
    let degradation = 0;

    for (const key in trajectory.startState) {
      if (typeof trajectory.startState[key] === 'number') {
        const start = trajectory.startState[key];
        const end = finalState.state[key] || 0;
        const change = end - start;
        
        if (change > 0) improvement++;
        if (change < 0) degradation++;
      }
    }

    if (improvement > degradation * 1.5) {
      trajectory.tags.push('bullish');
    } else if (degradation > improvement * 1.5) {
      trajectory.tags.push('bearish');
      trajectory.tags.push('risk');
    } else {
      trajectory.tags.push('stable');
    }
  }

  /**
   * Register an invariant
   */
  registerInvariant(
    name: string,
    description: string,
    domain: string,
    condition: (state: Record<string, any>) => boolean,
    severity: 'info' | 'warning' | 'critical' = 'warning'
  ): string {
    const invariant: Invariant = {
      id: `inv-${name}-${Date.now()}`,
      name,
      description,
      domain,
      condition,
      severity,
      enforcedAt: 'sim',
      violations: [],
      lastChecked: 0
    };

    this.invariants.set(invariant.id, invariant);
    return invariant.id;
  }

  /**
   * Check if state violates any registered invariants
   */
  checkInvariants(state: Record<string, any>, entityId: string, entityType: string): InvariantViolation[] {
    const violations: InvariantViolation[] = [];

    for (const invariant of this.invariants.values()) {
      try {
        if (!invariant.condition(state)) {
          const violation: InvariantViolation = {
            id: `viol-${invariant.id}-${Date.now()}`,
            invariantId: invariant.id,
            timestamp: Date.now(),
            entityId,
            entityType,
            state,
            severity: invariant.severity as 'warning' | 'critical',
            resolved: false
          };

          violations.push(violation);
          invariant.violations.push(violation);
        }
      } catch (e) {
        console.error(`Error checking invariant ${invariant.name}:`, e);
      }
    }

    for (const inv of this.invariants.values()) {
      inv.lastChecked = Date.now();
    }

    return violations;
  }

  /**
   * Create a scenario
   */
  createScenario(
    name: string,
    description: string,
    probability: number,
    impactScore: number,
    triggers: string[],
    consequences: Record<string, any>
  ): string {
    const scenario: Scenario = {
      id: `scen-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      description,
      probability,
      impactScore,
      triggers,
      consequences,
      mitigations: [],
      relatedTrajectories: []
    };

    this.scenarios.set(scenario.id, scenario);
    return scenario.id;
  }

  /**
   * Build a scenario tree
   */
  buildScenarioTree(
    rootScenarioId: string,
    depth: number = 3,
    breadth: number = 3
  ): ScenarioTree {
    const tree: ScenarioTree = {
      id: `tree-${Date.now()}`,
      rootScenario: rootScenarioId,
      depth,
      breadth,
      timestamp: Date.now(),
      scenarios: [],
      paths: []
    };

    // Recursively build tree (simplified)
    const visitedScenarios = new Set<string>();
    this.buildTreeRecursive(tree, rootScenarioId, 0, depth, visitedScenarios);

    // Generate paths through tree
    this.generateScenarioPaths(tree);

    this.scenarioTrees.set(tree.id, tree);
    return tree;
  }

  private buildTreeRecursive(
    tree: ScenarioTree,
    scenarioId: string,
    currentDepth: number,
    maxDepth: number,
    visited: Set<string>
  ): void {
    if (currentDepth >= maxDepth || visited.has(scenarioId)) return;
    visited.add(scenarioId);

    const scenario = this.scenarios.get(scenarioId);
    if (!scenario) return;

    tree.scenarios.push(scenario);

    // In a real system, we'd follow consequence chains
    // For now, just stop at max depth
  }

  private generateScenarioPaths(tree: ScenarioTree): void {
    // Simple path generation: linear sequence through scenarios
    if (tree.scenarios.length > 0) {
      const path: ScenarioPath = {
        id: `path-${tree.id}`,
        scenarioIds: tree.scenarios.map(s => s.id),
        probability: tree.scenarios.reduce((p, s) => p * s.probability, 1),
        totalImpact: tree.scenarios.reduce((i, s) => i + s.impactScore, 0),
        timeline: tree.scenarios.map((_, i) => Date.now() + i * 1000)
      };
      tree.paths.push(path);
    }
  }

  /**
   * Generate modal prediction
   */
  generateModalPrediction(
    horizon: number = 3600000,
    confidence: number = 0.8
  ): ModalPrediction {
    // Find the most likely scenario
    const sortedScenarios = Array.from(this.scenarios.values())
      .sort((a, b) => b.probability - a.probability);

    const mostLikelyScenario = sortedScenarios[0] || {
      id: 'default',
      name: 'stable',
      description: 'System continues normally',
      probability: 1.0,
      impactScore: 0,
      triggers: [],
      consequences: {},
      mitigations: [],
      relatedTrajectories: []
    };

    const prediction: ModalPrediction = {
      id: `pred-${Date.now()}`,
      timestamp: Date.now(),
      horizon,
      mostLikelyScenario,
      confidenceInterval: [confidence * 0.9, confidence],
      secondaryScenarios: sortedScenarios.slice(1, 4),
      recommendations: this.generateRecommendations(mostLikelyScenario)
    };

    this.modalPredictions.push(prediction);
    if (this.modalPredictions.length > 100) {
      this.modalPredictions.shift();
    }

    return prediction;
  }

  private generateRecommendations(scenario: Scenario): string[] {
    const recommendations: string[] = [];
    
    if (scenario.mitigations.length > 0) {
      recommendations.push(`Implement top mitigation: ${scenario.mitigations[0].description}`);
    }
    
    if (scenario.impactScore > 0.7) {
      recommendations.push('High impact scenario detected - escalate to governance');
    }

    return recommendations;
  }

  /**
   * Get SIM status
   */
  getStatus() {
    return {
      trajectoriesCount: this.trajectories.size,
      invariantsCount: this.invariants.size,
      scenariosCount: this.scenarios.size,
      scenarioTreesCount: this.scenarioTrees.size,
      totalViolations: Array.from(this.invariants.values()).reduce(
        (sum, inv) => sum + inv.violations.filter(v => !v.resolved).length,
        0
      ),
      recentPredictions: this.modalPredictions.slice(-10),
      simulationCount: this.simulationCount
    };
  }
}
