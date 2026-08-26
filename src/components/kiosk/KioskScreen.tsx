"use client";

import { useCallback, useState } from "react";
import { useCardReader } from "@/hooks/useCardReader";
import { IdleScreen } from "./IdleScreen";
import { ProcessingScreen } from "./ProcessingScreen";
import { SuccessScreen } from "./SuccessScreen";
import { ErrorScreen } from "./ErrorScreen";
import Image from "next/image";
import { KioskState, KioskData, CheckinResponse } from "@/lib/types";

interface KioskScreenProps {
  siteTitle: string;
}

export function KioskScreen({ siteTitle }: KioskScreenProps) {
  const [state, setState] = useState<KioskState>("idle");
  const [data, setData] = useState<KioskData>({});

  const resetToIdle = useCallback(() => {
    setState("idle");
    setData({});
  }, []);

  const handleCardRead = useCallback(
    async (rawCardId: string) => {
      setState("processing");
      setData({});

      try {
        const response = await fetch("/api/checkin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rawCardId }),
        });

        const result: CheckinResponse = await response.json();

        if (result.success) {
          setState("success");
          setData({ firstName: result.firstName, lastName: result.lastName });
          setTimeout(resetToIdle, 3000);
        } else {
          setState("error");
          setData({ errorMessage: result.error || "Unknown error" });
          setTimeout(resetToIdle, 5000);
        }
      } catch {
        setState("error");
        setData({ errorMessage: "Network error. Please try again." });
        setTimeout(resetToIdle, 5000);
      }
    },
    [resetToIdle]
  );

  const { inputRef, handleKeyDown } = useCardReader({
    onCardRead: handleCardRead,
    disabled: state !== "idle",
  });

  return (
    <div className="flex flex-1 flex-col items-center justify-center p-8">
      {/* Hidden input for card reader */}
      <input
        ref={inputRef}
        type="text"
        onKeyDown={handleKeyDown}
        className="sr-only"
        aria-label="Card reader input"
        autoComplete="off"
      />

      {/* Lab logo and site title */}
      <div className="absolute top-8 flex flex-col items-center gap-3">
        <Image
          src="/rodgers-rle-logo.png"
          alt="T.J. Rodgers RLE Laboratory"
          width={240}
          height={80}
          className="rounded-lg bg-white p-2"
          priority
        />
        <h1 className="text-xl font-medium text-muted-foreground">
          {siteTitle}
        </h1>
      </div>

      {/* State screens */}
      {state === "idle" && <IdleScreen />}
      {state === "processing" && <ProcessingScreen />}
      {state === "success" && (
        <SuccessScreen
          firstName={data.firstName || ""}
          lastName={data.lastName || ""}
        />
      )}
      {state === "error" && (
        <ErrorScreen message={data.errorMessage || "Unknown error"} />
      )}
    </div>
  );
}
