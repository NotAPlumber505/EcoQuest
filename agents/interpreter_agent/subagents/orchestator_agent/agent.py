from google.adk.agents import SequentialAgent, ParallelAgent
from ...subagents.biodiversity.agent import biodiversity_agent
from ...subagents.facts.agent import facts_agent
from ...subagents.synthesizer.agent import synthesizer_agent

# Parallel processing of facts + biodiversity
interpreter_pipeline = ParallelAgent(
    name="InterpreterPipeline",
    sub_agents=[facts_agent, biodiversity_agent],
)

# Sequential flow: interpreter → synthesizer
root_agent = SequentialAgent(
    name="InterpreterRootAgent",
    sub_agents=[interpreter_pipeline, synthesizer_agent],
)
