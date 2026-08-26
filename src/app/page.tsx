import { KioskScreen } from "@/components/kiosk/KioskScreen";

export default function Home() {
  const siteTitle = process.env.SITE_TITLE || "LabSync";

  return (
    <main className="flex flex-1 items-center justify-center">
      <KioskScreen siteTitle={siteTitle} />
    </main>
  );
}
