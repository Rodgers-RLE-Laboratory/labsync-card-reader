"use client";

import { HelpCircle } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

const LAB_URL = "https://tjr-lab.mit.edu/";

export function UnknownUserScreen() {
  return (
    <div className="flex flex-col items-center justify-center gap-6 animate-fade-in">
      <div className="rounded-full bg-red-100 p-5">
        <HelpCircle className="h-14 w-14 text-red-600" />
      </div>
      <div className="text-center">
        <h2 className="text-3xl font-semibold text-foreground">
          Card Not Recognized
        </h2>
        <p className="mt-3 text-lg text-muted-foreground">
          To get started, fill out an intake form:
        </p>
      </div>
      <div className="rounded-lg bg-white p-4">
        <QRCodeSVG value={LAB_URL} size={160} />
      </div>
      <p className="text-sm text-muted-foreground">
        {LAB_URL}
      </p>
    </div>
  );
}
