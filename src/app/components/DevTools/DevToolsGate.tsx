"use client";

import dynamic from "next/dynamic";

const DevToolsPanel = process.env.NODE_ENV === "development"
  ? dynamic(() => import("./DevToolsPanel"), { ssr: false })
  : null;

export default function DevToolsGate() {
  return DevToolsPanel ? <DevToolsPanel /> : null;
}
