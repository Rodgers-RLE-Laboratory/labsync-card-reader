"use client";

import { useRef, useEffect, useCallback, useState } from "react";

interface UseCardReaderOptions {
  onCardRead: (cardId: string) => void;
  disabled?: boolean;
  lockoutMs?: number;
}

export function useCardReader({
  onCardRead,
  disabled = false,
  lockoutMs = 2000,
}: UseCardReaderOptions) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [lockedOut, setLockedOut] = useState(false);

  const focusInput = useCallback(() => {
    if (inputRef.current && !disabled) {
      inputRef.current.focus();
    }
  }, [disabled]);

  // Keep input focused at all times
  useEffect(() => {
    focusInput();
    const interval = setInterval(focusInput, 500);
    return () => clearInterval(interval);
  }, [focusInput]);

  // Re-focus on window focus and click
  useEffect(() => {
    window.addEventListener("focus", focusInput);
    document.addEventListener("click", focusInput);
    return () => {
      window.removeEventListener("focus", focusInput);
      document.removeEventListener("click", focusInput);
    };
  }, [focusInput]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        const value = inputRef.current?.value.trim();
        if (value && !lockedOut && !disabled) {
          if (inputRef.current) inputRef.current.value = "";
          setLockedOut(true);
          setTimeout(() => setLockedOut(false), lockoutMs);
          onCardRead(value);
        } else if (inputRef.current) {
          inputRef.current.value = "";
        }
      }
    },
    [lockedOut, disabled, lockoutMs, onCardRead]
  );

  return { inputRef, handleKeyDown };
}
