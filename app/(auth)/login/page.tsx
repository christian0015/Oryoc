// app/(auth)/login/page.tsx
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button, Input } from "@/components/ui";
import { IconGoogle, IconCertified, IconPin, IconReliability } from "@/components/icons";

export default function LoginPage() {
  const router = useRouter();
  const [showEmail, setShowEmail] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (res?.error) {
      setError("Email ou mot de passe incorrect");
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <div className="grid min-h-[calc(100vh-4rem)] md:grid-cols-2">
      <div className="flex items-center justify-center px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-sm"
        >
          <p className="mb-2 text-xs uppercase tracking-[0.2em] text-mist-dim">ORYOC</p>
          <h1 className="font-display text-4xl italic text-paper">Bon retour</h1>
          <p className="mt-3 text-sm text-mist">
            Connecte-toi pour gerer tes annonces, tes favoris et tes avis.
          </p>

          <div className="mt-8">
            <Button
              type="button"
              variant="secondary"
              className="w-full !bg-paper !text-ink hover:!bg-white"
              icon={<IconGoogle size={18} />}
              onClick={() => signIn("google", { callbackUrl: "/" })}
            >
              Continuer avec Google
            </Button>
          </div>

          {!showEmail ? (
            <button
              type="button"
              onClick={() => setShowEmail(true)}
              className="mt-4 w-full text-center text-sm text-mist underline decoration-line underline-offset-4 hover:text-paper"
            >
              Utiliser un email a la place
            </button>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
              <Input
                label="Email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="toi@exemple.com"
              />
              <Input
                label="Mot de passe"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {error && <p className="text-xs text-alert-bright">{error}</p>}
              <Button type="submit" loading={loading}>
                Se connecter
              </Button>
            </form>
          )}

          <p className="mt-8 text-sm text-mist">
            Pas encore de compte ?{" "}
            <Link href="/register" className="text-brass hover:text-brass-bright">
              Inscris-toi
            </Link>
          </p>
        </motion.div>
      </div>

      <div className="relative hidden overflow-hidden border-l border-line-soft bg-surface md:block">
        <div className="absolute inset-0 flex flex-col justify-between p-12">
          <div className="flex items-center gap-2 text-mist">
            <IconCertified size={18} className="text-brass" />
            <span className="text-sm">Profils et annonces verifies</span>
          </div>
          <div>
            <p className="font-display text-3xl italic leading-snug text-paper">
              La reference de confiance pour la location longue duree au Maroc.
            </p>
            <div className="mt-6 flex flex-wrap gap-4 text-sm text-mist">
              <span className="inline-flex items-center gap-1.5">
                <IconPin size={15} className="text-zellige-bright" /> Casablanca, Rabat, Marrakech
              </span>
              <span className="inline-flex items-center gap-1.5">
                <IconReliability size={15} className="text-zellige-bright" /> Note de fiabilite publique
              </span>
            </div>
          </div>
        </div>
        <DecorativeLines />
      </div>
    </div>
  );
}

function DecorativeLines() {
  return (
    <svg
      className="pointer-events-none absolute -right-10 -top-10 opacity-40"
      width="360"
      height="360"
      viewBox="0 0 360 360"
      fill="none"
    >
      <motion.circle
        cx="180"
        cy="180"
        r="120"
        stroke="var(--color-brass-dim)"
        strokeWidth="1"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 2, ease: "easeInOut" }}
      />
      <motion.circle
        cx="180"
        cy="180"
        r="150"
        stroke="var(--color-zellige)"
        strokeWidth="1"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 2.4, ease: "easeInOut", delay: 0.2 }}
      />
    </svg>
  );
}
