from google.adk.tools.agent_tool import AgentTool
from google.adk.agents import Agent
from ..biodiversity import biodiversity_agent
from ..facts import facts_agent
from google.adk.tools.agent_tool import google_search

orchestrator_agent = Agent(
    name="OrchestratorAgent",
    model="gemini-2.0-flash",
    description="Coordinates facts and biodiversity agents, then synthesizes output.",
    instruction="""
You coordinate ecosystem evaluations. Call the tools to assess biodiversity and generate a marine fact. Then summarize their outputs in a single JSON.

Instructions:
- Always call `biodiversity_agent` with the ecosystem state to get biodiversity status.
- Always call `facts_agent` with the same input to get a fun fact.
- Combine both outputs into a single structured JSON and return.
""",
    tools=[
        AgentTool(biodiversity_agent),
        AgentTool(facts_agent),
        google_search,
    ],
)
