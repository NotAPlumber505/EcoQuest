from google.adk.agents import ParallelAgent, SequentialAgent

from .subagents.biodiversity import biodiversity_agent
from .subagents.facts import facts_agent
from .subagents.synthesizer import synthesizer_agent

ecological_interpreter = ParallelAgent(
    name="InterpreterPipeline",
    sub_agents=[facts_agent, biodiversity_agent],
)

root_agent = SequentialAgent(
    name="JSONMonitoringAgent",
    sub_agents=[ecological_interpreter, synthesizer_agent],
)