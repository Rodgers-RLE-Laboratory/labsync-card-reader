"use client";

import { CheckCircle2 } from "lucide-react";

interface RestoredScreenProps {
  firstName: string;
  lastName: string;
}

export function RestoredScreen({ firstName, lastName }: RestoredScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-8 animate-fade-in pt-8">
      <div className="rounded-full bg-green-100 p-5">
        <CheckCircle2 className="h-14 w-14 text-green-600" />
      </div>
      <div className="text-center">
        <h2 className="text-3xl font-semibold text-foreground">
          Welcome back, {firstName}!
        </h2>
        <p className="mt-2 text-lg text-muted-foreground">
          {firstName} {lastName} &mdash; your account has been restored
        </p>
      </div>
    </div>
  );
}
