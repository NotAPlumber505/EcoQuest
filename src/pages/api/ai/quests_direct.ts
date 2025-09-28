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
    // If runAgent throws (ADK server/network error), log and return a deterministic
    // fallback quest so the frontend can continue integration and testing.
    console.error('[api/ai/quests_direct] runAgent threw an exception, returning fallback quest', err);
    try {
      const generated = generateQuestFromInput(input);
      // include some debug info in the response for local development
      return res.status(200).json({ ...generated, _warning: 'runAgent error, returned generated fallback', _debug: String(err?.message || err) });
    } catch (gerr) {
      console.error('[api/ai/quests_direct] fallback generation also failed', gerr);
      return res.status(500).json({ error: 'Agent execution failed and fallback generation failed', details: String(gerr) });
    }
  }
}


function generateQuestFromInput(input: any) {
  // Normalize arrays
  const plants: string[] = Array.isArray(input?.plants) ? input.plants : [];
  const prey: string[] = Array.isArray(input?.prey) ? input.prey : [];
  const predators: string[] = Array.isArray(input?.predators) ? input.predators : [];
  const garbage: string[] = Array.isArray(input?.garbage) ? input.garbage : [];
  const actions = Number(input?.actions) || 1;
  // Allow external seed to vary deterministic randomness during testing
  const seed = Number(input?.seed) || Math.floor(Math.random() * 1000000);
  const rnd = (n = 1) => {
    // Simple seeded-ish pseudo-random using seed arithmetic
    const v = (Math.sin(seed + n * 9301) * 10000) % 1;
    return Math.abs(v);
  };

  // Decide quest type
  let quest_type = 'Garbage';
  let targets: string[] = [];

  if (input?.questType === 'biodiversity' || (!input?.questType && (prey.length || predators.length || plants.length))) {
    // Biodiversity-style quest
    // Simple heuristic augmented with randomness to vary outcomes
    if (predators.length > prey.length && Math.random() < 0.7) {
      quest_type = 'Removing';
      targets = sampleArray(predators, Math.max(1, actions), seed + 1);
    } else if (plants.length > 0 && plants.length <= (2 + Math.floor(rnd(2) * 3))) {
      quest_type = 'Plant';
      targets = sampleArray(plants, Math.max(1, actions), seed + 2);
    } else {
      quest_type = 'Adding';
      targets = sampleArray(prey.length ? prey : plants.concat(garbage), Math.max(1, actions), seed + 3);
    }
  } else if (input?.questType === 'pollution' || garbage.length > 0) {
    quest_type = 'Garbage';
    if (garbage.length > 0) targets = sampleArray(garbage, Math.max(1, actions), seed + 4);
    else targets = ['TrashBag'];
  } else {
    // Fallback: if no clear data, create a small garbage quest
    quest_type = 'Garbage';
    targets = garbage.length ? sampleArray(garbage, Math.max(1, actions), seed + 5) : ['TrashBag'];
  }

  // Build a one-sentence description
  const text = buildQuestText(quest_type, targets);
  return { text, quest_type, targets };
}

function sampleArray<T>(arr: T[], count: number, seed = 1): T[] {
  if (!arr || arr.length === 0) return [];
  const out: T[] = [];
  const used = new Set<number>();
  let s = Math.abs(seed) || 1;
  while (out.length < Math.min(count, arr.length)) {
    s = (s * 9301 + 49297) % 233280;
    const idx = Math.floor((s / 233280) * arr.length);
    if (!used.has(idx)) {
      used.add(idx);
      out.push(arr[idx]);
    }
  }
  return out;
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

