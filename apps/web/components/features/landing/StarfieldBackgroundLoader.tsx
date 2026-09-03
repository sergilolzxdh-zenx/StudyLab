"use client";

import dynamic from "next/dynamic";

// Three.js + its postprocessing passes are the single heaviest dependency in
// the app (~450KB). The starfield is decorative and runs on every page, so
// it's split into its own chunk and loaded only on the client, after the
// real page content (forms, tool inputs) is already interactive.
const StarfieldBackground = dynamic(
  () => import("./StarfieldBackground").then((mod) => mod.StarfieldBackground),
  { ssr: false }
);

export function StarfieldBackgroundLoader() {
  return <StarfieldBackground />;
}
