type Handler = (url: string, init?: RequestInit) => { status: number; body: unknown } | undefined;

const originalFetch = globalThis.fetch;
let handlers: Handler[] = [];

export function mockFetch(handler: Handler): void {
  handlers.push(handler);
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input.toString();
    for (const h of handlers) {
      const res = h(url, init);
      if (res) {
        return new Response(JSON.stringify(res.body), {
          status: res.status,
          headers: { "content-type": "application/json" },
        });
      }
    }
    throw new Error(`mockFetch: no handler matched ${url}`);
  }) as typeof fetch;
}

export function restoreFetch(): void {
  handlers = [];
  globalThis.fetch = originalFetch;
}
