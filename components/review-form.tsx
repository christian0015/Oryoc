// components/review-form.tsx
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import type { TrustScores } from "@/types";
import { createReview, getReviewsForTarget, type ReviewWithAuthor } from "@/lib/actions/reviews";
import { useAuthGatedAction } from "@/lib/hooks";
import { Textarea, Button, EmptyState } from "@/components/ui";
import { IconReliability, IconRespect, IconSocial, IconUser } from "@/components/icons";

const axes: { key: keyof TrustScores; label: string; Icon: typeof IconReliability }[] = [
  { key: "reliability", label: "Fiabilite", Icon: IconReliability },
  { key: "respect", label: "Respect", Icon: IconRespect },
  { key: "social", label: "Sociabilite", Icon: IconSocial },
];

function DotPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={`h-3 w-3 rounded-full border transition-colors ${
            n <= value ? "border-brass bg-brass" : "border-line bg-transparent"
          }`}
          aria-label={`${n} sur 5`}
        />
      ))}
    </div>
  );
}

export function ReviewForm({
  targetType,
  targetId,
  onSubmitted,
}: {
  targetType: "profile" | "listing";
  targetId: string;
  onSubmitted?: () => void;
}) {
  const [scores, setScores] = useState<TrustScores>({ reliability: 5, respect: 5, social: 5 });
  const [comment, setComment] = useState("");
  const [done, setDone] = useState(false);
  const { run, loading, error } = useAuthGatedAction(createReview);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await run({ targetType, targetId, scores, comment });
    if (res) {
      setDone(true);
      onSubmitted?.();
    }
  }

  if (done) {
    return <p className="text-sm text-zellige-bright">Merci pour ton avis.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 rounded-[var(--radius-card)] border border-line bg-surface p-5">
      {axes.map(({ key, label, Icon }) => (
        <div key={key} className="flex items-center justify-between">
          <span className="inline-flex items-center gap-2 text-sm text-paper">
            <Icon size={15} className="text-zellige-bright" /> {label}
          </span>
          <DotPicker value={scores[key]} onChange={(v) => setScores({ ...scores, [key]: v })} />
        </div>
      ))}
      <Textarea
        label="Commentaire (optionnel)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Comment s'est passee l'experience ?"
      />
      {error && <p className="text-xs text-alert-bright">{error}</p>}
      <Button type="submit" loading={loading} size="sm" className="self-start">
        Publier l&apos;avis
      </Button>
    </form>
  );
}

export function ReviewsSection({ targetType, targetId }: { targetType: "profile" | "listing"; targetId: string }) {
  const [reviews, setReviews] = useState<ReviewWithAuthor[] | null>(null);
  const [showForm, setShowForm] = useState(false);

  async function load() {
    const res = await getReviewsForTarget(targetType, targetId);
    if (res.ok) setReviews(res.data);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetType, targetId]);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-xl italic text-paper">
          Avis {reviews ? `(${reviews.length})` : ""}
        </h2>
        {!showForm && (
          <Button size="sm" variant="secondary" onClick={() => setShowForm(true)}>
            Laisser un avis
          </Button>
        )}
      </div>

      {showForm && (
        <div className="mb-6">
          <ReviewForm
            targetType={targetType}
            targetId={targetId}
            onSubmitted={() => {
              setShowForm(false);
              load();
            }}
          />
        </div>
      )}

      {reviews === null ? null : reviews.length === 0 ? (
        <EmptyState title="Pas encore d'avis" description="Sois le premier a partager ton experience." />
      ) : (
        <div className="flex flex-col gap-4">
          {reviews.map((r) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-[var(--radius-card)] border border-line bg-surface p-4"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-line bg-surface-raised text-mist">
                  {r.author.avatarUrl ? (
                    <Image src={r.author.avatarUrl} alt={r.author.name} width={36} height={36} className="h-full w-full object-cover" />
                  ) : (
                    <IconUser size={15} />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-paper">{r.author.name}</p>
                  <p className="text-xs text-mist-dim">{new Date(r.createdAt).toLocaleDateString("fr-FR")}</p>
                </div>
              </div>
              <div className="mt-3 flex gap-4 text-xs text-mist">
                {axes.map(({ key, Icon }) => (
                  <span key={key} className="inline-flex items-center gap-1">
                    <Icon size={13} className="text-zellige-bright" /> {r.scores[key]}/5
                  </span>
                ))}
              </div>
              {r.comment && <p className="mt-3 text-sm text-mist">{r.comment}</p>}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
