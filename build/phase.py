"""
Build Phase v1
Defines an ordered group of build steps.
"""

from build.step import BuildStep

class BuildPhase:
    def __init__(self, name):
        self.name = name
        self.steps = []

    def add_step(self, step: BuildStep):
        self.steps.append(step)

    def run(self, context):
        results = []
        for step in self.steps:
            results.append(step.run(context))
        return {
            "phase": self.name,
            "results": results
        }

    def describe(self):
        return {
            "name": self.name,
            "steps": [step.describe() for step in self.steps]
        }
