import type { NextApiRequest, NextApiResponse } from 'next';
import { runAgent } from '@/lib/googleAdkClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');

  const appName = (req.query.app as string) || process.env.ADK_DEFAULT_APP || 'interpreter_agent';
  const input = req.body;

  try {
    const result = await runAgent(appName, input);

    // If runAgent returned a synthesized object or direct fun_fact, handle that
    if (result && typeof result === 'object') {
      if (result.fun_fact) return res.status(200).json({ fun_fact: result.fun_fact });
      if (result.synthesized_output && result.synthesized_output.fun_fact) {
        return res.status(200).json({ fun_fact: result.synthesized_output.fun_fact });
      }
      if (result.biodiversity_report && result.biodiversity_report.fun_fact) {
        return res.status(200).json({ fun_fact: result.biodiversity_report.fun_fact });
      }
    }

    // If result is an array of events, try to extract FactsAgent output
    if (Array.isArray(result)) {
      for (let i = result.length - 1; i >= 0; --i) {
        const ev = result[i];
        // Check state_delta first
        const fun = ev?.actions?.state_delta?.fun_fact || ev?.actions?.state_delta?.funFact;
        if (fun && fun.fun_fact) return res.status(200).json({ fun_fact: fun.fun_fact });

        // Parse modeled content.parts if present
        const author = (ev?.author || '').toLowerCase();
        if (author.includes('facts')) {
          const parts = ev?.content?.parts || [];
          const text = parts.map((p:any) => p.text || '').join('');
          try {
            const parsed = JSON.parse(text);
            if (parsed && parsed.fun_fact) return res.status(200).json({ fun_fact: parsed.fun_fact });
          } catch (_) {
            // ignore parse errors
          }
        }
      }
    }

    return res.status(502).json({ error: 'FactsAgent output not found in agent response', raw: result });
  } catch (err: any) {
    console.error('[api/ai/facts] error', err);
    return res.status(500).json({ error: 'Agent execution failed', details: err?.message || String(err) });
  }
}
