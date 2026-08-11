"""
Build Step v1
Defines an atomic build unit.
"""

class BuildStep:
    def __init__(self, name, description, executor):
        self.name = name
        self.description = description
        self.executor = executor

    def run(self, context):
        return {
            "step": self.name,
            "result": self.executor(context)
        }

    def describe(self):
        return {
            "name": self.name,
            "description": self.description
        }
