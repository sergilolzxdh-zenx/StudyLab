"use client";

import dynamic from "next/dynamic";
import { useTheme } from "@/lib/theme/ThemeProvider";

// Three.js + its postprocessing passes are the single heaviest dependency in
// the app (~450KB). The starfield is decorative and runs on every page, so
// it's split into its own chunk and loaded only on the client, after the
// real page content (forms, tool inputs) is already interactive.
const StarfieldBackground = dynamic(
  () => import("./StarfieldBackground").then((mod) => mod.StarfieldBackground),
  { ssr: false }
);

export function StarfieldBackgroundLoader() {
  const { resolvedTheme, background } = useTheme();

  // The starfield's palette is fixed-dark by design and the user can opt
  // into a plain background instead — mounting/unmounting is what actually
  // starts and stops the WebGL scene (see StarfieldBackground's cleanup).
  if (resolvedTheme !== "dark" || background !== "starfield") return null;

  return <StarfieldBackground />;
}
