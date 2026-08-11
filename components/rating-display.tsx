// components/rating-display.tsx
import type { TrustScores } from "@/types";
import { IconReliability, IconRespect, IconSocial } from "@/components/icons";

const axes = [
  { key: "reliability" as const, label: "Fiabilite", Icon: IconReliability },
  { key: "respect" as const, label: "Respect", Icon: IconRespect },
  { key: "social" as const, label: "Sociabilite", Icon: IconSocial },
];

export function RatingDisplay({
  scores,
  compact = false,
}: {
  scores: TrustScores;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <div className="flex items-center gap-4 text-sm text-mist">
        {axes.map(({ key, Icon }) => (
          <span key={key} className="inline-flex items-center gap-1.5" title={key}>
            <Icon size={14} className="text-zellige-bright" />
            {scores[key].toFixed(1)}
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-4">
      {axes.map(({ key, label, Icon }) => (
        <div key={key} className="rounded-[var(--radius-control)] border border-line bg-surface-raised p-3">
          <div className="mb-2 flex items-center gap-2 text-mist">
            <Icon size={16} className="text-zellige-bright" />
            <span className="text-xs">{label}</span>
          </div>
          <p className="font-display text-2xl italic text-paper">{scores[key].toFixed(1)}</p>
          <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-ink">
            <div
              className="h-full rounded-full bg-zellige-bright"
              style={{ width: `${Math.min(100, (scores[key] / 5) * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
