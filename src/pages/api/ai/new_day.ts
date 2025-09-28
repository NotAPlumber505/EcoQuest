import type { NextApiRequest, NextApiResponse } from 'next';
import { runAgent } from '@/lib/googleAdkClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');

  // This endpoint expects the New Day JSON (plants, prey, predators, garbage)
  const appName = (req.query.app as string) || process.env.ADK_DEFAULT_APP || 'context_agent';
  const input = req.body;

  try {
    const result = await runAgent(appName, input);

    // Try common shapes first: synthesized_output (final combined JSON)
    if (result && typeof result === 'object') {
      if (result.synthesized_output) return res.status(200).json(result.synthesized_output);
      if (result.ecosystem_update) return res.status(200).json(result.ecosystem_update);
      // Some returns may include biodiversity_report + fun_fact directly
      if (result.biodiversity_report && result.fun_fact) return res.status(200).json({ biodiversity_report: result.biodiversity_report, fun_fact: result.fun_fact });
    }

    // If we got an event array, try to find synthesized_output or ecosystem_update
    if (Array.isArray(result)) {
      for (let i = result.length - 1; i >= 0; --i) {
        const ev = result[i];
        const synth = ev?.actions?.state_delta?.synthesized_output;
        if (synth) return res.status(200).json(synth);
        const eco = ev?.actions?.state_delta?.ecosystem_update;
        if (eco) return res.status(200).json(eco);
        // Parse modeled content authored by Synthesizer or NewDay
        const author = (ev?.author || '').toLowerCase();
        if (author.includes('synthesizer') || author.includes('newday') || author.includes('new_day')) {
          const parts = ev?.content?.parts || [];
          const text = parts.map((p:any) => p.text || '').join('');
          try { const parsed = JSON.parse(text); if (parsed) return res.status(200).json(parsed); } catch (_) {}
        }
      }
    }

    // Workaround: if the context agent failed due to AgentTool API mismatch
    // (common when the running ADK process hasn't been restarted after code edits),
    // detect that and fallback to calling the `interpreter_agent` directly so
    // we still return synthesized output to the frontend.
    try {
      const hasAgentToolError = Array.isArray(result) && result.some((r:any) => r && r.error && String(r.error).includes("AgentTool"));
      if (hasAgentToolError) {
        console.warn('[api/ai/new_day] context_agent failed with AgentTool error, falling back to interpreter_agent');
        const fallback = await runAgent('interpreter_agent', input);
        if (fallback && typeof fallback === 'object') {
          if (fallback.synthesized_output) return res.status(200).json(fallback.synthesized_output);
          if (fallback.biodiversity_report && fallback.fun_fact) return res.status(200).json({ biodiversity_report: fallback.biodiversity_report, fun_fact: fallback.fun_fact });
        }
        if (Array.isArray(fallback)) {
          for (let i = fallback.length - 1; i >= 0; --i) {
            const ev = fallback[i];
            const synth = ev?.actions?.state_delta?.synthesized_output;
            if (synth) return res.status(200).json(synth);
            const author = (ev?.author || '').toLowerCase();
            if (author.includes('synthesizer')) {
              const parts = ev?.content?.parts || [];
              const text = parts.map((p:any) => p.text || '').join('');
              try { const parsed = JSON.parse(text); if (parsed) return res.status(200).json(parsed); } catch (_) {}
            }
          }
        }
      }
    } catch (e) {
      // ignore fallback errors and fall through to returning the raw result
    }

    return res.status(502).json({ error: 'NewDay output not found', raw: result });
  } catch (err: any) {
    console.error('[api/ai/new_day] error', err);
    return res.status(500).json({ error: 'Agent execution failed', details: err?.message || String(err) });
  }
}
