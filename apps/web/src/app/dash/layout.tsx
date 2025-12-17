import { redirect } from "next/navigation";

import { getUser } from "@/server/user";

const DashLayout = async ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  const user = await getUser();

  if (!user) {
    redirect("/sign-in");
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col justify-center px-4">
      {children}
    </div>
  );
};

export default DashLayout;
