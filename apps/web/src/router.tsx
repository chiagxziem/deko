import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";

import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        refetchInterval: 15_000,
      },
    },
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreload: "render",
    defaultPreloadDelay: 0,
    defaultPreloadStaleTime: 30_000,
    notFoundMode: "root",
  });
  setupRouterSsrQueryIntegration({
    router,
    queryClient,
  });

  return router;
};
