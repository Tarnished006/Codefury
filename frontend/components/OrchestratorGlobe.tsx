"use client";

import React, { useEffect, useRef } from "react";
import createGlobe from "cobe";

export default function OrchestratorGlobe() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let phi = 0;
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Fixed internal resolution for crystal-clear retina rendering
    const size = 520;
    const dpr = Math.min(typeof window !== "undefined" ? window.devicePixelRatio || 2 : 2, 2);

    let globe: ReturnType<typeof createGlobe> | null = null;

    try {
      globe = createGlobe(canvas, {
        devicePixelRatio: dpr,
        width: size * dpr,
        height: size * dpr,
        phi: 0,
        theta: 0.25,
        dark: 0,
        diffuse: 1.2,
        mapSamples: 18000,
        mapBrightness: 6,
        baseColor: [1, 1, 1],
        markerColor: [0.1, 0.1, 0.1],
        glowColor: [1, 1, 1],
        scale: 1.05,
        offset: [0, 0],
        markers: [
          { location: [59.3293, 18.0686],  size: 0.05 }, // arn1
          { location: [19.0760, 72.8777],  size: 0.06 }, // bom1
          { location: [1.3521, 103.8198],  size: 0.06 }, // sin1
          { location: [35.5494, 139.7798], size: 0.06 }, // hnd1
          { location: [-33.8688, 151.2093], size: 0.06 }, // syd1
        ],
        arcs: [
          { from: [19.0760, 72.8777], to: [1.3521, 103.8198], color: [0.1, 0.1, 0.1] },  // bom1 -> sin1
          { from: [35.5494, 139.7798], to: [-33.8688, 151.2093], color: [0.1, 0.1, 0.1] }, // hnd1 -> syd1
          { from: [59.3293, 18.0686], to: [19.0760, 72.8777], color: [0.1, 0.1, 0.1] },  // arn1 -> bom1
        ],
        arcColor: [0.15, 0.15, 0.15],
        arcWidth: 1.2,
        arcHeight: 0.35,
        onRender: (state) => {
          phi += 0.0035;
          state.phi = phi;
        },
      });
    } catch (e) {
      console.error("Globe init error", e);
    }

    return () => {
      globe?.destroy();
    };
  }, []);

  return (
    <div className="relative w-full max-w-[540px] aspect-square flex items-center justify-center select-none">
      {/* Outer subtle atmospheric soft white/gray glow matching image */}
      <div className="absolute inset-4 rounded-full bg-white shadow-[0_20px_50px_rgba(0,0,0,0.08),0_0_0_1px_rgba(0,0,0,0.04),inset_0_0_30px_rgba(0,0,0,0.03)] pointer-events-none" />

      {/* WebGL Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full relative z-10"
        style={{ width: "100%", height: "100%", contain: "layout paint size" }}
      />

      {/* Telemetry Node Labels & Badges matching reference image pixel-perfect */}
      
      {/* Top Node: arn1 */}
      <div className="absolute z-20 top-[8%] left-[28%] pointer-events-none flex flex-col items-center">
        <span className="text-black text-[0.65rem] mb-0.5">▲</span>
        <span className="bg-white border border-[#E4E4E7] text-black text-[0.68rem] font-mono font-semibold px-2 py-0.5 rounded shadow-xs">
          arn1
        </span>
      </div>

      {/* Left Node: bom1 + req/s badges */}
      <div className="absolute z-20 top-[18%] left-[12%] pointer-events-none flex flex-col items-start gap-1">
        <span className="bg-black text-white text-[0.62rem] font-mono font-semibold px-2 py-0.5 rounded shadow-sm">
          273k req/s
        </span>
        <div className="flex items-center gap-1">
          <span className="bg-black text-white text-[0.62rem] font-mono font-semibold px-2 py-0.5 rounded shadow-sm">
            244k req/s
          </span>
        </div>
        <div className="flex flex-col items-center ml-4 mt-0.5">
          <span className="text-black text-[0.65rem]">▲</span>
          <span className="bg-white border border-[#E4E4E7] text-black text-[0.68rem] font-mono font-semibold px-2 py-0.5 rounded shadow-xs">
            bom1
          </span>
        </div>
      </div>

      {/* Center Node: sin1 */}
      <div className="absolute z-20 top-[38%] left-[38%] pointer-events-none flex flex-col items-center">
        <span className="text-black text-[0.65rem] mb-0.5">▲</span>
        <span className="bg-white border border-[#E4E4E7] text-black text-[0.68rem] font-mono font-semibold px-2 py-0.5 rounded shadow-xs">
          sin1
        </span>
      </div>

      {/* Right Top Node: hnd1 + 297k req/s */}
      <div className="absolute z-20 top-[14%] right-[18%] pointer-events-none flex flex-col items-center">
        <span className="bg-black text-white text-[0.62rem] font-mono font-semibold px-2 py-0.5 rounded shadow-sm mb-1">
          297k req/s
        </span>
        <span className="text-black text-[0.65rem]">▲</span>
        <span className="bg-white border border-[#E4E4E7] text-black text-[0.68rem] font-mono font-semibold px-2 py-0.5 rounded shadow-xs">
          hnd1
        </span>
      </div>

      {/* Right Middle Badge: 247k req/s */}
      <div className="absolute z-20 top-[42%] right-[22%] pointer-events-none">
        <span className="bg-black text-white text-[0.62rem] font-mono font-semibold px-2 py-0.5 rounded shadow-sm">
          247k req/s
        </span>
      </div>

      {/* Bottom Right Node: syd1 */}
      <div className="absolute z-20 bottom-[22%] right-[28%] pointer-events-none flex flex-col items-center">
        <span className="text-black text-[0.65rem]">▲</span>
        <span className="bg-white border border-[#E4E4E7] text-black text-[0.68rem] font-mono font-semibold px-2 py-0.5 rounded shadow-xs">
          syd1
        </span>
      </div>
    </div>
  );
}