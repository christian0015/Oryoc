// app/(auth)/register/page.tsx
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { registerUser } from "@/lib/actions/auth";
import { Button, Input, Select } from "@/components/ui";
import { IconGoogle } from "@/components/icons";

const roles: { value: string; label: string }[] = [
  { value: "tenant", label: "Locataire" },
  { value: "owner", label: "Proprietaire" },
  { value: "agency", label: "Agence" },
  { value: "broker", label: "Demarcheur" },
  { value: "recurring_landlord", label: "Bailleur recurrent" },
];

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("tenant");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setFieldErrors({});

    const res = await registerUser({ name, email, password, role });
    if (!res.ok) {
      setLoading(false);
      setError(res.message);
      setFieldErrors(res.fieldErrors ?? {});
      return;
    }

    const signInRes = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (signInRes?.error) {
      router.push("/login");
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-6 py-16">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-sm"
      >
        <p className="mb-2 text-xs uppercase tracking-[0.2em] text-mist-dim">ORYOC</p>
        <h1 className="font-display text-4xl italic text-paper">Rejoins ORYOC</h1>
        <p className="mt-3 text-sm text-mist">
          Un compte est necessaire pour publier, contacter, ou laisser un avis.
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

        <div className="my-6 flex items-center gap-3 text-xs text-mist-dim">
          <span className="h-px flex-1 bg-line" />
          ou avec un email
          <span className="h-px flex-1 bg-line" />
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Nom complet"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={fieldErrors.name?.[0]}
          />
          <Input
            label="Email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={fieldErrors.email?.[0]}
          />
          <Input
            label="Mot de passe"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            hint="8 caracteres minimum"
            error={fieldErrors.password?.[0]}
          />
          <Select label="Je suis..." value={role} onChange={(e) => setRole(e.target.value)}>
            {roles.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </Select>
          {error && <p className="text-xs text-alert-bright">{error}</p>}
          <Button type="submit" loading={loading} className="mt-1">
            Creer mon compte
          </Button>
        </form>

        <p className="mt-8 text-sm text-mist">
          Deja un compte ?{" "}
          <Link href="/login" className="text-brass hover:text-brass-bright">
            Se connecter
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
