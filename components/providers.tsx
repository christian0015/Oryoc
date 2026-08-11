// components/providers.tsx
"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { SessionProvider } from "next-auth/react";
import { AuthModal } from "@/components/auth-modal";

interface AuthModalContextValue {
  openAuthModal: (reason?: string) => void;
  closeAuthModal: () => void;
}

const AuthModalContext = createContext<AuthModalContextValue | null>(null);

/**
 * Server actions return a typed `AUTH_REQUIRED` error instead of throwing
 * (see product spec §5.0). Any client component can call `useAuthModal()`
 * to pop this modal instead of a hard redirect that would break the
 * user's browsing context.
 */
export function useAuthModal() {
  const ctx = useContext(AuthModalContext);
  if (!ctx) throw new Error("useAuthModal must be used within <Providers>");
  return ctx;
}

export function Providers({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState<string | undefined>();

  const openAuthModal = useCallback((r?: string) => {
    setReason(r);
    setIsOpen(true);
  }, []);
  const closeAuthModal = useCallback(() => setIsOpen(false), []);

  const value = useMemo(() => ({ openAuthModal, closeAuthModal }), [openAuthModal, closeAuthModal]);

  return (
    <SessionProvider>
      <AuthModalContext.Provider value={value}>
        {children}
        <AuthModal open={isOpen} onClose={closeAuthModal} reason={reason} />
      </AuthModalContext.Provider>
    </SessionProvider>
  );
}
