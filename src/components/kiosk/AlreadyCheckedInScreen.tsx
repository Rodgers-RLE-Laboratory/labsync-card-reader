"use client";

import { CheckCircle2 } from "lucide-react";

interface AlreadyCheckedInScreenProps {
  firstName: string;
  lastName: string;
}

export function AlreadyCheckedInScreen({ firstName, lastName }: AlreadyCheckedInScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-8 animate-fade-in pt-8">
      <div className="rounded-full bg-blue-100 p-5">
        <CheckCircle2 className="h-14 w-14 text-blue-600" />
      </div>
      <div className="text-center">
        <h2 className="text-3xl font-semibold text-foreground">
          Already Checked-in
        </h2>
        <p className="mt-2 text-lg text-muted-foreground">
          {firstName} {lastName} is already checked in
        </p>
      </div>
    </div>
  );
}
