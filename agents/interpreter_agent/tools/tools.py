from google.adk.tools.agent_tool import AgentTool
from ..subagents.biodiversity import biodiversity_agent

# Create reusable biodiversity agent tool
biodiversity_tool = AgentTool(biodiversity_agent)

def _call_tool(tool, input_data: dict) -> dict:
    if hasattr(tool, 'run') and callable(getattr(tool, 'run')):
        return tool.run(input_data)
    if hasattr(tool, 'call') and callable(getattr(tool, 'call')):
        return tool.call(input_data)
    if hasattr(tool, 'invoke') and callable(getattr(tool, 'invoke')):
        return tool.invoke(input_data)
    if callable(tool):
        return tool(input_data)
    raise AttributeError("AgentTool has no callable interface")


def analyze_biodiversity(input_data: dict) -> dict:
    return _call_tool(biodiversity_tool, input_data)