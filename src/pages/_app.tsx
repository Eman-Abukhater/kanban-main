import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { useEffect, useState } from "react";

import { KanbanContextComponent } from "../context/KanbanContextComponent";
import {
  Hydrate,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import OnlineUsersButton from "@/components/layout/OnlineUsersButton";

export default function App({ Component, pageProps }: AppProps) {
  const [showChild, setShowChild] = useState(false);

  useEffect(() => {
    setShowChild(true);
  }, []);

  if (!showChild) {
    return null;
  }

  // React Query
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <Hydrate state={pageProps.dehydratedState}>
        <KanbanContextComponent>
          <Component {...pageProps} />
          <OnlineUsersButton />
        </KanbanContextComponent>
      </Hydrate>
    </QueryClientProvider>
  );
}
