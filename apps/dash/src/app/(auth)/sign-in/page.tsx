import Link from "next/link";

import { Button } from "@/components/ui/button";

const SignInPage = () => {
  return (
    <main className="flex flex-col gap-8 px-4">
      <div className="flex flex-col items-center gap-1.5 text-center">
        <h1 className="font-jetbrains font-semibold">
          SIGN IN TO{" "}
          <Link
            className="text-primary transition-all duration-200 hover:underline hover:underline-offset-2"
            href={"/"}
          >
            LOGR
          </Link>
        </h1>
        <p className="text-muted-foreground text-sm">
          Welcome back! Please sign in to your account.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Button size={"lg"} variant={"outline"}>
          Continue with GitHub
        </Button>
        <Button size={"lg"} variant={"outline"}>
          Continue with Google
        </Button>
      </div>
    </main>
  );
};

export default SignInPage;
