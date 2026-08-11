"""
Example Portal‑OS Build Pipeline v1
Demonstrates kernel → routing → substrate → umbrella → suites build.
"""

from build.engine import BuildEngine

def build_example_pipeline():
    engine = BuildEngine()

    # Kernel Phase
    kernel_phase = engine.add_phase("kernel")
    engine.add_step(kernel_phase, "kernel_boot", "Boot kernel services.", lambda ctx: {"kernel": "booted"})

    # Routing Phase
    routing_phase = engine.add_phase("routing")
    engine.add_step(routing_phase, "routing_init", "Initialize routing topology.", lambda ctx: {"routing": "initialized"})

    # Substrate Phase
    substrate_phase = engine.add_phase("substrate")
    engine.add_step(substrate_phase, "substrate_load", "Load Class‑C substrate.", lambda ctx: {"substrate": "loaded"})

    # Umbrella Phase
    umbrella_phase = engine.add_phase("umbrella")
    engine.add_step(umbrella_phase, "umbrella_check", "Evaluate Umbrella invariants.", lambda ctx: {"umbrella": "validated"})

    # Suites Phase
    suites_phase = engine.add_phase("suites")
    engine.add_step(suites_phase, "suite_load", "Load core suites.", lambda ctx: {"suites": "loaded"})

    return engine
