"use client";

import { useEffect, useRef } from "react";
import createGlobe from "cobe";

export default function OrchestratorGlobe() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let phi = 0.5;
    let width = 0;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onResize = () => {
      if (canvas) {
        width = canvas.offsetWidth;
      }
    };
    window.addEventListener("resize", onResize);
    onResize();

    const dpr = Math.min(window.devicePixelRatio || 2, 2);

    const globe = createGlobe(canvas, {
      devicePixelRatio: dpr,
      width: (width || 560) * dpr,
      height: (width || 560) * dpr,
      phi: 0.5,
      theta: 0.2,
      dark: 0,
      diffuse: 1.4,
      mapSamples: 16000,
      mapBrightness: 6,
      baseColor: [1, 1, 1],
      markerColor: [0.1, 0.1, 0.1],
      glowColor: [1, 1, 1],
      scale: 1.02,
      offset: [0, 0],
      markers: [
        { location: [38.9072, -77.0369], size: 0.05 }, // iad1 (US East)
        { location: [53.3498, -6.2603],  size: 0.04 }, // dub1 (Dublin)
        { location: [59.3293, 18.0686],  size: 0.04 }, // arn1 (Stockholm)
        { location: [48.8566, 2.3522],   size: 0.04 }, // cdg1 (Paris)
        { location: [19.0760, 72.8777],  size: 0.05 }, // bom1 (Mumbai)
        { location: [1.3521, 103.8198],  size: 0.04 }, // sin1 (Singapore)
        { location: [-23.5505, -46.6333], size: 0.04 }, // gru1 (Sao Paulo)
        { location: [37.7749, -122.4194], size: 0.05 }, // sfo (US West)
        { location: [35.6762, 139.6503], size: 0.04 }, // hnd (Tokyo)
      ],
      arcs: [
        { from: [38.9072, -77.0369], to: [53.3498, -6.2603], color: [0.2, 0.2, 0.2] },
        { from: [53.3498, -6.2603],  to: [59.3293, 18.0686], color: [0.2, 0.2, 0.2] },
        { from: [48.8566, 2.3522],   to: [19.0760, 72.8777], color: [0.2, 0.2, 0.2] },
        { from: [19.0760, 72.8777],  to: [1.3521, 103.8198], color: [0.2, 0.2, 0.2] },
        { from: [38.9072, -77.0369], to: [-23.5505, -46.6333], color: [0.3, 0.3, 0.3] },
        { from: [-23.5505, -46.6333], to: [48.8566, 2.3522], color: [0.3, 0.3, 0.3] },
        { from: [1.3521, 103.8198], to: [35.6762, 139.6503], color: [0.2, 0.2, 0.2] },
      ],
      arcColor: [0.2, 0.2, 0.2],
      arcWidth: 1.1,
      arcHeight: 0.3,
      onRender: (state) => {
        phi += 0.003;
        state.phi = phi;
        if (width) {
          state.width = width * dpr;
          state.height = width * dpr;
        }
      },
    });

    return () => {
      globe.destroy();
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <div className="relative w-full max-w-[560px] aspect-square flex items-center justify-center select-none">
      {/* Soft translucent sphere shadow & outer rim as seen in reference */}
      <div className="absolute inset-4 rounded-full bg-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.12),0_0_0_1px_rgba(0,0,0,0.06),inset_0_0_40px_rgba(0,0,0,0.04)] pointer-events-none" />

      {/* WebGL Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full relative z-10"
        style={{ width: "100%", height: "100%", contain: "layout paint size" }}
      />

      {/* Floating Network Telemetry Labels matching reference image */}
      <div className="absolute z-20 top-[18%] left-[22%] flex items-center gap-1 pointer-events-none">
        <span className="globe-badge">437k req/s</span>
      </div>
      <div className="absolute z-20 top-[23%] left-[16%] pointer-events-none">
        <span className="globe-node-label">iad1 ▲</span>
      </div>

      <div className="absolute z-20 top-[23%] left-[38%] pointer-events-none">
        <span className="globe-node-label">dub1</span>
      </div>
      <div className="absolute z-20 top-[18%] left-[48%] pointer-events-none">
        <span className="globe-node-label">arn1 ▲</span>
      </div>
      <div className="absolute z-20 top-[26%] left-[44%] pointer-events-none">
        <span className="globe-node-label">cdg1</span>
      </div>

      <div className="absolute z-20 top-[28%] right-[22%] flex items-center gap-1 pointer-events-none">
        <span className="globe-badge">198k req/s</span>
      </div>
      <div className="absolute z-20 top-[32%] right-[14%] flex items-center gap-1 pointer-events-none">
        <span className="globe-badge">221k req/s</span>
      </div>

      <div className="absolute z-20 top-[40%] right-[12%] pointer-events-none">
        <span className="globe-node-label">bom1 ▲</span>
      </div>
      <div className="absolute z-20 top-[46%] right-[8%] pointer-events-none">
        <span className="globe-node-label">sin1 ▲</span>
      </div>

      <div className="absolute z-20 top-[42%] left-[4%] flex items-center gap-1 pointer-events-none">
        <span className="globe-badge">463k req/s</span>
      </div>
      <div className="absolute z-20 top-[60%] left-[16%] pointer-events-none">
        <span className="globe-node-label">gru1 ▲</span>
      </div>
    </div>
  );
}