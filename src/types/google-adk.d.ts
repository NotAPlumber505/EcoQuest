declare module 'google-adk' {
  export function run_agent(agentOrApp: any, input: any): Promise<any>;
  export function runAgent(agentOrApp: any, input: any): Promise<any>;
  export const context_agent: any;
  const _default: any;
  export default _default;
}

declare module 'node-fetch' {
  const fetch: typeof globalThis.fetch;
  export default fetch;
}
