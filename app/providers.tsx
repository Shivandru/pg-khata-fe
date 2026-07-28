"use client";

import { StoreProvider } from "@/lib/store";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider>
      {/* <SidebarProvider> */}
        {/* <AppSidebar /> */}
        {/* <SidebarInset> */}
          {/* <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
          </header> */}
          {/* <main className="flex-1 overflow-auto p-6"> */}
            {children}
          {/* </main> */}
        {/* </SidebarInset> */}
      {/* </SidebarProvider> */}
    </StoreProvider>
  );
}
