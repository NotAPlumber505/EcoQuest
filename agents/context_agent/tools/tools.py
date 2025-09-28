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


def handle_new_day(input_data: dict) -> dict:
    new_day_output = new_day_tool.run(input_data)
    biodiversity_output = biodiversity_tool.run(new_day_output)
    facts_output = facts_tool.run(new_day_output)
    return synthesizer_tool.run({
        "biodiversity_report": biodiversity_output["biodiversity_report"],
        "fun_fact": facts_output["fun_fact"]
    })


def handle_quest(input_data: dict) -> dict:
    quest_output = quest_tool.run(input_data)
    facts_output = facts_tool.run(quest_output)
    return synthesizer_tool.run({
        "biodiversity_report": {
            "summary": "No biodiversity report for quest context.",
            "ecological_risk_level": "N/A",
            "trash_risk_level": "N/A"
        },
        "fun_fact": facts_output["fun_fact"]
    })
