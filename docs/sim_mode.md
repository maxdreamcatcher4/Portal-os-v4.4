# SIM.MODE v1 — Cognitive Architecture

SIM.MODE defines the cognitive architecture used by Portal‑OS v4.  
It provides three layers:

## Core Layer
Represents:
- Cognitive states
- Identity physics anchors
- Deterministic transitions

See `sim/mode/core.py`.

## Cognitive Layer
Defines:
- Cognitive functions
- Layered reasoning
- Deterministic evaluation

See `sim/mode/cognitive.py`.

## Domain Layer
Defines:
- Domain cognition
- Domain-specific evaluators
- Suite-level reasoning

See `sim/mode/domain.py`.

## Engine
Coordinates all layers and provides a unified interface.

See `sim/mode/engine.py`.

SIM.MODE is used by:
- Identity Physics  
- SIM Pipeline  
- TEC Orchestration  
- Umbrella Governance  
- Portal‑OS Kernel  
