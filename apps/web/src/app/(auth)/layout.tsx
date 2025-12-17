import { redirect } from "next/navigation";

import { getUser } from "@/server/user";

const AuthLayout = async ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  const user = await getUser();

  if (user) {
    redirect("/dash");
  }

  return (
    <div className="mx-auto flex min-h-svh max-w-lg flex-col justify-center px-4">
      {children}
    </div>
  );
};

export default AuthLayout;
