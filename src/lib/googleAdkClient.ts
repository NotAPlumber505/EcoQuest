// Lightweight client wrapper for interacting with a running ADK FastAPI server
// Strategy:
// - Try to use a local Node SDK if one exists (named 'google-adk' here)
// - Otherwise, fall back to HTTP calls to the ADK FastAPI endpoints you run locally
// - Export a single runAgent(appName, input) helper used by the Next.js API


export type RunAgentResponse = any;

const ADK_HTTP_BASE = process.env.ADK_HTTP_BASE || 'http://127.0.0.1:8000';

// Resolve a fetch implementation: prefer global fetch (Node 18+ / browser),
// otherwise try to require node-fetch at runtime. This avoids a static import
// that TypeScript complains about when the package is not installed.
function getFetch(): typeof globalThis.fetch {
  // @ts-ignore
  if (typeof globalThis.fetch === 'function') return globalThis.fetch;

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
    const nf = require('node-fetch');
    // node-fetch exports default in ESM builds
    return nf.default || nf;
  } catch (err) {
    throw new Error('No fetch implementation available. Install node-fetch or use Node 18+.');
  }
}

async function runAgentHttp(appName: string, input: any): Promise<RunAgentResponse> {
  const fetchImpl = getFetch();
  // Preferred flow for the ADK FastAPI used in this repo (ContextAgent):
  // 1) Create or get a session: POST /apps/{app}/users/user/sessions
  // 2) Trigger a run using /run_sse (server supports SSE/streaming responses)
  // If either endpoint isn't available, fall back to a simple POST /run

  // 1) Create session
  const sessionsUrl = `${ADK_HTTP_BASE}/apps/${encodeURIComponent(appName)}/users/user/sessions`;
  let sessionResp: Response | null = null;
  try {
    sessionResp = await fetchImpl(sessionsUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
  } catch (err) {
    // continue to fallback
    sessionResp = null;
  }

  let sessionJson: any = null;
  if (sessionResp && sessionResp.ok) {
    try {
      sessionJson = await sessionResp.json();
    } catch (e) {
      // ignore parse errors and fall back
      sessionJson = null;
    }
  }

  // 2) Try /run_sse with session info (if available)
  const runSseUrl = `${ADK_HTTP_BASE}/run_sse`;
  const runBody: any = {
    app_name: appName,
    input,
  };
  if (sessionJson) {
    // include session information returned by the sessions endpoint
    // ADK /run_sse expects flat fields: user_id, session_id, new_message
    // If session creation returned a Session object, extract the ids and
    // construct a minimal new_message wrapper. The browser client typically
    // sends new_message: { role: 'user', parts: [ { text: '...' } ] }
    const userId = sessionJson.user_id || sessionJson.userId || 'user';
    const sessionId = sessionJson.id || sessionJson.session_id || sessionJson.sessionId;
    if (userId && sessionId) {
      // Build an AgentRunRequest-like body expected by ADK
      const wrapped: any = {
        app_name: appName,
        user_id: userId,
        session_id: sessionId,
        streaming: true,
        new_message: {
          role: 'user',
          // parts: the ADK expects typed parts; simplest is a single text part
          parts: [ { text: JSON.stringify(input) } ],
        },
      };
      // Replace runBody with the properly shaped request
      Object.assign(runBody, wrapped);
    } else {
      // If we couldn't extract ids, fallback to including the session raw
      runBody.session = sessionJson;
    }
  }

  try {
    const runResp = await fetchImpl(runSseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(runBody),
    });

    if (runResp.ok) {
      // The server might stream SSE text; try to parse JSON body if returned
      const contentType = (runResp.headers && runResp.headers.get ? runResp.headers.get('content-type') : '') || '';
      if (contentType.includes('application/json')) {
        return runResp.json();
      }

      // If it's not JSON (e.g., SSE stream), read the stream and parse SSE events
      try {
        const reader = runResp.body?.getReader?.();
        if (reader) {
          let buffer = '';
          const parsedEvents: any[] = [];

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += new TextDecoder().decode(value, { stream: true });

            // Try to split complete SSE events (events are separated by double newlines)
            const parts = buffer.split('\n\n');
            // Keep the last partial chunk in buffer
            buffer = parts.pop() || '';

            for (const part of parts) {
              // Each part may contain multiple lines; extract lines that start with "data:"
              const dataLines = part.split('\n').filter((l) => l.trim().startsWith('data:'));
              if (dataLines.length === 0) continue;
              const dataPayload = dataLines.map((l) => l.replace(/^data:\s?/, '')).join('\n');
              try {
                parsedEvents.push(JSON.parse(dataPayload));
              } catch (e) {
                // If parse fails, push raw payload
                parsedEvents.push({ raw: dataPayload });
              }
            }
          }

          // After stream end, if buffer contains trailing data, try to parse it
          if (buffer.trim().length > 0) {
            const dataLines = buffer.split('\n').filter((l) => l.trim().startsWith('data:'));
            if (dataLines.length > 0) {
              const dataPayload = dataLines.map((l) => l.replace(/^data:\s?/, '')).join('\n');
              try {
                parsedEvents.push(JSON.parse(dataPayload));
              } catch (e) {
                parsedEvents.push({ raw: dataPayload });
              }
            }
          }

          // If we parsed one JSON event, return it; if multiple, return the array
          if (parsedEvents.length === 1) return parsedEvents[0];
          if (parsedEvents.length > 1) {
            // Try to extract a final synthesized output if present in events
            try {
              // Look for actions.state_delta.synthesized_output in events (last one wins)
              for (let i = parsedEvents.length - 1; i >= 0; --i) {
                const ev = parsedEvents[i];
                if (ev && ev.actions && ev.actions.state_delta && ev.actions.state_delta.synthesized_output) {
                  return ev.actions.state_delta.synthesized_output;
                }
              }

              // Fallback: look for an event authored by SynthesizerAgent and try to parse its content.parts text
              for (let i = parsedEvents.length - 1; i >= 0; --i) {
                const ev = parsedEvents[i];
                if (ev && ev.author && ev.author.toLowerCase().includes('synthesizer')) {
                  const parts = ev.content?.parts || [];
                  const text = parts.map((p:any) => p.text || '').join('');
                  try {
                    return JSON.parse(text);
                  } catch (e) {
                    // ignore parse error
                  }
                }
              }
            } catch (e) {
              // ignore and fall back to returning the whole array
            }

            return parsedEvents;
          }

          // If no structured events found, return the accumulated raw text
          return { text: buffer };
        }
      } catch (err) {
        // fall back to returning raw text if anything goes wrong
        try {
          const text = await runResp.text();
          return { text };
        } catch (e) {
          return { error: 'Failed to read run_sse response', details: String(e) };
        }
      }
    }
  } catch (err) {
    // fall through to fallback
  }

  // If we reach here, the /run_sse attempt didn't return OK. Try to capture
  // any response body for debugging to help diagnose 422 errors.
  try {
    const probe = await fetchImpl(runSseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(runBody),
    });
    if (!probe.ok) {
      let text = '';
      try { text = await probe.text(); } catch (e) { text = String(e); }
      console.error('[googleAdkClient] /run_sse error', probe.status, probe.statusText, 'bodySent=', JSON.stringify(runBody), 'responseText=', text);
    }
  } catch (e) {
    // ignore probe errors
  }

  // Final fallback: POST /run with a simple body
  const runUrl = `${ADK_HTTP_BASE}/run`;
  // If runBody already contains user_id/session_id/new_message, use it
  const runPayload = (runBody && runBody.user_id && runBody.session_id && runBody.new_message)
    ? runBody
    : { app_name: appName, input };

  const fallbackResp = await fetchImpl(runUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(runPayload),
  });

  if (!fallbackResp.ok) {
    const text = await fallbackResp.text();
    throw new Error(`ADK server error: ${fallbackResp.status} ${fallbackResp.statusText}: ${text}`);
  }

  return fallbackResp.json();
}

// Try to load an optional Node SDK. If it exists, prefer it.
let nodeSdk: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
  nodeSdk = require('google-adk');
} catch (err) {
  nodeSdk = null;
}

export async function runAgent(appName: string, input: any): Promise<RunAgentResponse> {
  if (nodeSdk && typeof nodeSdk.run_agent === 'function') {
    // If the SDK expects an agent object instead of an app name, adapt here.
    return nodeSdk.run_agent(appName, input);
  }

  // Fall back to HTTP call
  return runAgentHttp(appName, input);
}
