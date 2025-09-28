import type { NextApiRequest, NextApiResponse } from 'next';
import { runAgent } from '@/lib/googleAdkClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');

  const appName = (req.query.app as string) || process.env.ADK_DEFAULT_APP || 'context_agent';
  const input = req.body;

  try {
    const result = await runAgent(appName, input);

    if (result && typeof result === 'object') {
      if (result.quest) return res.status(200).json(result.quest);
      if (result.synthesized_output) return res.status(200).json(result.synthesized_output);
    }

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

    // Workaround: fallback to the interpreter_agent if the running ContextAgent
    // failed due to AgentTool API mismatch in the live ADK process (common when
    // the server hasn't been restarted after Python code edits).
    try {
      const hasAgentToolError = Array.isArray(result) && result.some((r:any) => r && r.error && String(r.error).includes('AgentTool'));
      if (hasAgentToolError) {
        console.warn('[api/ai/quests] context_agent failed with AgentTool error, falling back to interpreter_agent');
        const fallback = await runAgent('interpreter_agent', input);
        if (fallback && typeof fallback === 'object') {
          if (fallback.quest) return res.status(200).json(fallback.quest);
          if (fallback.synthesized_output) return res.status(200).json(fallback.synthesized_output);
        }
        if (Array.isArray(fallback)) {
          for (let i = fallback.length - 1; i >= 0; --i) {
            const ev = fallback[i];
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
      }
    } catch (e) {
      // ignore fallback errors and fall through to returning the raw result
    }

    return res.status(502).json({ error: 'Quest output not found', raw: result });
  } catch (err: any) {
    console.error('[api/ai/quests] error', err);
    return res.status(500).json({ error: 'Agent execution failed', details: err?.message || String(err) });
  }
}
