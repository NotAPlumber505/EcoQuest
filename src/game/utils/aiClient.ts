import { getPlants, getPrey, getPredators, getGarbage } from './questState';

async function postJson(path: string, body: any) {
  const resp = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!resp.ok) throw new Error(`API ${path} failed: ${resp.status} ${resp.statusText}`);
  return resp.json();
}

export async function fetchFacts(input?: any): Promise<string> {
  const payload = input || { garbage: getGarbage() };
  const json = await postJson('/api/ai/facts?app=interpreter_agent', payload);
  // Facts route returns { fun_fact } or synthesized_output.fun_fact
  if (json && typeof json === 'object') {
    if (json.fun_fact) return String(json.fun_fact);
    if (json.synthesized_output && json.synthesized_output.fun_fact) return String(json.synthesized_output.fun_fact);
  }
  // If ADK SSE returned array, try to extract text authored by facts
  if (Array.isArray(json)) {
    for (let i = json.length - 1; i >= 0; --i) {
      const ev = json[i];
      const parts = ev?.content?.parts || [];
      const text = parts.map((p:any) => p.text || '').join('');
      if (text) return text;
    }
  }
  return 'No fact available.';
}

export async function fetchBiodiversity(input?: any): Promise<string> {
  const payload = input || { plants: getPlants(), prey: getPrey(), predators: getPredators(), garbage: getGarbage() };
  const json = await postJson('/api/ai/biodiversity?app=interpreter_agent', payload);
  // Try common shapes
  if (json && typeof json === 'object') {
    if (json.summary) return String(json.summary);
    if (json.biodiversity_report && json.biodiversity_report.summary) return String(json.biodiversity_report.summary);
    if (json.synthesized_output && json.synthesized_output.biodiversity_report && json.synthesized_output.biodiversity_report.summary) return String(json.synthesized_output.biodiversity_report.summary);
  }
  if (Array.isArray(json)) {
    for (let i = json.length - 1; i >= 0; --i) {
      const ev = json[i];
      const parts = ev?.content?.parts || [];
      const text = parts.map((p:any) => p.text || '').join('');
      if (text) return text;
    }
  }
  return 'No biodiversity report available.';
}

export async function fetchNewDay(input?: any): Promise<string> {
  const payload = input || { plants: getPlants(), prey: getPrey(), predators: getPredators(), garbage: getGarbage() };
  const json = await postJson('/api/ai/new_day?app=context_agent', payload);
  // Try to extract synthesized_output text or ecosystem_update or combined summary+fact
  if (json && typeof json === 'object') {
    if (json.synthesized_output) {
      const synth = json.synthesized_output;
      const parts: string[] = [];
      if (synth.biodiversity_report && synth.biodiversity_report.summary) parts.push(String(synth.biodiversity_report.summary));
      if (synth.fun_fact) parts.push(String(synth.fun_fact));
      if (parts.length) return parts.join('\n\n');
    }
    if (json.ecosystem_update && typeof json.ecosystem_update === 'object') {
      // build a short human-friendly summary
      const eu = json.ecosystem_update;
      const pieces: string[] = [];
      if (eu.plants) pieces.push(`Plants: ${JSON.stringify(eu.plants)}`);
      if (eu.prey) pieces.push(`Prey: ${JSON.stringify(eu.prey)}`);
      if (eu.predators) pieces.push(`Predators: ${JSON.stringify(eu.predators)}`);
      if (eu.garbage) pieces.push(`Garbage: ${JSON.stringify(eu.garbage)}`);
      if (pieces.length) return pieces.join('\n');
    }
  }
  if (Array.isArray(json)) {
    for (let i = json.length - 1; i >= 0; --i) {
      const ev = json[i];
      const parts = ev?.content?.parts || [];
      const text = parts.map((p:any) => p.text || '').join('');
      if (text) return text;
    }
  }
  return 'No new-day summary available.';
}

// utils/api.ts
export async function fetchQuestDirect(questType: string, input?: any): Promise<any> {
  const seed = Math.floor(Math.random() * 1000000);

  // Default biome context
  const defaultBiome = {
    questType,
    plants: getPlants(),        // Your game's current biome state
    prey: getPrey(),
    predators: getPredators(),
    garbage: getGarbage(),
    actions: 1,
    seed
  };

  const payload = input || defaultBiome;

  const response = await fetch('/api/ai/context', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const json = await response.json();

  // Parse different possible ADK outputs
  if (json?.text) return json;
  if (json?.quest) return json.quest;
  if (json?.synthesized_output?.text) return json.synthesized_output;

  if (Array.isArray(json)) {
    for (let i = json.length - 1; i >= 0; --i) {
      const ev = json[i];
      const parts = ev?.content?.parts || [];
      const text = parts.map((p: any) => p.text || '').join('');
      try {
        const parsed = JSON.parse(text);
        if (parsed?.quest || parsed?.text) return parsed.quest || parsed;
      } catch (_) { }
      if (text) return { text };
    }
  }

  return { text: 'No quest available.' };
}

