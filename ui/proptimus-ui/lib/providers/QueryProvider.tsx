"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";

type Props = Readonly<{
  children: React.ReactNode;
}>;

export default function QueryProvider({ children }: Props) {
  const [client] = useState(
    () =>
      new QueryClient({
        
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={client}>
      <ReactQueryDevtools initialIsOpen={false} />

      {children}
    </QueryClientProvider>
  );
}
