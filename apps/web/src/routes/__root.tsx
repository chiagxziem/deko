import type { QueryClient } from "@tanstack/react-query";
import {
  createRootRouteWithContext,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

import { Toaster } from "@/components/ui/toaster";
import { fontsHref } from "@/lib/utils";
import appCss from "@/styles/app.css?url";
import fontsCss from "@/styles/fonts.css?url";

export interface AppRouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<AppRouterContext>()({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content:
          "width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-content",
      },
      {
        title: "Logr",
        description: "Logr - An API Observability tool for developers.",
      },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "stylesheet", href: fontsCss },
      ...fontsHref.map((href) => ({
        rel: "preload",
        href,
        as: "font",
        type: "font/woff2",
        crossOrigin: "anonymous" as const,
      })),
    ],
  }),

  shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html className="dark" lang="en">
      <head>
        <HeadContent />
      </head>

      <body className="font-inter">
        <div className="relative isolate min-h-svh bg-background text-foreground antialiased">
          {children}
        </div>
        <Toaster />
        <Scripts />
      </body>
    </html>
  );
}
