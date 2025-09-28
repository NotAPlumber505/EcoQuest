import type { NextApiRequest, NextApiResponse } from 'next';
import { runAgent } from '@/lib/googleAdkClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');

  const appName = (req.query.app as string) || process.env.ADK_DEFAULT_APP || 'interpreter_agent';
  const input = req.body;

  try {
    const result = await runAgent(appName, input);

    // If result is an object (synthesized output or direct object), return it
    if (result && typeof result === 'object') return res.status(200).json(result);

    // If result is an array of agent events, try to extract synthesized_output
    if (Array.isArray(result)) {
      for (let i = result.length - 1; i >= 0; --i) {
        const ev = result[i];
        const synthesized = ev?.actions?.state_delta?.synthesized_output;
        if (synthesized) return res.status(200).json(synthesized);
        if ((ev?.author || '').toLowerCase().includes('synthesizer')) {
          const parts = ev?.content?.parts || [];
          const text = parts.map((p:any) => p.text || '').join('');
          try { const parsed = JSON.parse(text); if (parsed) return res.status(200).json(parsed); } catch (_) {}
        }
      }
    }

    return res.status(502).json({ error: 'Synthesized output not found', raw: result });
  } catch (err: any) {
    console.error('[api/ai/interpreter_agent] error', err);
    return res.status(500).json({ error: 'Agent execution failed', details: err?.message || String(err) });
  }
}

