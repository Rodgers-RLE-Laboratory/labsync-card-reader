import type { Config } from "tailwindcss";
import { labsyncPreset } from "@labsync/design-system/preset";

const config: Config = {
  presets: [labsyncPreset as Config],
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
};

export default config;
