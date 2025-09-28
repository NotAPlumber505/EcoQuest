from google.adk.tools.agent_tool import AgentTool
from ..subagents.biodiversity import biodiversity_agent

# Create reusable biodiversity agent tool
biodiversity_tool = AgentTool(biodiversity_agent)

def analyze_biodiversity(input_data: dict) -> dict:
    return biodiversity_tool.run(input_data)