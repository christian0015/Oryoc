// components/icons.tsx
import type { SVGProps } from "react";

export interface IconProps extends SVGProps<SVGSVGElement> {
  size?: number;
}

function base(size = 20) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
}

/** A door-topped balcony rail, not a generic square. */
export function IconBalcony({ size, ...props }: IconProps) {
  return (
    <svg {...base(size)} stroke="currentColor" {...props}>
      <path d="M4 3v9h16V3" />
      <path d="M4 12v9M20 12v9" />
      <path d="M4 21h16" />
      <path d="M4 15h16M4 18h16" />
      <path d="M9 3v6M14 3v6" />
    </svg>
  );
}

/** Water waves inside a basin — a pool, not a droplet. */
export function IconPool({ size, ...props }: IconProps) {
  return (
    <svg {...base(size)} stroke="currentColor" {...props}>
      <rect x="3" y="5" width="18" height="10" rx="1.5" />
      <path d="M5 20c1 1 2 1 3 0s2-1 3 0 2 1 3 0 2-1 3 0 2 1 3 0" />
      <path d="M7 9h10" />
    </svg>
  );
}

/** A bed frame seen from the side — bedrooms/rooms. */
export function IconBed({ size, ...props }: IconProps) {
  return (
    <svg {...base(size)} stroke="currentColor" {...props}>
      <path d="M3 18v-6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M3 18v3M21 18v3" />
      <path d="M11 12h8a2 2 0 0 1 2 2v4H3v-4a2 2 0 0 1 2-2" />
      <circle cx="6" cy="9" r="1.4" />
    </svg>
  );
}

/** A showerhead over a tub — bathrooms. */
export function IconBath({ size, ...props }: IconProps) {
  return (
    <svg {...base(size)} stroke="currentColor" {...props}>
      <path d="M4 12h16v3a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5v-3Z" />
      <path d="M7 12V6a2 2 0 0 1 3.2-1.6" />
      <path d="M4 20v1M18 20v1" />
    </svg>
  );
}

/** Moroccan dirham-style coin with a horizontal bar — price. */
export function IconPrice({ size, ...props }: IconProps) {
  return (
    <svg {...base(size)} stroke="currentColor" {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9 9.5h5.5M9 14.5h5.5M11 7v10" />
    </svg>
  );
}

/** A ribbon seal — certification/trust, not a generic checkmark badge. */
export function IconCertified({ size, ...props }: IconProps) {
  return (
    <svg {...base(size)} stroke="currentColor" {...props}>
      <path d="M12 2 14.5 6l4.6.6-3.3 3.3.9 4.6L12 12.3 7.3 14.5l.9-4.6L4.9 6.6 9.5 6 12 2Z" />
      <path d="M9 15.5 8 22l4-2 4 2-1-6.5" />
      <path d="M9.5 12 11 13.5 14.5 10" />
    </svg>
  );
}

/** A map pin narrowed to a point — location. */
export function IconPin({ size, ...props }: IconProps) {
  return (
    <svg {...base(size)} stroke="currentColor" {...props}>
      <path d="M12 22s7-7.2 7-12.5A7 7 0 0 0 5 9.5C5 14.8 12 22 12 22Z" />
      <circle cx="12" cy="9.5" r="2.4" />
    </svg>
  );
}

export function IconSearch({ size, ...props }: IconProps) {
  return (
    <svg {...base(size)} stroke="currentColor" {...props}>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m20 20-4.6-4.6" />
    </svg>
  );
}

/** Three sliders at different heights — filters. */
export function IconFilters({ size, ...props }: IconProps) {
  return (
    <svg {...base(size)} stroke="currentColor" {...props}>
      <path d="M4 6h16M4 12h16M4 18h16" />
      <circle cx="8" cy="6" r="1.8" fill="currentColor" stroke="none" />
      <circle cx="16" cy="12" r="1.8" fill="currentColor" stroke="none" />
      <circle cx="10" cy="18" r="1.8" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** A torn calendar page with a ring — events. */
export function IconCalendar({ size, ...props }: IconProps) {
  return (
    <svg {...base(size)} stroke="currentColor" {...props}>
      <rect x="3.5" y="5" width="17" height="16" rx="2" />
      <path d="M3.5 10h17" />
      <path d="M8 3v4M16 3v4" />
      <circle cx="8" cy="14.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="14.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** A duffel/travel bag — compensation (cross-border transport). */
export function IconLuggage({ size, ...props }: IconProps) {
  return (
    <svg {...base(size)} stroke="currentColor" {...props}>
      <rect x="4" y="8" width="16" height="12" rx="2" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
      <path d="M4 13h16" />
      <path d="M10 16h4" />
    </svg>
  );
}

export function IconHeart({ size, filled, ...props }: IconProps & { filled?: boolean }) {
  return (
    <svg {...base(size)} stroke="currentColor" fill={filled ? "currentColor" : "none"} {...props}>
      <path d="M12 20.5s-7.5-4.7-9.6-9.4C1.1 8 2.5 4.8 5.7 4a5 5 0 0 1 6.3 2.4A5 5 0 0 1 18.3 4c3.2.8 4.6 4 3.3 7.1-2.1 4.7-9.6 9.4-9.6 9.4Z" />
    </svg>
  );
}

/** Three overlapping arcs — reliability score. */
export function IconReliability({ size, ...props }: IconProps) {
  return (
    <svg {...base(size)} stroke="currentColor" {...props}>
      <path d="M12 3a9 9 0 1 0 9 9" />
      <path d="M12 3v9l6.4 4.2" />
    </svg>
  );
}

/** Two facing hands — respect score. */
export function IconRespect({ size, ...props }: IconProps) {
  return (
    <svg {...base(size)} stroke="currentColor" {...props}>
      <path d="M3 14V7a2 2 0 0 1 2-2h1v11" />
      <path d="M21 14V7a2 2 0 0 0-2-2h-1v11" />
      <path d="M6 15c1.4 1.6 3 2.3 6 2.3s4.6-.7 6-2.3" />
      <path d="M6 15v3M18 15v3" />
    </svg>
  );
}

/** Linked circles — social score. */
export function IconSocial({ size, ...props }: IconProps) {
  return (
    <svg {...base(size)} stroke="currentColor" {...props}>
      <circle cx="7" cy="8" r="2.6" />
      <circle cx="17" cy="8" r="2.6" />
      <circle cx="12" cy="17" r="2.6" />
      <path d="M9.1 9.4 10.4 15M14.9 9.4 13.6 15M9.4 7.4h5.2" />
    </svg>
  );
}

export function IconGoogle({ size, ...props }: IconProps) {
  return (
    <svg width={size ?? 20} height={size ?? 20} viewBox="0 0 24 24" {...props}>
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.24 1.3-1.7 3.8-5.5 3.8-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.9 1.5l2.6-2.5C16.9 3 14.7 2 12 2 6.9 2 2.7 6.1 2.7 11.8S6.9 21.6 12 21.6c6.9 0 9.1-4.8 9.1-7.3 0-.5 0-.9-.1-1.3H12Z"
      />
    </svg>
  );
}

export function IconMail({ size, ...props }: IconProps) {
  return (
    <svg {...base(size)} stroke="currentColor" {...props}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3.5 6 8.5 7 8.5-7" />
    </svg>
  );
}

export function IconPhone({ size, ...props }: IconProps) {
  return (
    <svg {...base(size)} stroke="currentColor" {...props}>
      <path d="M6.5 3h3l1.5 4-2 1.6a11 11 0 0 0 6.4 6.4l1.6-2 4 1.5v3a2 2 0 0 1-2.2 2A17.5 17.5 0 0 1 4.5 5.2 2 2 0 0 1 6.5 3Z" />
    </svg>
  );
}

export function IconClose({ size, ...props }: IconProps) {
  return (
    <svg {...base(size)} stroke="currentColor" {...props}>
      <path d="m5 5 14 14M19 5 5 19" />
    </svg>
  );
}

export function IconChevronRight({ size, ...props }: IconProps) {
  return (
    <svg {...base(size)} stroke="currentColor" {...props}>
      <path d="m9 5 7 7-7 7" />
    </svg>
  );
}

export function IconChevronDown({ size, ...props }: IconProps) {
  return (
    <svg {...base(size)} stroke="currentColor" {...props}>
      <path d="m5 9 7 7 7-7" />
    </svg>
  );
}

/** A roofline — home. */
export function IconHome({ size, ...props }: IconProps) {
  return (
    <svg {...base(size)} stroke="currentColor" {...props}>
      <path d="M4 11.5 12 4l8 7.5" />
      <path d="M6 10v10h12V10" />
      <path d="M10 20v-5h4v5" />
    </svg>
  );
}

/** A building facade with a door — listings. */
export function IconBuilding({ size, ...props }: IconProps) {
  return (
    <svg {...base(size)} stroke="currentColor" {...props}>
      <rect x="5" y="3" width="14" height="18" rx="1" />
      <path d="M9 21v-4h6v4" />
      <path d="M8 7h2M14 7h2M8 11h2M14 11h2M8 15h2M14 15h2" />
    </svg>
  );
}

/** A rounded silhouette — profile/user. */
export function IconUser({ size, ...props }: IconProps) {
  return (
    <svg {...base(size)} stroke="currentColor" {...props}>
      <circle cx="12" cy="8" r="3.6" />
      <path d="M4.5 20c1.4-3.6 4.4-5.5 7.5-5.5s6.1 1.9 7.5 5.5" />
    </svg>
  );
}

/** A folded flag on a pole — event/organizer marker used inline. */
export function IconFlag({ size, ...props }: IconProps) {
  return (
    <svg {...base(size)} stroke="currentColor" {...props}>
      <path d="M5 3v18" />
      <path d="M5 4h13l-3 4 3 4H5" />
    </svg>
  );
}

/** A camera with a viewfinder dot — media upload. */
export function IconCamera({ size, ...props }: IconProps) {
  return (
    <svg {...base(size)} stroke="currentColor" {...props}>
      <path d="M4 8h3l1.6-2.4h6.8L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" />
      <circle cx="12" cy="13" r="3.4" />
    </svg>
  );
}

/** A sphere with orbit lines — 360 panorama tour. */
export function IconPanorama360({ size, ...props }: IconProps) {
  return (
    <svg {...base(size)} stroke="currentColor" {...props}>
      <ellipse cx="12" cy="12" rx="9" ry="4.2" />
      <circle cx="12" cy="12" r="4.2" />
      <path d="M3 12a9 4.2 0 0 0 18 0" />
    </svg>
  );
}

/** A woven basket — trash (soft, on-brand rather than a plastic bin). */
export function IconTrash({ size, ...props }: IconProps) {
  return (
    <svg {...base(size)} stroke="currentColor" {...props}>
      <path d="M5 7h14" />
      <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
      <path d="M6.5 7 7.3 20a2 2 0 0 0 2 1.8h5.4a2 2 0 0 0 2-1.8L17.5 7" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}

/** A closed box with a seal — archived. */
export function IconArchive({ size, ...props }: IconProps) {
  return (
    <svg {...base(size)} stroke="currentColor" {...props}>
      <rect x="3.5" y="4" width="17" height="5" rx="1" />
      <path d="M5 9v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9" />
      <path d="M10 13h4" />
    </svg>
  );
}

/** An upward flame — boosted listing. */
export function IconBoost({ size, ...props }: IconProps) {
  return (
    <svg {...base(size)} stroke="currentColor" {...props}>
      <path d="M12 2c1 3-2.5 4-2.5 7.5A3.5 3.5 0 0 0 12 14a2.4 2.4 0 0 0 2.5-2.4c1.2 1.3 2 3 2 4.9a4.5 4.5 0 0 1-9 0C7.5 12.5 9 10 12 2Z" />
    </svg>
  );
}

/** A small warning pennant — report. */
export function IconReport({ size, ...props }: IconProps) {
  return (
    <svg {...base(size)} stroke="currentColor" {...props}>
      <path d="M6 3v18" />
      <path d="M6 4h11l-2.5 4L17 12H6" />
    </svg>
  );
}

export function IconShare({ size, ...props }: IconProps) {
  return (
    <svg {...base(size)} stroke="currentColor" {...props}>
      <circle cx="18" cy="5" r="2.4" />
      <circle cx="6" cy="12" r="2.4" />
      <circle cx="18" cy="19" r="2.4" />
      <path d="m8.2 10.8 7.6-4.3M8.2 13.2l7.6 4.3" />
    </svg>
  );
}

export function IconCheck({ size, ...props }: IconProps) {
  return (
    <svg {...base(size)} stroke="currentColor" {...props}>
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
  );
}

export function IconPlus({ size, ...props }: IconProps) {
  return (
    <svg {...base(size)} stroke="currentColor" {...props}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function IconEdit({ size, ...props }: IconProps) {
  return (
    <svg {...base(size)} stroke="currentColor" {...props}>
      <path d="M4 20h4L18.5 9.5a2.1 2.1 0 0 0-3-3L5 17v3Z" />
      <path d="m14 6.5 3 3" />
    </svg>
  );
}

export function IconLogout({ size, ...props }: IconProps) {
  return (
    <svg {...base(size)} stroke="currentColor" {...props}>
      <path d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3" />
      <path d="M15 8l4 4-4 4M19 12H9" />
    </svg>
  );
}

/** A weight/scale icon — kilos available on a compensation trip. */
export function IconWeight({ size, ...props }: IconProps) {
  return (
    <svg {...base(size)} stroke="currentColor" {...props}>
      <circle cx="12" cy="6" r="2.4" />
      <path d="M8.5 8.5 4 20h16L15.5 8.5" />
      <path d="M9.5 14h5" />
    </svg>
  );
}
