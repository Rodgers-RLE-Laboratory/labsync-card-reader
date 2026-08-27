"use client";

import { XCircle } from "lucide-react";

interface ErrorScreenProps {
  message: string;
}

export function ErrorScreen({ message }: ErrorScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-8 animate-fade-in">
      <div className="rounded-full bg-red-100 p-5">
        <XCircle className="h-14 w-14 text-red-600" />
      </div>
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-foreground">
          Check-in Failed
        </h2>
        <p className="mt-2 text-lg text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}
