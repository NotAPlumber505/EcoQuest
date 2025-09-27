"""
Questing Agent

This agent is responsible for evaluating current biodiversity and quest type,
and returning an appropriate quest rationale or directive in structured JSON format.
"""

from google.adk.agents import LlmAgent
from pydantic import BaseModel, Field
from typing import List

class QuestOutput(BaseModel):
    text: str = Field(description="A one-sentence story describing the quest.")
    quest_type: str = Field(description="The type of quest chosen (Adding, Removing, Plant, or Garbage).")
    targets: List[str] = Field(description="List of targets selected for the quest.")

quests_agent = LlmAgent(
    name="QuestAgent",
    model="gemini-2.0-flash",
    instruction="""
You are a Quest Generation AI in an environmental simulation game.

You receive a JSON input with:
- questType (either 'biodiversity' or 'pollution')
- For biodiversity quests: plants, prey, predators (lists)
- For pollution quests: garbage (list)
- actions (number of targets to select)

Your goal is to generate a quest JSON with three keys:
- "text": a 1-sentence story describing the quest.
- "quest_type": one of 'Adding', 'Removing', 'Plant', or 'Garbage'.
- "targets": a list of selected targets matching the quest.

Rules:
- For biodiversity quests:
    * Choose one quest_type from Adding, Removing, or Plant.
    * Select targets from only one group (plants, prey, or predators).
    * Use 'Plant' quest_type only if choosing plants as targets.
    * Do NOT select plants if quest_type is Adding or Removing.
    * Aim to improve biodiversity by balancing predator-prey or prey-plant ratios.
- For pollution quests:
    * Quest_type must be 'Garbage'.
    * Select targets from the garbage list.

IMPORTANT: Respond ONLY with a valid JSON matching this structure:
{
  "text": "Quest description here.",
  "quest_type": "Adding | Removing | Plant | Garbage",
  "targets": ["target1", "target2"]
}

Do NOT include any explanations or extra text.
""",
    description="Generates quests based on biodiversity or pollution levels with structured output.",
    output_schema=QuestOutput,
    output_key="quest",
)