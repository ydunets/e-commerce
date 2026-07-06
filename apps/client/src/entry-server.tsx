import {
  createRequestHandler,
  RouterServer,
  renderRouterToStream,
} from '@tanstack/react-router/ssr/server';
import { createRouter, type RouterAssets } from './router';

export interface RenderOptions {
  request: Request;
  assets: RouterAssets;
}

export function render({ request, assets }: RenderOptions): Promise<Response> {
  const handler = createRequestHandler({
    request,
    createRouter: () => createRouter(assets),
  });

  return handler(({ request: req, responseHeaders, router }) =>
    renderRouterToStream({
      request: req,
      responseHeaders,
      router,
      children: <RouterServer router={router} />,
    }),
  );
}
