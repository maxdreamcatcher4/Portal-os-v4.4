"""
Build Pipeline v1
Coordinates build phases.
"""

from build.phase import BuildPhase

class BuildPipeline:
    def __init__(self):
        self.phases = []

    def add_phase(self, phase: BuildPhase):
        self.phases.append(phase)

    def run(self, context):
        results = []
        for phase in self.phases:
            results.append(phase.run(context))
        return {
            "pipeline": "portal-os",
            "results": results
        }

    def describe(self):
        return [phase.describe() for phase in self.phases]
