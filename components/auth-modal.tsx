// components/auth-modal.tsx
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Modal, Button, Input } from "@/components/ui";
import { IconGoogle } from "@/components/icons";

export function AuthModal({
  open,
  onClose,
  reason,
}: {
  open: boolean;
  onClose: () => void;
  reason?: string;
}) {
  const [showEmail, setShowEmail] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCredentials(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (res?.error) {
      setError("Email ou mot de passe incorrect");
      return;
    }
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Connexion requise">
      <p className="mb-5 text-sm text-mist">
        {reason ?? "Cree un compte ou connecte-toi pour continuer."}
      </p>

      <Button
        type="button"
        variant="secondary"
        className="w-full !bg-paper !text-ink hover:!bg-white"
        icon={<IconGoogle size={18} />}
        onClick={() => signIn("google")}
      >
        Continuer avec Google
      </Button>

      {!showEmail ? (
        <button
          type="button"
          onClick={() => setShowEmail(true)}
          className="mt-4 w-full text-center text-sm text-mist underline decoration-line underline-offset-4 hover:text-paper"
        >
          Utiliser un email a la place
        </button>
      ) : (
        <form onSubmit={handleCredentials} className="mt-5 flex flex-col gap-3">
          <Input
            label="Email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            label="Mot de passe"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <p className="text-xs text-alert-bright">{error}</p>}
          <Button type="submit" loading={loading} className="mt-1">
            Se connecter
          </Button>
        </form>
      )}

      <p className="mt-5 text-center text-xs text-mist-dim">
        Pas encore de compte ?{" "}
        <Link href="/register" onClick={onClose} className="text-brass hover:text-brass-bright">
          Inscris-toi
        </Link>
      </p>
    </Modal>
  );
}
