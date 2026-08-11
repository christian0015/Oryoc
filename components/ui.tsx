// components/ui.tsx
"use client";

import {
  forwardRef,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { IconCheck, IconClose } from "@/components/icons";

// ---------------------------------------------------------------------------
// Button
// ---------------------------------------------------------------------------

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: "sm" | "md" | "lg";
  icon?: ReactNode;
  loading?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-brass text-ink hover:bg-brass-bright shadow-[0_10px_30px_-12px_rgba(201,161,90,0.55)]",
  secondary:
    "bg-surface-raised text-paper border border-line hover:border-brass-dim",
  ghost: "bg-transparent text-paper hover:bg-surface-raised",
  danger: "bg-alert text-paper hover:bg-alert-bright",
};

const sizeClasses = {
  sm: "text-sm px-3.5 py-2 gap-1.5",
  md: "text-[0.95rem] px-5 py-2.5 gap-2",
  lg: "text-base px-7 py-3.5 gap-2.5",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", icon, loading, className = "", children, disabled, ...props }, ref) => (
    <motion.button
      ref={ref}
      whileTap={{ scale: 0.97 }}
      whileHover={{ y: -1 }}
      transition={{ type: "spring", stiffness: 420, damping: 28 }}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center rounded-[var(--radius-pill)] font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...(props as React.ComponentProps<typeof motion.button>)}
    >
      {loading ? (
        <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
      ) : (
        icon
      )}
      {children}
    </motion.button>
  )
);
Button.displayName = "Button";

// ---------------------------------------------------------------------------
// Card
// ---------------------------------------------------------------------------

export function Card({
  className = "",
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-[var(--radius-card)] border border-line bg-surface ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Badge
// ---------------------------------------------------------------------------

type BadgeTone = "brass" | "zellige" | "alert" | "neutral";

const badgeTone: Record<BadgeTone, string> = {
  brass: "bg-[rgba(201,161,90,0.14)] text-brass-bright border-brass-dim/60",
  zellige: "bg-[rgba(63,163,145,0.14)] text-zellige-bright border-zellige/60",
  alert: "bg-[rgba(193,85,74,0.14)] text-alert-bright border-alert/60",
  neutral: "bg-surface-raised text-mist border-line",
};

export function Badge({
  tone = "neutral",
  icon,
  children,
  className = "",
}: {
  tone?: BadgeTone;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium tracking-wide ${badgeTone[tone]} ${className}`}
    >
      {icon}
      {children}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Input / Textarea / Select — shared label+field wrapper
// ---------------------------------------------------------------------------

function FieldShell({
  label,
  hint,
  error,
  children,
}: {
  label?: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      {label && (
        <span className="mb-1.5 block text-sm font-medium text-mist">{label}</span>
      )}
      {children}
      {error ? (
        <span className="mt-1 block text-xs text-alert-bright">{error}</span>
      ) : hint ? (
        <span className="mt-1 block text-xs text-mist-dim">{hint}</span>
      ) : null}
    </label>
  );
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, error, className = "", ...props }, ref) => (
    <FieldShell label={label} hint={hint} error={error}>
      <input
        ref={ref}
        className={`w-full rounded-[var(--radius-control)] border bg-surface px-4 py-2.5 text-paper placeholder:text-mist-dim outline-none transition-colors focus:border-brass ${
          error ? "border-alert" : "border-line"
        } ${className}`}
        {...props}
      />
    </FieldShell>
  )
);
Input.displayName = "Input";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, hint, error, className = "", ...props }, ref) => (
    <FieldShell label={label} hint={hint} error={error}>
      <textarea
        ref={ref}
        className={`w-full rounded-[var(--radius-control)] border bg-surface px-4 py-2.5 text-paper placeholder:text-mist-dim outline-none transition-colors focus:border-brass min-h-28 ${
          error ? "border-alert" : "border-line"
        } ${className}`}
        {...props}
      />
    </FieldShell>
  )
);
Textarea.displayName = "Textarea";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, hint, error, className = "", children, ...props }, ref) => (
    <FieldShell label={label} hint={hint} error={error}>
      <select
        ref={ref}
        className={`w-full rounded-[var(--radius-control)] border bg-surface px-4 py-2.5 text-paper outline-none transition-colors focus:border-brass ${
          error ? "border-alert" : "border-line"
        } ${className}`}
        {...props}
      >
        {children}
      </select>
    </FieldShell>
  )
);
Select.displayName = "Select";

// ---------------------------------------------------------------------------
// Toggle (immediate-apply fields, §6.3)
// ---------------------------------------------------------------------------

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="inline-flex items-center gap-3"
    >
      {label && <span className="text-sm text-paper">{label}</span>}
      <span
        className={`relative h-6 w-11 rounded-full transition-colors ${
          checked ? "bg-brass" : "bg-surface-raised border border-line"
        }`}
      >
        <motion.span
          layout
          transition={{ type: "spring", stiffness: 500, damping: 32 }}
          className="absolute top-0.5 h-5 w-5 rounded-full bg-ink shadow"
          style={{ left: checked ? "22px" : "2px" }}
        />
      </span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Autosave indicator — discrete pastille, never blocks interaction (§6.3)
// ---------------------------------------------------------------------------

export type SaveState = "idle" | "saving" | "saved" | "error";

export function SaveIndicator({ state }: { state: SaveState }) {
  return (
    <AnimatePresence mode="wait">
      {state !== "idle" && (
        <motion.span
          key={state}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.18 }}
          className={`inline-flex items-center gap-1.5 text-xs ${
            state === "error" ? "text-alert-bright" : "text-mist"
          }`}
        >
          {state === "saving" && (
            <span className="h-3 w-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
          )}
          {state === "saved" && <IconCheck size={13} />}
          {state === "saving" ? "Enregistrement" : state === "saved" ? "Enregistre" : "Erreur"}
        </motion.span>
      )}
    </AnimatePresence>
  );
}

// ---------------------------------------------------------------------------
// Modal
// ---------------------------------------------------------------------------

export function Modal({
  open,
  onClose,
  title,
  children,
  maxWidth = "max-w-md",
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  maxWidth?: string;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            className={`relative z-10 w-full ${maxWidth} rounded-[var(--radius-card)] border border-line bg-surface p-6 card-lift`}
          >
            <div className="mb-4 flex items-center justify-between">
              {title && <h2 className="font-display text-xl italic text-paper">{title}</h2>}
              <button
                onClick={onClose}
                aria-label="Fermer"
                className="ml-auto rounded-full p-1.5 text-mist hover:bg-surface-raised hover:text-paper"
              >
                <IconClose size={18} />
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ---------------------------------------------------------------------------
// Empty state — a moment for direction, not decoration
// ---------------------------------------------------------------------------

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-[var(--radius-card)] border border-dashed border-line px-6 py-14 text-center">
      {icon && <div className="text-mist-dim">{icon}</div>}
      <p className="font-display text-lg italic text-paper">{title}</p>
      {description && <p className="max-w-sm text-sm text-mist">{description}</p>}
      {action}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton loader (used while listing/event data streams in)
// ---------------------------------------------------------------------------

export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-[var(--radius-control)] bg-surface-raised ${className}`}
    />
  );
}
