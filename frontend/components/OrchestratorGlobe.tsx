"use client";

import React from "react";
import { GlobeCdn } from "@/components/ui/cobe-globe-cdn";

export default function OrchestratorGlobe() {
  return (
    <div className="relative w-full max-w-[320px] sm:max-w-[420px] md:max-w-[500px] aspect-square flex items-center justify-center select-none mx-auto">
      {/* Outer subtle atmospheric soft white/gray glow */}
      <div className="absolute inset-2 sm:inset-4 rounded-full bg-white shadow-[0_15px_40px_rgba(0,0,0,0.06),0_0_0_1px_rgba(0,0,0,0.04),inset_0_0_24px_rgba(0,0,0,0.03)] pointer-events-none" />

      {/* Upgraded Interactive Cobe Globe with 3D CDN Pyramids and Real-time Traffic Arcs */}
      <GlobeCdn className="w-full h-full relative z-10" speed={0.0035} />
    </div>
  );
}