import type { QueryClient } from "@tanstack/react-query";
import {
  createRootRouteWithContext,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

import { TooltipProvider } from "@/components/ui/tooltip";

import appCss from "@/styles/app.css?url";

export interface AppRouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<AppRouterContext>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content:
          "width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-content",
      },
      {
        title: "Deko",
        description: "Deko - An API Observability tool for developers.",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html className="dark" lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>

      <body className="font-sans">
        <TooltipProvider>
          <div className="relative isolate bg-background text-foreground antialiased selection:bg-muted-foreground selection:text-muted">
            {children}
          </div>
        </TooltipProvider>
        <Scripts />
      </body>
    </html>
  );
}
