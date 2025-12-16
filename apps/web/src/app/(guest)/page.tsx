import { OauthSignInLink } from "@/components/auth/oauth";

const GuestPage = () => {
  return (
    <main className="flex flex-col items-start gap-4 py-32">
      <h1 className="font-jetbrains font-semibold">LOGR</h1>
      <p className="text-muted-foreground text-sm">
        Logr is an API logging and observability tool for developers. Capture,
        view, and analyze your API requests and responses in real time.
      </p>

      <OauthSignInLink />
    </main>
  );
};

export default GuestPage;
