const AuthLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return (
    <div className="mx-auto flex min-h-svh max-w-lg flex-col justify-center px-4">
      {children}
    </div>
  );
};

export default AuthLayout;
