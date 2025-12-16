import { cn } from "@/lib/utils";
import { inter, jetbrains } from "@/styles/fonts";
import "@/styles/globals.css";

import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Logr",
  description: "Logr - An API Observability tool for developers.",
};

const RootLayout = ({
  children,
}: Readonly<{
  children: ReactNode;
}>) => {
  return (
    <html className="" lang="en">
      <body className={cn(jetbrains.variable, inter.variable)}>
        <div className="relative isolate min-h-svh bg-background font-inter text-foreground antialiased">
          {children}
        </div>
      </body>
    </html>
  );
};

export default RootLayout;
