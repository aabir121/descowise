import { handleDesco } from '../../lib/desco/handler';
export const onRequest = (context: { request: Request; env: { DESCO_SESSION_KEY: string } }) => handleDesco(context.request, context.env);
