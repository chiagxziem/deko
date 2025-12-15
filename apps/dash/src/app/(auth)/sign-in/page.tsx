import { Button } from "@/components/ui/button";

const SignInPage = () => {
  return (
    <main className="flex flex-col gap-8">
      <div className="flex flex-col items-center gap-1.5 text-center">
        <h1 className="font-jetbrains font-semibold">SIGN IN TO LOGR</h1>
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
