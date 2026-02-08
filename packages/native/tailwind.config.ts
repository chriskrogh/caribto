import type { Config } from "tailwindcss";

import { colors } from "./lib/theme/colors";

const config = {
  content: ["./app/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  presets: [require("nativewind/preset")],
  darkMode: "class", // Enable class-based dark mode
  theme: {
    extend: {
      colors,
      fontFamily: {
        normal: ["Manrope_400Regular"],
        medium: ["Manrope_500Medium"],
        semibold: ["Manrope_600SemiBold"],
        bold: ["Manrope_700Bold"],
        extrabold: ["Manrope_800ExtraBold"],
      },
    },
  },
} satisfies Config;

export default config;
