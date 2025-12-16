"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";
import { env } from "@/lib/env";
import { Button } from "../ui/button";
import { cancelToastEl } from "../ui/toaster";

export const Oauth = () => {
  const [loadingProvider, setLoadingProvider] = useState<
    "github" | "google" | null
  >(null);

  const handleOauthSignIn = async (provider: "github" | "google") => {
    console.log("signing in now...");

    try {
      await authClient.signIn.social(
        {
          provider,
          callbackURL: `${env.NEXT_PUBLIC_BASE_URL}/dash`,
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
  );
};

export const OauthSignInLink = () => {
  return (
    <Button
      className={"px-0"}
      nativeButton={false}
      render={<Link href={"/sign-in"} />}
      variant="link"
    >
      Sign in to continue
    </Button>
  );
};
