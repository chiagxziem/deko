"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { cancelToastEl } from "../ui/toaster";

const SignOut = () => {
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            toast.success("Logged out successfully", cancelToastEl);
            router.push("/sign-in");
          },
          onError: (ctx) => {
            toast.error(ctx.error.message, cancelToastEl);
          },
        },
      });
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.error(error);
      }
    }
  };

  return (
    <Button className="px-0" onClick={handleSignOut} variant="link">
      Sign out
    </Button>
  );
};

export default SignOut;
