"use client";

import type { ReactNode } from "react";
import { Glyph } from "../shared/bits";
import { PrimaryButton, SecondaryButton } from "../shared/ui";

interface Props {
  label: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  /** Kurzer Hinweis über dem Button */
  hint?: ReactNode;
  /** Optionaler zweiter, leiser Weg (z. B. „Finish with 2 features“) */
  secondary?: { label: ReactNode; onClick: () => void };
}

/**
 * Self-paced Ablauf: der Teilnehmer geht selbst weiter. Fixe Leiste am unteren Rand,
 * Primär-Button wie auf der Trainer-Leinwand (Kupfer, Versalien, Chevron).
 */
export function ContinueBar({ label, onClick, disabled, hint, secondary }: Props) {
  return (
    <div className="sticky bottom-0 z-20 -mx-5 mt-auto flex flex-col gap-2 bg-gradient-to-b from-transparent via-night/90 to-night px-5 pb-[max(16px,env(safe-area-inset-bottom))] pt-8">
      {hint && <p className="text-center text-[12px] leading-[1.35] text-white/50">{hint}</p>}
      <PrimaryButton onClick={onClick} disabled={disabled}>
        {label} <Glyph name="chevron-right" className="size-4" />
      </PrimaryButton>
      {secondary && (
        <SecondaryButton onClick={secondary.onClick} className="!min-h-10 !py-2 text-[12px]">
          {secondary.label}
        </SecondaryButton>
      )}
    </div>
  );
}
