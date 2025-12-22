import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cancelToastEl } from "@/components/ui/toaster";
import { authClient } from "@/lib/auth-client";
import { env } from "@/lib/env";

export const Route = createFileRoute("/_auth/sign-in")({
  component: SignInPage,
});

function SignInPage() {
  const [loadingProvider, setLoadingProvider] = useState<
    "github" | "google" | null
  >(null);

  const handleOauthSignIn = async (provider: "github" | "google") => {
    try {
      await authClient.signIn.social(
        {
          provider,
          callbackURL: `${env.VITE_BASE_URL}/dash`,
        },
        {
          credentials: "include",
          onRequest: () => {
            setLoadingProvider(provider);
          },
          onSuccess: () => {
            setLoadingProvider(null);
          },
          onError: (ctx) => {
            setLoadingProvider(null);
            toast.error(ctx.error.message, cancelToastEl);
          },
        },
      );
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.error(error);
      }
    } finally {
      setLoadingProvider(null);
    }
  };

  const providers = [
    {
      id: "github",
      label: "Continue with GitHub",
    },
    {
      id: "google",
      label: "Continue with Google",
    },
  ] as const;

  return (
    <main className="flex flex-col gap-8 px-4">
      <div className="flex flex-col items-center gap-1.5 text-center">
        <h1 className="font-jetbrains font-semibold">
          SIGN IN TO{" "}
          <Link
            className="text-primary underline-offset-4 transition-all duration-200 hover:underline"
            to={"/"}
          >
            LOGR
          </Link>
        </h1>
        <p className="text-muted-foreground text-sm">
          Welcome back! Please sign in to your account.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {providers.map((provider) => (
          <Button
            disabled={loadingProvider !== null}
            key={provider.id}
            onClick={() => {
              handleOauthSignIn(provider.id);
            }}
            size={"lg"}
            type="button"
            variant={"outline"}
          >
            {loadingProvider === provider.id ? "Signing in..." : provider.label}
          </Button>
        ))}
      </div>
    </main>
  );
}
