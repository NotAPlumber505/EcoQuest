from google.adk.agents import Agent

from .subagents.quests.agent import quests_agent
from .subagents.new_day.agent import new_day_agent

quest_json = """
{
  "type": "quest_request",
  "questType": "biodiversity",
  "plants": ["Seaweed", "Kelp", "Algae"],
  "prey": ["Small Fish", "Shrimp", "Plankton"],
  "predators": ["Shark", "Seal", "Tuna"],
  "actions": 2
}
"""

newday_json = """
{
  "plants": ["Kelp", "Algae", "Coral", "Mangrove"],
  "prey": ["Small Fish", "Shrimp", "Crab"],
  "predators": ["Shark", "Seal", "Tuna", "Barracuda"],
  "garbage": ["Plastic Bottle", "Fishing Net", "Aluminum Can"]
}
"""

root_agent = Agent(
    name="EcoQuestPipeline",
    model="gemini-2.0-flash",
    sub_agents=[quests_agent, new_day_agent], 
    description=
    """
    Biodiversity and Quest Context Agent
    """,
    instruction=
    f"""
    You are a Parent agent that will determine what agent the 
    information given is best suited for. If you receive a JSON file such as 
    {newday_json} you are to route it to the New day agent. 
    If you receive a prompt such as {quest_json} you are to route it to 
    the questing agent.

    """,
)