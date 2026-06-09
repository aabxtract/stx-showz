"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { AppConfig, UserSession, showConnect } from "@stacks/connect";

type Network = "mainnet" | "testnet";

interface WalletState {
  isConnected: boolean;
  address: string | null;
  network: Network;
  connect: () => void;
  disconnect: () => void;
  setNetwork: (n: Network) => void;
}

const appConfig = new AppConfig(["store_write"]);
export const userSession = new UserSession({ appConfig });

const WalletContext = createContext<WalletState | undefined>(undefined);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [network, setNetwork] = useState<Network>("testnet");

  const refreshFromSession = useCallback(() => {
    if (typeof window === "undefined") return;
    if (userSession.isUserSignedIn()) {
      const data = userSession.loadUserData();
      const addr =
        network === "mainnet"
          ? data.profile?.stxAddress?.mainnet
          : data.profile?.stxAddress?.testnet;
      setAddress(addr ?? null);
    } else {
      setAddress(null);
    }
  }, [network]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (userSession.isSignInPending()) {
      userSession.handlePendingSignIn().then(() => refreshFromSession());
    } else {
      refreshFromSession();
    }
  }, [refreshFromSession]);

  const connect = useCallback(() => {
    showConnect({
      appDetails: {
        name: "STX Showz",
        icon:
          typeof window !== "undefined"
            ? `${window.location.origin}/favicon.ico`
            : "",
      },
      redirectTo: "/",
      userSession,
      onFinish: () => refreshFromSession(),
      onCancel: () => {},
    });
  }, [refreshFromSession]);

  const disconnect = useCallback(() => {
    userSession.signUserOut();
    setAddress(null);
  }, []);

  return (
    <WalletContext.Provider
      value={{
        isConnected: !!address,
        address,
        network,
        connect,
        disconnect,
        setNetwork,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within WalletProvider");
  return ctx;
}

export const shortAddress = (a: string | null | undefined) =>
  !a ? "" : `${a.slice(0, 5)}…${a.slice(-4)}`;
