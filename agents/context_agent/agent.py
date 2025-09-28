from google.adk.agents import Agent
from .tools.tools import handle_new_day, handle_quest

root_agent = Agent(
    name="ContextAgent",
    model="gemini-2.0-flash",
    instruction="""
You receive JSON from the game.

- If the input has "questType", it's a quest → use the QuestAgent and pass its output to FactsAgent.
- Otherwise, it's a new day → use NewDayAgent and pass its output to BiodiversityAgent and FactsAgent.

Then, pass all results to SynthesizerAgent.

You must call the appropriate tools based on the structure of the input.
""",
    tools=[handle_new_day, handle_quest]
)
