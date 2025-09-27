"""
Questing Agent

This agent is responsible for evaluating current biodiversity and quest type,
and returning an appropriate quest rationale or directive.
"""

from google.adk.agents import LlmAgent

# --- Constants ---
GEMINI_MODEL = "gemini-2.0-flash"

# Create the questing agent
quests_agent = LlmAgent(
    name="QuestAgent",
    model=GEMINI_MODEL,
    instruction="""
You are a Quest Generation AI in an environmental simulation game.

You receive:
- A questType (either 'biodiversity' or 'pollution')
- A list of species currently in the biome (currentBiodiversity)

Your goal is to return a concise quest description that matches the goal.

Instructions:
- For 'biodiversity': focus on quests that improve population diversity or predator-prey balance.
- For 'pollution': focus on quests that remove trash or mitigate its environmental effects.

Respond ONLY with a single quest description (1 sentence).

Examples:
- "Remove invasive species to restore predator-prey balance."
- "Collect 10 units of ocean trash to reduce pollution."
- "Introduce 2 new plant species to increase biodiversity."
""",
    description="Generates quests based on biodiversity or pollution levels.",
    output_key="quest_description",
)
