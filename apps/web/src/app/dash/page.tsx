import Link from "next/link";
import { redirect } from "next/navigation";

import SignOut from "@/components/auth/sign-out";
import { getUser } from "@/server/user";

const DashPage = async () => {
  const user = await getUser();

  if (!user) {
    redirect("/sign-in");
  }

  return (
    <main className="flex flex-col items-start gap-4 py-32">
      <div>
        <h1 className="font-jetbrains font-semibold">
          <Link
            className="text-primary underline-offset-4 transition-all duration-200 hover:underline"
            href={"/"}
          >
            LOGR
          </Link>{" "}
          DASHBOARD
        </h1>
        <p className="text-muted-foreground text-xs">{user.name}</p>
      </div>
      <p className="text-muted-foreground text-sm">
        This is the dashboard page for Logr. There will be pages for metrics,
        logs, alerts, and settings, for each project created. More coming soon!
      </p>

      <SignOut />
    </main>
  );
};

export default DashPage;
