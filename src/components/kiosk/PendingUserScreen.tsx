"use client";

import { Clock } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

const GET_STARTED_URL = "https://tjr-lab.mit.edu/engagement/get-started/";

export function PendingUserScreen() {
  return (
    <div className="flex flex-col items-center justify-center gap-6 animate-fade-in">
      <div className="rounded-full bg-amber-100 p-5">
        <Clock className="h-14 w-14 text-amber-600" />
      </div>
      <div className="text-center">
        <h2 className="text-3xl font-semibold text-foreground">
          Intake Form Received
        </h2>
        <p className="mt-3 text-lg text-muted-foreground">
          Please attend an orientation on a Tuesday morning
        </p>
        <p className="mt-1 text-base text-muted-foreground">
          More information:
        </p>
      </div>
      <div className="rounded-lg bg-white p-4">
        <QRCodeSVG value={GET_STARTED_URL} size={160} />
      </div>
      <p className="text-sm text-muted-foreground">
        {GET_STARTED_URL}
      </p>
    </div>
  );
}
