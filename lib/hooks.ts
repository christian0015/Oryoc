// lib/hooks.ts
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuthModal } from "@/components/providers";
import type { ActionResult } from "@/types";
import type { SaveState } from "@/components/ui";

// ---------------------------------------------------------------------------
// useDebounce
// ---------------------------------------------------------------------------

export function useDebounce<T>(value: T, delayMs = 400): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}

// ---------------------------------------------------------------------------
// useAutosaveField — text fields debounce 300-500ms; every keystroke
// resets the timer, save fires once the user stops typing (§6.3).
// ---------------------------------------------------------------------------

export function useAutosaveField<T>(
  initialValue: T,
  onSave: (value: T) => Promise<ActionResult<unknown>>,
  delayMs = 400
) {
  const [value, setValue] = useState(initialValue);
  const [state, setState] = useState<SaveState>("idle");
  const skipNext = useRef(true);
  const debounced = useDebounce(value, delayMs);

  useEffect(() => {
    if (skipNext.current) {
      skipNext.current = false;
      return;
    }
    let cancelled = false;
    setState("saving");
    onSave(debounced).then((res) => {
      if (cancelled) return;
      setState(res.ok ? "saved" : "error");
      if (res.ok) {
        const t = setTimeout(() => !cancelled && setState("idle"), 1800);
        return () => clearTimeout(t);
      }
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  return { value, setValue, state };
}

// ---------------------------------------------------------------------------
// useDeviceOrientation — powers the 360 capture progress ring
// ---------------------------------------------------------------------------

export interface OrientationState {
  alpha: number | null;
  beta: number | null;
  gamma: number | null;
  supported: boolean;
  permission: "unknown" | "granted" | "denied";
  requestPermission: () => Promise<void>;
}

type DeviceOrientationEventWithPermission = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<"granted" | "denied">;
};

export function useDeviceOrientation(): OrientationState {
  const [alpha, setAlpha] = useState<number | null>(null);
  const [beta, setBeta] = useState<number | null>(null);
  const [gamma, setGamma] = useState<number | null>(null);
  const [permission, setPermission] = useState<"unknown" | "granted" | "denied">("unknown");
  const supported = typeof window !== "undefined" && "DeviceOrientationEvent" in window;

  useEffect(() => {
    if (!supported || permission !== "granted") return;
    function handler(e: DeviceOrientationEvent) {
      setAlpha(e.alpha);
      setBeta(e.beta);
      setGamma(e.gamma);
    }
    window.addEventListener("deviceorientation", handler);
    return () => window.removeEventListener("deviceorientation", handler);
  }, [supported, permission]);

  const requestPermission = useCallback(async () => {
    if (!supported) return;
    const DOE = DeviceOrientationEvent as DeviceOrientationEventWithPermission;
    if (typeof DOE.requestPermission === "function") {
      try {
        const result = await DOE.requestPermission();
        setPermission(result === "granted" ? "granted" : "denied");
      } catch {
        setPermission("denied");
      }
    } else {
      // Non-iOS browsers don't gate this behind a permission prompt.
      setPermission("granted");
    }
  }, [supported]);

  return { alpha, beta, gamma, supported, permission, requestPermission };
}

// ---------------------------------------------------------------------------
// useAuthGatedAction — runs a server action; on AUTH_REQUIRED, opens the
// global auth modal instead of surfacing a raw error to the caller.
// ---------------------------------------------------------------------------

export function useAuthGatedAction<Args extends unknown[], T>(
  action: (...args: Args) => Promise<ActionResult<T>>
) {
  const { openAuthModal } = useAuthModal();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(
    async (...args: Args): Promise<T | null> => {
      setLoading(true);
      setError(null);
      const res = await action(...args);
      setLoading(false);
      if (!res.ok) {
        if (res.code === "AUTH_REQUIRED") {
          openAuthModal(res.message);
        } else {
          setError(res.message);
        }
        return null;
      }
      return res.data;
    },
    [action, openAuthModal]
  );

  return { run, loading, error };
}
