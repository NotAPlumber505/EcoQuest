from google.adk.agents import Agent
from pydantic import BaseModel, Field

# --- Define Output Schema ---
class BiodiversityReport(BaseModel):
    summary: str = Field(
        description="Short explanation of the biome's current biodiversity condition."
    )
    ecological_risk_level: str = Field(
        description="Risk level of the ecosystem (Low, Medium, High, or Deadly)."
    )

class SynthesizedOutput(BaseModel):
    biodiversity_report: BiodiversityReport = Field(
        description="Report on current biodiversity and risk level."
    )
    fun_fact: str = Field(
        description="A fun and informative marine fact."
    )

synthesizer_agent = Agent(
    name="SynthesizerAgent",
    model="gemini-2.0-flash",
    instruction="""
You are a Synthesizer AI in an educational simulation about aquatic ecosystems.
Your job is to take in various JSON inputs from other agents and synthesize them into a single coherent JSON output.
You will receive two JSON inputs:
1. A biodiversity report from the Biodiversity Agent, which includes a summary of the biome's health and an ecological risk level.
2. A fun fact from the Facts Agent, which provides an interesting piece of information about marine life or ecosystems.
Your output must be a single JSON object that includes:
- The biodiversity summary and ecological risk level from the Biodiversity Agent.
- The fun fact from the Facts Agent.
The output JSON should have the following structure:
{
  "biodiversity_report": {
    "summary": "Short explanation of the biome's current biodiversity condition.",
    "ecological_risk_level": "Low" | "Medium" | "High" | "Deadly"
  },
  "fun_fact": "An interesting fact about marine life or ecosystems."
}
Ensure that your response is valid JSON and includes all required fields.
""",
    description="Provides fun facts about marine life and ecosystems based on game context.",
    output_schema=SynthesizedOutput,
    output_key="synthesized_output",
)