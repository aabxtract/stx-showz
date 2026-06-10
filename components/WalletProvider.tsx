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

let _userSession: UserSession | null = null;
function getUserSession(): UserSession | null {
  if (typeof window === "undefined") return null;
  if (!_userSession) {
    const appConfig = new AppConfig(["store_write"]);
    _userSession = new UserSession({ appConfig });
  }
  return _userSession;
}

const WalletContext = createContext<WalletState | undefined>(undefined);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [network, setNetwork] = useState<Network>("testnet");

  const refreshFromSession = useCallback(() => {
    const session = getUserSession();
    if (!session) return;
    try {
      if (session.isUserSignedIn()) {
        const data = session.loadUserData();
        const addr =
          network === "mainnet"
            ? data.profile?.stxAddress?.mainnet
            : data.profile?.stxAddress?.testnet;
        setAddress(addr ?? null);
      } else {
        setAddress(null);
      }
    } catch (err) {
      console.warn("Wallet session read failed:", err);
      setAddress(null);
    }
  }, [network]);

  useEffect(() => {
    const session = getUserSession();
    if (!session) return;
    try {
      if (session.isSignInPending()) {
        session.handlePendingSignIn().then(() => refreshFromSession());
      } else {
        refreshFromSession();
      }
    } catch (err) {
      console.warn("Wallet init failed:", err);
    }
  }, [refreshFromSession]);

  const connect = useCallback(() => {
    const session = getUserSession();
    if (!session) return;
    try {
      showConnect({
        appDetails: {
          name: "Veritix",
          icon: `${window.location.origin}/favicon.png`,
        },
        redirectTo: "/",
        userSession: session,
        onFinish: () => refreshFromSession(),
        onCancel: () => {},
      });
    } catch (err) {
      console.error("showConnect failed:", err);
      alert(
        "Could not open the wallet connect dialog. Make sure a Stacks wallet (Leather or Xverse) is installed, then refresh and try again."
      );
    }
  }, [refreshFromSession]);

  const disconnect = useCallback(() => {
    const session = getUserSession();
    try {
      session?.signUserOut();
    } catch (err) {
      console.warn("Sign out failed:", err);
    }
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
