"use client";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

const OWNER_ONLY_PATHS = ["/", "/rooms", "/guest", "/payments"];
const GUEST_DEFAULT = "/tenancy";

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.replace("/signup");
      return;
    }

    const role = session?.user?.role;

    if (role === null || role === undefined) {
      router.replace("/onboarding");
      return;
    }

    if (role === "guest") {
      const isOwnerOnlyPath = OWNER_ONLY_PATHS.some(
        (p) => p === "/" ? pathname === "/" : pathname.startsWith(p)
      );
      if (isOwnerOnlyPath) {
        router.replace(GUEST_DEFAULT);
      }
    }
  }, [status, session, pathname, router]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
        </header>
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}