"use client";

import React, { useEffect, useRef, useState } from "react";
import createGlobe from "cobe";

export default function OrchestratorGlobe() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState(500);

  useEffect(() => {
    let phi = 0;
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const updateSize = () => {
      const containerWidth = container.offsetWidth || 500;
      const currentSize = Math.min(containerWidth, 520);
      setSize(currentSize);
    };

    updateSize();
    window.addEventListener("resize", updateSize);

    const dpr = Math.min(typeof window !== "undefined" ? window.devicePixelRatio || 2 : 2, 2);
    const globeSize = Math.min(container.offsetWidth || 500, 520);

    let globe: ReturnType<typeof createGlobe> | null = null;

    try {
      globe = createGlobe(canvas, {
        devicePixelRatio: dpr,
        width: globeSize * dpr,
        height: globeSize * dpr,
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
        onRender: (state: any) => {
          phi += 0.0035;
          state.phi = phi;
        },
      } as any);
    } catch (e) {
      console.error("Globe init error", e);
    }

    return () => {
      globe?.destroy();
      window.removeEventListener("resize", updateSize);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-[320px] sm:max-w-[420px] md:max-w-[500px] aspect-square flex items-center justify-center select-none mx-auto"
    >
      {/* Outer subtle atmospheric soft white/gray glow */}
      <div className="absolute inset-2 sm:inset-4 rounded-full bg-white shadow-[0_15px_40px_rgba(0,0,0,0.06),0_0_0_1px_rgba(0,0,0,0.04),inset_0_0_24px_rgba(0,0,0,0.03)] pointer-events-none" />

      {/* WebGL Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full relative z-10"
        style={{ width: "100%", height: "100%", contain: "layout paint size" }}
      />

      {/* Responsive Telemetry Node Labels */}
      
      {/* Top Node: arn1 */}
      <div className="absolute z-20 top-[6%] sm:top-[8%] left-[26%] sm:left-[28%] pointer-events-none flex flex-col items-center scale-90 sm:scale-100 origin-center">
        <span className="text-black text-[0.6rem] sm:text-[0.65rem] mb-0.5">▲</span>
        <span className="bg-white border border-black/10 text-black text-[0.6rem] sm:text-[0.68rem] font-mono font-semibold px-1.5 sm:px-2 py-0.5 shadow-xs uppercase">
          arn1
        </span>
      </div>

      {/* Left Node: bom1 + req/s badges */}
      <div className="absolute z-20 top-[16%] sm:top-[18%] left-[6%] sm:left-[12%] pointer-events-none flex flex-col items-start gap-1 scale-90 sm:scale-100 origin-top-left">
        <span className="bg-black text-white text-[0.55rem] sm:text-[0.62rem] font-mono font-semibold px-1.5 sm:px-2 py-0.5 shadow-xs uppercase">
          273k req/s
        </span>
        <div className="flex flex-col items-center ml-2 sm:ml-4 mt-0.5">
          <span className="text-black text-[0.6rem] sm:text-[0.65rem]">▲</span>
          <span className="bg-white border border-black/10 text-black text-[0.6rem] sm:text-[0.68rem] font-mono font-semibold px-1.5 sm:px-2 py-0.5 shadow-xs uppercase">
            bom1
          </span>
        </div>
      </div>

      {/* Center Node: sin1 */}
      <div className="absolute z-20 top-[36%] sm:top-[38%] left-[36%] sm:left-[38%] pointer-events-none flex flex-col items-center scale-90 sm:scale-100 origin-center">
        <span className="text-black text-[0.6rem] sm:text-[0.65rem] mb-0.5">▲</span>
        <span className="bg-white border border-black/10 text-black text-[0.6rem] sm:text-[0.68rem] font-mono font-semibold px-1.5 sm:px-2 py-0.5 shadow-xs uppercase">
          sin1
        </span>
      </div>

      {/* Right Top Node: hnd1 */}
      <div className="absolute z-20 top-[12%] sm:top-[14%] right-[12%] sm:right-[18%] pointer-events-none flex flex-col items-center scale-90 sm:scale-100 origin-top-right">
        <span className="bg-black text-white text-[0.55rem] sm:text-[0.62rem] font-mono font-semibold px-1.5 sm:px-2 py-0.5 shadow-xs mb-1 uppercase">
          297k req/s
        </span>
        <span className="text-black text-[0.6rem] sm:text-[0.65rem]">▲</span>
        <span className="bg-white border border-black/10 text-black text-[0.6rem] sm:text-[0.68rem] font-mono font-semibold px-1.5 sm:px-2 py-0.5 shadow-xs uppercase">
          hnd1
        </span>
      </div>

      {/* Bottom Right Node: syd1 */}
      <div className="absolute z-20 bottom-[18%] sm:bottom-[22%] right-[22%] sm:right-[28%] pointer-events-none flex flex-col items-center scale-90 sm:scale-100 origin-bottom-right">
        <span className="text-black text-[0.6rem] sm:text-[0.65rem]">▲</span>
        <span className="bg-white border border-black/10 text-black text-[0.6rem] sm:text-[0.68rem] font-mono font-semibold px-1.5 sm:px-2 py-0.5 shadow-xs uppercase">
          syd1
        </span>
      </div>
    </div>
  );
}