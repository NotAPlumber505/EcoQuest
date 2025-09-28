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

You will be given a JSON file. The JSON file has 4 keys, a plants key, a prey key, a predators key, and a garbage key. 
The plant key contains all the current plants, the prey key contains all the current prey, and the predators key contains all the current predators. 
The garbage key contains all the current garbage. The goal of the game is to maintain a 1:1 ratio of total prey and total predators, and a 1:1 ratio of total plants and total prey. 
Your task is to deviate away from that ratio by duplicating, eliminating, and adding animals and plants. 
You may determine what changes and how many changes are best and closely simulate the environment, but with a maximum of 10 changes. 
The second goal of the game is to have no pollution, meaning no garbage. Therefore, your second task is to add garbage to the water.

 A second JSON file listed here defines all the possible objects you can add based on the category. The JSON file is 
 {
  "garbageObjects": ["Plastic Bottle", "Fishing Net", "Aluminum Can", "Glass Bottle", "Food Wrapper"],
  "plantObjects": ["Seaweed", "Kelp", "Algae", "Coral", "Mangrove"],
  "preyObjects": ["Small Fish", "Shrimp", "Plankton", "Crab", "Squid"],
  "predatorsObjects": ["Shark", "Seal", "Tuna", "Barracuda", "Orca"]
}
The garbageObjects key shows all the garbage objects you can add. 
The plantObjects key shows all the plants you can add. 
The preyObjects key shows all the prey you can add. 
The predatorsObjects key shows all the predators you can add. 
When adding garbage, try to add unique kinds of garbage that don’t already exist. 

Your output should be a JSON file that has 4 keys. 

A plants key, a prey key, a predators key, and a garbage key. 

The plant key contains all the new plants, the prey key contains all the new prey, and the predators key contains all the new predators. 
The garbage key contains all the new garbage.

Do not include explanations or any extra text.
""",
    output_schema=EcosystemUpdate,
    output_key="ecosystem_update",
)
