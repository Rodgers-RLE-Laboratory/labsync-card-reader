"use client";

import { Loader2 } from "lucide-react";

export function ProcessingScreen() {
  return (
    <div className="flex flex-col items-center justify-center gap-8 animate-fade-in pt-8">
      <Loader2 className="h-14 w-14 text-primary animate-spin" />
      <h2 className="text-2xl font-medium text-foreground">Checking in...</h2>
    </div>
  );
}
