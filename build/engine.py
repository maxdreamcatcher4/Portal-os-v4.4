"""
Build Engine v1
Top-level coordinator for Portal‑OS builds.
"""

from build.pipeline import BuildPipeline
from build.phase import BuildPhase
from build.step import BuildStep

class BuildEngine:
    def __init__(self):
        self.pipeline = BuildPipeline()

    def add_phase(self, name):
        phase = BuildPhase(name)
        self.pipeline.add_phase(phase)
        return phase

    def add_step(self, phase: BuildPhase, name, description, executor):
        step = BuildStep(name, description, executor)
        phase.add_step(step)
        return step

    def run(self, context=None):
        context = context or {}
        return self.pipeline.run(context)

    def describe(self):
        return self.pipeline.describe()
