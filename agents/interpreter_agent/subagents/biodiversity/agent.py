from google.adk.agents import LlmAgent
from pydantic import BaseModel, Field
from typing import List

class BiodiversityAssessment(BaseModel):
    summary: str = Field(
        description="A short explanation of the biodiversity health status for the day."
    )
    ecological_risk_level: str = Field(
        description="Categorical risk level based on biodiversity and pollution (e.g., 'Low', 'Medium', 'High', 'Deadly')."
    )
    trash_risk_level: str = Field(
        description="Categorical risk level based on the amount of trash (e.g., 'Low', 'Medium', 'High', 'Deadly')."
    )

biodiversity_agent = LlmAgent(
    name="BiodiversityAgent",
    model="gemini-2.0-flash",
    instruction="""
You are a Biodiversity Health Analyzer AI in an educational simulation about aquatic ecosystems.

Each day, you will receive a JSON file describing:
- current number of plant species
- current number of prey species
- current number of predator species
- the amount of trash in the water

Your job is to:
1. Evaluate the health of the biome based on biodiversity ratios.
2. Assess whether biodiversity is improving or declining.
3. Return a one-sentence summary of biome health and a risk level: "Low", "Medium", "High", “Deadly”.

Risk levels are determined by:
- Imbalanced predator-prey or prey-plant ratios (close to 1:1 is healthy)
- Species count (more species is better for biomes)
- Amount of Trash (5 objects of trash is low, 40 is deadly)

IMPORTANT: Your response MUST be valid JSON matching this structure:
{
  "summary": "Short explanation of the biome's current biodiversity condition.",
  "ecological_risk_level": "Low" | "Medium" | "High" | “Deadly”,
  “trash_risk_level” : “Low” | "Medium" | "High" | “Deadly”
}

DO NOT include anything outside of the JSON response.
""",
    description="Evaluates the biome's biodiversity health at the start of the day.",
    output_schema=BiodiversityAssessment,
    output_key="biodiversity_report"
)