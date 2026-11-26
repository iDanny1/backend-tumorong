import type { Router } from 'express';

// Exercise JSON routes in process, including Express route matching, without a TCP port.
export function routerRequest(router: Router, prefix: string) {
  return (input: string, init: RequestInit = {}): Promise<Response> => new Promise((resolve, reject) => {
    const url = new URL(input, 'http://localhost');
    const req: any = {
      method: init.method || 'GET', url: (url.pathname.slice(prefix.length) || '/') + url.search,
      originalUrl: url.pathname + url.search, baseUrl: prefix,
      headers: init.headers || {}, query: Object.fromEntries(url.searchParams),
      body: init.body ? JSON.parse(String(init.body)) : undefined,
    };
    let status = 200;
    const res: any = {
      status(code: number) { status = code; return res; },
      json(data: unknown) { resolve(new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } })); return res; },
    };
    router(req, res, (error?: unknown) => error ? reject(error) : resolve(new Response(null, { status: 404 })));
  });
}
