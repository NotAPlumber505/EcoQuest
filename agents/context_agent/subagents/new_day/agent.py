from google.adk.agents import LlmAgent
from pydantic import BaseModel, Field
from typing import List

class EcosystemUpdate(BaseModel):
    plants: List[str] = Field(description="List of updated plants")
    prey: List[str] = Field(description="List of updated prey")
    predators: List[str] = Field(description="List of updated predators")
    garbage: List[str] = Field(description="List of updated garbage")

new_day_agent = LlmAgent(
    name="NewDayAgent",
    model="gemini-2.0-flash",
    instruction="""
You are an Agent that determines the biodiversity of a body of water for a videogame after an entire day has passed.

You receive a JSON with 4 keys: plants, prey, predators, and garbage.
You also receive a JSONObjects file that defines possible objects to add.

Your goal is to produce a JSON with updated lists for plants, prey, predators, and garbage.

Rules:
- Max 10 total changes (adding, removing, duplicating).
- Try to maintain 1:1 ratios between prey-predators and prey-plants.
- Add unique garbage objects not currently present.

Respond ONLY with a JSON matching this structure:
{
  "plants": [...],
  "prey": [...],
  "predators": [...],
  "garbage": [...]
}

Do not include explanations or any extra text.
""",
    output_schema=EcosystemUpdate,
    output_key="ecosystem_update",
)
