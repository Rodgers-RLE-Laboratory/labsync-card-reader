"use client";

import { Nfc } from "lucide-react";

export function IdleScreen() {
  return (
    <div className="flex flex-col items-center justify-center gap-8 animate-fade-in">
      <div className="rounded-full bg-primary/10 p-8">
        <Nfc className="h-24 w-24 text-primary animate-pulse-slow" />
      </div>
      <div className="text-center">
        <p className="mb-1 text-lg text-muted-foreground">
          You must check-in to use this area
        </p>
        <h2 className="text-3xl font-semibold text-foreground">
          Tap your MIT ID
        </h2>
        <p className="mt-2 text-lg text-muted-foreground">
          Hold your card or device near the reader
        </p>
      </div>
    </div>
  );
}
