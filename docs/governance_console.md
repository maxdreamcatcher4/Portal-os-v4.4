# Governance Console v1

The Governance Console provides CLI-level governance controls for Portal‑OS. It wraps a lawbook/umbrella engine and exposes a simple command registry.

Usage

- Register commands via `register(name, handler, description)`
- Execute registered commands via `execute(name, args)`
- Inspect available commands via `describe()`

Recommended next steps

- Add unit tests (tests/test_governance_console.py) covering register/execute/describe and error cases.
- Integrate the console with the Umbrella/Lawbook engine so commands can query rules, validate invariants, and escalate.
- Register default commands (list-rules, validate, escalate, audit-log) and wire to PortalShell and ApiServer for CLI and remote control.
- Add type hints and docstrings and basic input validation for handlers.
