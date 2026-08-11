// components/compensation-form.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { createCompensationRequest } from "@/lib/actions/compensation";
import { Input, Textarea, Button } from "@/components/ui";

export function CompensationForm() {
  const router = useRouter();
  const [type, setType] = useState<"trip_offer" | "transport_request">("trip_offer");
  const [fromCity, setFromCity] = useState("");
  const [fromCountry, setFromCountry] = useState("");
  const [toCity, setToCity] = useState("");
  const [toCountry, setToCountry] = useState("");
  const [travelDate, setTravelDate] = useState("");
  const [availableWeightKg, setAvailableWeightKg] = useState("");
  const [packageDescription, setPackageDescription] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [compensationOffer, setCompensationOffer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const res = await createCompensationRequest({
      type,
      fromCity,
      fromCountry,
      toCity,
      toCountry,
      travelDate: new Date(travelDate).toISOString(),
      availableWeightKg: type === "trip_offer" && availableWeightKg ? Number(availableWeightKg) : undefined,
      packageDescription: type === "transport_request" ? packageDescription : undefined,
      weightKg: type === "transport_request" && weightKg ? Number(weightKg) : undefined,
      compensationOffer: compensationOffer || undefined,
    });

    setSubmitting(false);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    router.push("/compensation");
    router.refresh();
  }

  return (
    <motion.form initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex gap-2">
        {(["trip_offer", "transport_request"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={`flex-1 rounded-[var(--radius-control)] border px-4 py-3 text-sm transition-colors ${
              type === t ? "border-brass bg-brass text-ink" : "border-line bg-surface text-mist hover:text-paper"
            }`}
          >
            {t === "trip_offer" ? "Je propose un trajet" : "Je cherche du transport"}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input label="Ville de depart" required value={fromCity} onChange={(e) => setFromCity(e.target.value)} />
        <Input label="Pays de depart" required value={fromCountry} onChange={(e) => setFromCountry(e.target.value)} />
        <Input label="Ville d'arrivee" required value={toCity} onChange={(e) => setToCity(e.target.value)} />
        <Input label="Pays d'arrivee" required value={toCountry} onChange={(e) => setToCountry(e.target.value)} />
      </div>

      <Input label="Date du voyage" type="date" required value={travelDate} onChange={(e) => setTravelDate(e.target.value)} />

      {type === "trip_offer" ? (
        <Input
          label="Poids disponible (kg)"
          type="number"
          required
          value={availableWeightKg}
          onChange={(e) => setAvailableWeightKg(e.target.value)}
        />
      ) : (
        <>
          <Textarea
            label="Que dois-tu transporter ?"
            required
            value={packageDescription}
            onChange={(e) => setPackageDescription(e.target.value)}
          />
          <Input label="Poids estime (kg)" type="number" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} />
        </>
      )}

      <Input
        label="Compensation proposee (optionnel)"
        value={compensationOffer}
        onChange={(e) => setCompensationOffer(e.target.value)}
        placeholder="Frais de bagage rembourses, un cadeau..."
      />

      {error && <p className="text-sm text-alert-bright">{error}</p>}

      <Button type="submit" loading={submitting} size="lg" className="self-start">
        Publier
      </Button>
    </motion.form>
  );
}
