"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  AppConfig,
  UserSession,
  showConnect,
  openSignatureRequestPopup,
} from "@stacks/connect";

type Network = "mainnet" | "testnet";

export interface SessionUser {
  id: string;
  address: string;
  name: string | null;
  bio?: string | null;
  avatarUrl: string | null;
}

interface WalletState {
  isConnected: boolean;
  address: string | null;
  network: Network;
  connect: () => void;
  disconnect: () => void;
  setNetwork: (n: Network) => void;
  user: SessionUser | null;
  isAuthed: boolean;
  authLoading: boolean;
  signInWithServer: () => Promise<void>;
  refreshUser: () => Promise<void>;
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
  const [user, setUser] = useState<SessionUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

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

  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      if (!res.ok) {
        setUser(null);
        return;
      }
      const data = await res.json();
      setUser(data.user ?? null);
    } catch {
      setUser(null);
    } finally {
      setAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    const session = getUserSession();
    if (!session) {
      setAuthLoading(false);
      return;
    }
    try {
      if (session.isSignInPending()) {
        session.handlePendingSignIn().then(() => refreshFromSession());
      } else {
        refreshFromSession();
      }
    } catch (err) {
      console.warn("Wallet init failed:", err);
    }
    refreshUser();
  }, [refreshFromSession, refreshUser]);

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

  const signInWithServer = useCallback(async () => {
    if (!address) throw new Error("Connect wallet first");

    const nonceRes = await fetch("/api/auth/nonce", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address }),
    });
    if (!nonceRes.ok) throw new Error("Failed to get nonce");
    const { message, issuedAt } = (await nonceRes.json()) as {
      message: string;
      issuedAt: string;
    };

    const session = getUserSession();
    const signed = await new Promise<{ signature: string; publicKey: string }>(
      (resolve, reject) => {
        openSignatureRequestPopup({
          message,
          userSession: session ?? undefined,
          appDetails: {
            name: "Veritix",
            icon: `${window.location.origin}/favicon.png`,
          },
          onFinish: (data) =>
            resolve({ signature: data.signature, publicKey: data.publicKey }),
          onCancel: () => reject(new Error("User cancelled signature")),
        });
      },
    );

    const verifyRes = await fetch("/api/auth/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        address,
        publicKey: signed.publicKey,
        signature: signed.signature,
        issuedAt,
      }),
    });
    if (!verifyRes.ok) {
      const err = await verifyRes.json().catch(() => ({}));
      throw new Error(err.error || "Verification failed");
    }
    const data = await verifyRes.json();
    setUser(data.user);
  }, [address]);

  const disconnect = useCallback(async () => {
    const session = getUserSession();
    try {
      session?.signUserOut();
    } catch (err) {
      console.warn("Sign out failed:", err);
    }
    setAddress(null);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {}
    setUser(null);
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
        user,
        isAuthed: !!user,
        authLoading,
        signInWithServer,
        refreshUser,
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
