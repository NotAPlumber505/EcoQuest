import type { NextApiRequest, NextApiResponse } from 'next';
import { runAgent } from '@/lib/googleAdkClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');

  // Default to context_agent so quest-shaped payloads route to QuestAgent via the context
  // pipeline. Caller can override with ?app= to target a different app.
  const appName = (req.query.app as string) || process.env.ADK_DEFAULT_APP || 'context_agent';
  const input = req.body;

  try {
    const result = await runAgent(appName, input);

    // Common shapes
    if (result && typeof result === 'object') {
      if (result.quest) return res.status(200).json(result.quest);
      if (result.synthesized_output && result.synthesized_output.quest) return res.status(200).json(result.synthesized_output.quest);
    }

    // Event array parsing (SSE / ADK style)
    if (Array.isArray(result)) {
      for (let i = result.length - 1; i >= 0; --i) {
        const ev = result[i];
        const quest = ev?.actions?.state_delta?.quest;
        if (quest) return res.status(200).json(quest);
        const author = (ev?.author || '').toLowerCase();
        if (author.includes('quest')) {
          const parts = ev?.content?.parts || [];
          const text = parts.map((p:any) => p.text || '').join('');
          try { const parsed = JSON.parse(text); if (parsed && parsed.quest) return res.status(200).json(parsed.quest); } catch (_) {}
        }
      }
    }

    // If ADK didn't return a quest (or context_agent failed due to AgentTool
    // mismatch), generate a deterministic fallback quest server-side so the
    // frontend can continue integration and testing without restarting ADK.
    const fallbackNeeded = (
      Array.isArray(result) && result.some((r:any) => r && r.error && String(r.error).includes('AgentTool'))
    ) || (!Array.isArray(result) && (!result || !result.quest));

    if (fallbackNeeded) {
      const generated = generateQuestFromInput(input);
      return res.status(200).json(generated);
    }

    return res.status(502).json({ error: 'Quest output not found', raw: result });
  } catch (err: any) {
    console.error('[api/ai/quests_direct] error', err);
    return res.status(500).json({ error: 'Agent execution failed', details: err?.message || String(err) });
  }
}


function generateQuestFromInput(input: any) {
  // Normalize arrays
  const plants: string[] = Array.isArray(input?.plants) ? input.plants : [];
  const prey: string[] = Array.isArray(input?.prey) ? input.prey : [];
  const predators: string[] = Array.isArray(input?.predators) ? input.predators : [];
  const garbage: string[] = Array.isArray(input?.garbage) ? input.garbage : [];
  const actions = Number(input?.actions) || 1;

  // Decide quest type
  let quest_type = 'Garbage';
  let targets: string[] = [];

  if (input?.questType === 'biodiversity' || (!input?.questType && (prey.length || predators.length || plants.length))) {
    // Biodiversity-style quest
    // Simple heuristic: if predators > prey, remove predators; if plants are few, plant; else add prey.
    if (predators.length > prey.length) {
      quest_type = 'Removing';
      targets = predators.slice(0, Math.max(1, actions));
    } else if (plants.length > 0 && plants.length <= 2) {
      quest_type = 'Plant';
      targets = plants.slice(0, Math.max(1, actions));
    } else {
      quest_type = 'Adding';
      targets = prey.slice(0, Math.max(1, actions));
    }
  } else if (input?.questType === 'pollution' || garbage.length > 0) {
    quest_type = 'Garbage';
    targets = garbage.slice(0, Math.max(1, actions));
  } else {
    // Fallback: if no clear data, create a small garbage quest
    quest_type = 'Garbage';
    targets = garbage.length ? garbage.slice(0, Math.max(1, actions)) : ['TrashBag'];
  }

  // Build a one-sentence description
  const text = buildQuestText(quest_type, targets);
  return { text, quest_type, targets };
}

function buildQuestText(quest_type: string, targets: string[]) {
  if (quest_type === 'Garbage') {
    return `Collect ${targets.join(', ')} to clear pollution and protect local wildlife.`;
  }
  if (quest_type === 'Plant') {
    return `Plant ${targets.join(', ')} to help restore habitat and encourage biodiversity.`;
  }
  if (quest_type === 'Removing') {
    return `Remove ${targets.join(', ')} to rebalance the food chain and reduce predation pressure.`;
  }
  if (quest_type === 'Adding') {
    return `Protect or add ${targets.join(', ')} to help the ecosystem recover and diversify species.`;
  }
  return `Complete a task involving ${targets.join(', ')}.`;
}

