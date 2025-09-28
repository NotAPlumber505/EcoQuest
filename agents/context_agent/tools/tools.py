from google.adk.tools.agent_tool import AgentTool

from interpreter_agent.subagents.new_day.agent import new_day_agent
from interpreter_agent.subagents.quests.agent import quests_agent
from interpreter_agent.subagents.biodiversity.agent import biodiversity_agent
from interpreter_agent.subagents.facts.agent import facts_agent
from interpreter_agent.subagents.synthesizer.agent import synthesizer_agent

# Wrap agents as tools
new_day_tool = AgentTool(new_day_agent)
quest_tool = AgentTool(quests_agent)
biodiversity_tool = AgentTool(biodiversity_agent)
facts_tool = AgentTool(facts_agent)
synthesizer_tool = AgentTool(synthesizer_agent)


def _call_tool(tool, input_data: dict) -> dict:
    """Call an AgentTool compatibly across ADK versions."""
    # Try common method names
    if hasattr(tool, 'run') and callable(getattr(tool, 'run')):
        return tool.run(input_data)
    if hasattr(tool, 'call') and callable(getattr(tool, 'call')):
        return tool.call(input_data)
    if hasattr(tool, 'invoke') and callable(getattr(tool, 'invoke')):
        return tool.invoke(input_data)
    # Try calling the object itself
    if callable(tool):
        return tool(input_data)
    raise AttributeError("AgentTool has no callable interface (tried run, call, invoke, __call__)")


def handle_new_day(input_data: dict) -> dict:
    new_day_output = _call_tool(new_day_tool, input_data)
    biodiversity_output = _call_tool(biodiversity_tool, new_day_output)
    facts_output = _call_tool(facts_tool, new_day_output)
    return _call_tool(synthesizer_tool, {
        "biodiversity_report": biodiversity_output["biodiversity_report"],
        "fun_fact": facts_output["fun_fact"]
    })


def handle_quest(input_data: dict) -> dict:
    quest_output = _call_tool(quest_tool, input_data)
    facts_output = _call_tool(facts_tool, quest_output)
    return _call_tool(synthesizer_tool, {
        "biodiversity_report": {
            "summary": "No biodiversity report for quest context.",
            "ecological_risk_level": "N/A",
            "trash_risk_level": "N/A"
        },
        "fun_fact": facts_output["fun_fact"]
    })
