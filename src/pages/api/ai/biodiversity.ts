import type { NextApiRequest, NextApiResponse } from 'next';
import { runAgent } from '@/lib/googleAdkClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');

  const appName = (req.query.app as string) || process.env.ADK_DEFAULT_APP || 'interpreter_agent';
  const input = req.body;

  try {
    const result = await runAgent(appName, input);

    if (result && typeof result === 'object') {
      if (result.biodiversity_report) return res.status(200).json(result.biodiversity_report);
      if (result.synthesized_output && result.synthesized_output.biodiversity_report) {
        return res.status(200).json(result.synthesized_output.biodiversity_report);
      }
    }

    if (Array.isArray(result)) {
      for (let i = result.length - 1; i >= 0; --i) {
        const ev = result[i];
        const report = ev?.actions?.state_delta?.biodiversity_report;
        if (report) return res.status(200).json(report);
        const author = (ev?.author || '').toLowerCase();
        if (author.includes('biodiversity')) {
          const parts = ev?.content?.parts || [];
          const text = parts.map((p:any) => p.text || '').join('');
          try {
            const parsed = JSON.parse(text);
            if (parsed && parsed.biodiversity_report) return res.status(200).json(parsed.biodiversity_report);
          } catch (_) {}
        }
      }
    }

    // If the ContextAgent failed in-process due to an AgentTool mismatch, fall
    // back to calling the interpreter_agent directly so the frontend still
    // receives the biodiversity report.
    try {
      const hasAgentToolError = Array.isArray(result) && result.some((r:any) => r && r.error && String(r.error).includes('AgentTool'));
      if (hasAgentToolError) {
        console.warn('[api/ai/biodiversity] context_agent failed with AgentTool error, falling back to interpreter_agent');
        const fallback = await runAgent('interpreter_agent', input);
        if (fallback && typeof fallback === 'object') {
          if (fallback.biodiversity_report) return res.status(200).json(fallback.biodiversity_report);
          if (fallback.synthesized_output && fallback.synthesized_output.biodiversity_report) return res.status(200).json(fallback.synthesized_output.biodiversity_report);
        }
        if (Array.isArray(fallback)) {
          for (let i = fallback.length - 1; i >= 0; --i) {
            const ev = fallback[i];
            const report = ev?.actions?.state_delta?.biodiversity_report;
            if (report) return res.status(200).json(report);
            const author = (ev?.author || '').toLowerCase();
            if (author.includes('biodiversity')) {
              const parts = ev?.content?.parts || [];
              const text = parts.map((p:any) => p.text || '').join('');
              try { const parsed = JSON.parse(text); if (parsed && parsed.biodiversity_report) return res.status(200).json(parsed.biodiversity_report); } catch (_) {}
            }
          }
        }
      }
    } catch (e) {
      // ignore fallback errors
    }

    return res.status(502).json({ error: 'Biodiversity report not found in response', raw: result });
  } catch (err: any) {
    console.error('[api/ai/biodiversity] error', err);
    return res.status(500).json({ error: 'Agent execution failed', details: err?.message || String(err) });
  }
}
