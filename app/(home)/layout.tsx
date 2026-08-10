"use client";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { useOnboardingStatus } from "@/hooks/useOnboardingStatus";

const OWNER_ONLY_PATHS = ["/", "/dashboard", "/rooms", "/guest", "/payments"];
const GUEST_DEFAULT = "/tenancy";

/** Covers the entire viewport — renders BEFORE the sidebar mounts */
function FullPageSpinner() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    </div>
  );
}

export default function HomeLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const { isChecking: onboardingChecking, isComplete: onboardingComplete } = useOnboardingStatus();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") { router.replace("/signup"); return; }

    const role = session?.user?.role;
    if (role === null || role === undefined) { router.replace("/onboarding"); return; }

    if (!onboardingChecking && !onboardingComplete) {
      const target = role === "owner" ? "/rooms" : "/tenancy";
      if (pathname !== target) router.replace(target);
      return;
    }

    if (role === "guest") {
      const blocked = OWNER_ONLY_PATHS.some(
        (p) => p === "/" ? pathname === "/" : pathname.startsWith(p)
      );
      if (blocked) router.replace(GUEST_DEFAULT);
    }
  }, [status, session, pathname, router, onboardingChecking, onboardingComplete]);

  // Block render until we know the session — prevents any flash
  if (status === "loading" || !session || !session.user?.role || onboardingChecking) return <FullPageSpinner />;

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
        </header>
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
