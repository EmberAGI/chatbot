"use client";

import React from "react";
import "@rainbow-me/rainbowkit/styles.css";
import {
  darkTheme,
  getDefaultConfig,
  RainbowKitProvider,
} from "@rainbow-me/rainbowkit";
import {
  cookieStorage,
  cookieToInitialState,
  createStorage,
  WagmiProvider,
} from "wagmi";
import { mainnet, polygon, optimism, arbitrum, base } from "wagmi/chains";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";
import { Session } from "next-auth";
import { RainbowKitSiweNextAuthProvider } from "@rainbow-me/rainbowkit-siwe-next-auth";

export function ProviderWrapper({session, children}: {session: Session | null, children: React.ReactNode}) {
  const config = getDefaultConfig({
    appName: "My RainbowKit App",
    projectId: "4b49e5e63b9f6253943b470873b47208",
    chains: [mainnet, polygon, optimism, arbitrum, base],
    ssr: true, // If your dApp uses server side rendering (SSR)
    storage: createStorage({ storage: cookieStorage }),
  });

  const queryClient = new QueryClient();
  const cookie = cookieStorage.getItem("wagmi.storage") || "";
  const initialState = cookieToInitialState(config, cookie);

  return (
    <>
      <WagmiProvider
        config={config}
        reconnectOnMount={true}
        initialState={initialState}
      >
        <SessionProvider refetchInterval={0} session={session}>
          <QueryClientProvider client={queryClient}>
            <RainbowKitSiweNextAuthProvider>
              {" "}
              <RainbowKitProvider
                theme={darkTheme({
                  accentColor: "#FF7224",
                  accentColorForeground: "#fff",
                })}
              >
               {children}
              </RainbowKitProvider>
            </RainbowKitSiweNextAuthProvider>
          </QueryClientProvider>
        </SessionProvider>
      </WagmiProvider>
    </>
  );
}
