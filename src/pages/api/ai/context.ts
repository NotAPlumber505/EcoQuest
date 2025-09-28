// pages/api/ai/context.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { runAgent } from '@/lib/googleAdkClient';

// Optional: if you want to target a specific ADK app, pass ?app=app_name
// Example: POST /api/ai/context?app=interpreter_agent

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');

  // Support two request shapes:
  // 1) Simple: POST /api/ai/context?app=interpreter_agent  with body = input (your sample payload)
  // 2) ADK-style: POST /api/ai/context  with body = { app_name: 'interpreter_agent', input: { ... } }
  let appName = (req.query.app as string) || process.env.ADK_DEFAULT_APP || 'interpreter_agent';
  let input: any = req.body;

  // If caller supplied an ADK-style wrapper, prefer that
  if (req.body && typeof req.body === 'object' && (req.body.app_name || req.body.input)) {
    if (req.body.app_name) appName = req.body.app_name;
    input = req.body.input ?? {};
  }

  // Helpful debug log when ADK returns 422 — will show what we forward to ADK
  console.debug('[api/ai/context] appName=', appName, 'inputKeys=', Object.keys(input || {}));

  try {
    const result = await runAgent(appName, input);
    return res.status(200).json(result);
  } catch (error: any) {
    console.error('AI Error:', error);
    return res.status(500).json({ error: 'Agent execution failed', details: error?.message || error });
  }
}
