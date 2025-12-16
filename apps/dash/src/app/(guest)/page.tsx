import Link from "next/link";

const HomePage = () => {
  return (
    <main className="flex flex-col gap-4 py-32">
      <h1 className="font-jetbrains font-semibold text-xl">LOGR</h1>
      <p className="text-muted-foreground text-sm">
        Logr is an API logging and observability tool for developers. Capture,
        view, and analyze your API requests and responses in real time.
      </p>

      <Link
        className="text-primary text-sm transition-all duration-200 hover:underline hover:underline-offset-2"
        href={"/sign-in"}
      >
        Sign in to continue
      </Link>
    </main>
  );
};

export default HomePage;
