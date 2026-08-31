"use client";

import { FormInput } from "@/components/ui/Card";
import { useEffect, useState } from "react";

type DraftNumberInputProps = {
  value: number;
  onCommit: (next: number) => void;
  /** Live preview while typing (before blur commit). */
  onDraftChange?: (next: number | null) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  /** Allow empty while focused; on blur empty reverts to previous value. */
  allowEmptyWhileEditing?: boolean;
};

/** Controlled number field that stays editable after clear (no snap-to-0). */
export function DraftNumberInput({
  value,
  onCommit,
  onDraftChange,
  min = 0,
  max = 100,
  disabled = false,
  className,
  placeholder,
  allowEmptyWhileEditing = true,
}: DraftNumberInputProps) {
  const [focused, setFocused] = useState(false);
  const [text, setText] = useState(String(value));

  useEffect(() => {
    if (!focused) setText(String(value));
  }, [value, focused]);

  function emitDraft(raw: string) {
    if (!onDraftChange) return;
    if (raw.trim() === "") {
      onDraftChange(null);
      return;
    }
    const n = Number(raw);
    if (!Number.isFinite(n)) return;
    onDraftChange(Math.min(max, Math.max(min, n)));
  }

  return (
    <FormInput
      type="text"
      inputMode="numeric"
      disabled={disabled}
      className={className}
      placeholder={placeholder}
      value={focused ? text : String(value)}
      onFocus={() => {
        setFocused(true);
        setText(String(value));
      }}
      onChange={(e) => {
        const raw = e.target.value.replace(/[^\d]/g, "");
        if (!allowEmptyWhileEditing && raw === "") return;
        setText(raw);
        emitDraft(raw);
      }}
      onBlur={() => {
        setFocused(false);
        if (text.trim() === "") {
          setText(String(value));
          onDraftChange?.(value);
          return;
        }
        const n = Number(text);
        if (!Number.isFinite(n)) {
          setText(String(value));
          onDraftChange?.(value);
          return;
        }
        const clamped = Math.min(max, Math.max(min, n));
        onCommit(clamped);
        setText(String(clamped));
        onDraftChange?.(clamped);
      }}
    />
  );
}
