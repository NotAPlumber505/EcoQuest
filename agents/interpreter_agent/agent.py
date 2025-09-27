from google.adk.agents import Agent

from .subagents.biodiversity.agent import biodiversity_agent
from .subagents.facts.agent import facts_agent

dummy_json = """
{
  "type": "quest_request",
  "questType": "biodiversity",
  "plants": ["Seaweed", "Kelp", "Algae"],
  "prey": ["Small Fish", "Shrimp", "Plankton"],
  "predators": ["Shark", "Seal", "Tuna"],
  "actions": 2
}
"""

root_agent = Agent(
    name="EcoQuestPipeline",
    model="gemini-2.0-flash",
    sub_agents=[biodiversity_agent], 
    description=
    """
    New Day and Quest Manager Agent
    """,
    instruction=
    f"""
    You are a Parent agent that will determine what agent the information given is best suited for. 
    If you receive a prompt such as {dummy_json} you are to route it to the questing agent.

    """,
)