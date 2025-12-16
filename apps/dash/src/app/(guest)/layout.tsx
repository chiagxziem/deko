const GuestLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return (
    <div className="mx-auto flex max-w-lg flex-col justify-center px-4">
      {children}
    </div>
  );
};

export default GuestLayout;
