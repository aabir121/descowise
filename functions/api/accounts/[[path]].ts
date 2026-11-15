import { handleDesco } from '../../lib/desco/handler';

export const onRequest = (context: { request: Request; env: { DESCO_SESSION_KEY: string } }) => {
  const url = new URL(context.request.url);
  if (!/^\/api\/accounts\/[^/]+\/transactions(?:\/|$)/.test(url.pathname)) return new Response('Not found', { status: 404 });
  url.pathname = url.pathname.replace(/^\/api\/accounts/, '/api/desco/accounts');
  return handleDesco(new Request(url.toString(), context.request), context.env);
};
