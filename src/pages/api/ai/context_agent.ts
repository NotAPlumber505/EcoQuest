import type { NextApiRequest, NextApiResponse } from 'next';
import { runAgent } from '@/lib/googleAdkClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');

  const input = req.body;
  try {
    const result = await runAgent('context_agent', input);
    return res.status(200).json(result);
  } catch (err: any) {
    console.error('context_agent error', err);
    return res.status(500).json({ error: 'context_agent failed', details: err?.message || err });
  }
}
