export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen w-full bg-gradient-to-br from-background via-background to-primary/5">
      {children}
    </main>
  );
}