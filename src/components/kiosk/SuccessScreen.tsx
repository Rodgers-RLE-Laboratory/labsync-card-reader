"use client";

import { CheckCircle2 } from "lucide-react";

interface SuccessScreenProps {
  firstName: string;
  lastName: string;
}

export function SuccessScreen({ firstName, lastName }: SuccessScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-8 animate-fade-in">
      <div className="rounded-full bg-green-100 p-5">
        <CheckCircle2 className="h-14 w-14 text-green-600" />
      </div>
      <div className="text-center">
        <h2 className="text-3xl font-semibold text-foreground">
          Welcome, {firstName}!
        </h2>
        <p className="mt-2 text-lg text-muted-foreground">
          {firstName} {lastName} checked in successfully
        </p>
      </div>
    </div>
  );
}
