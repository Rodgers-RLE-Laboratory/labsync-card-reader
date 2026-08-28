import { KioskScreen } from "@/components/kiosk/KioskScreen";
import { env } from "@/lib/env";

export default function Home() {
  const siteTitle = env("SITE_TITLE") || "LabSync";

  return (
    <main className="flex flex-1 items-center justify-center">
      <KioskScreen siteTitle={siteTitle} />
    </main>
  );
}
