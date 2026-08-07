"use client";

import { useState } from "react";
import { StoreProvider } from "@/lib/store";
import { SessionProvider } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: false,
          },
        },
      })
  );

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <StoreProvider>
          {children}
        </StoreProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}
