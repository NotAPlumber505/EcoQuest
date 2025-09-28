(async () => {
  // Lightweight test runner for the ADK / Next API
  // Usage:
  //   node scripts/test_agent_run.js            # posts to Next API at localhost:3000
  //   TARGET=http://127.0.0.1:8000/run node scripts/test_agent_run.js  # post directly to ADK

  // Default to the Next dev API on port 8080 for this repo; override with
  // TARGET env or first arg if needed.
  const target = process.env.TARGET || process.argv[2] || 'http://localhost:8080/api/ai/context?app=interpreter_agent';

  // Sample payload matching the FactsAgent example (note key is `garbage`)
  const payload = {
    plants: ["Coral"],
    prey: ["Clownfish","BlueFish","RedFish","YellowFish","Turtle"],
    predators: ["Dolphin","Eel","Octopus","Shark","Whale"],
    garbage: ["AppleTrash","BottleTrash","DuckTrash","SodaTrash","TrashBag"]
  };

  // Resolve fetch implementation
  let fetchImpl = globalThis.fetch;
  if (!fetchImpl) {
    try {
      const nf = await import('node-fetch');
      fetchImpl = nf.default || nf;
    } catch (e) {
      console.error('Please run on Node 18+ or install node-fetch to use this script.');
      process.exit(1);
    }
  }

  try {
    console.log('POSTing to', target);
    const resp = await fetchImpl(target, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const ct = resp.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      const json = await resp.json();
      console.log('Response (JSON):', JSON.stringify(json, null, 2));
    } else {
      const text = await resp.text();
      console.log('Response (text):', text);
    }
  } catch (err) {
    console.error('Request failed:', err);
    process.exit(1);
  }
})();
