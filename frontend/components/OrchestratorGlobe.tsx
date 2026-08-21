"use client";

import { useEffect, useRef, useState } from "react";
import createGlobe from "cobe";

export default function OrchestratorGlobe() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerInteracting = useRef<number | null>(null);
  const pointerInteractionMovement = useRef(0);
  const [{ r }, setR] = useState({ r: 0 });

  useEffect(() => {
    let phi = 0;
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
      width: (width || 520) * dpr,
      height: (width || 520) * dpr,
      phi: 0,
      theta: 0.2,
      dark: 0,
      diffuse: 1.2,
      mapSamples: 16000,
      mapBrightness: 1.5,
      mapBaseBrightness: 0.05,
      baseColor: [0.94, 0.95, 0.97],
      markerColor: [0.05, 0.55, 0.95],
      glowColor: [0.88, 0.91, 0.96],
      scale: 1.05,
      offset: [0, 0],
      markers: [
        { location: [37.7749, -122.4194], size: 0.07 }, // US West (SF)
        { location: [40.7128, -74.0060],  size: 0.07 }, // US East (NYC)
        { location: [51.5074, -0.1278],   size: 0.06 }, // London (EU West)
        { location: [52.5200, 13.4050],   size: 0.06 }, // Frankfurt/Berlin
        { location: [35.6762, 139.6503],  size: 0.06 }, // Tokyo
        { location: [1.3521, 103.8198],   size: 0.05 }, // Singapore
        { location: [19.0760, 72.8777],   size: 0.06 }, // Mumbai (AP South)
        { location: [-33.8688, 151.2093], size: 0.05 }, // Sydney
      ],
      arcs: [
        { from: [37.7749, -122.4194], to: [40.7128, -74.0060], color: [0.05, 0.55, 0.95] },
        { from: [40.7128, -74.0060],  to: [51.5074, -0.1278],   color: [0.05, 0.55, 0.95] },
        { from: [51.5074, -0.1278],   to: [52.5200, 13.4050],   color: [0.1, 0.7, 0.4] },
        { from: [52.5200, 13.4050],   to: [19.0760, 72.8777],   color: [0.05, 0.55, 0.95] },
        { from: [19.0760, 72.8777],   to: [1.3521, 103.8198],   color: [0.95, 0.6, 0.1] },
        { from: [1.3521, 103.8198],   to: [35.6762, 139.6503],  color: [0.05, 0.55, 0.95] },
        { from: [35.6762, 139.6503],  to: [37.7749, -122.4194], color: [0.1, 0.7, 0.4] },
      ],
      arcColor: [0.05, 0.55, 0.95],
      arcWidth: 1.2,
      arcHeight: 0.35,
      onRender: (state) => {
        if (!pointerInteracting.current) {
          phi += 0.003;
        }
        state.phi = phi + r;
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
  }, [r]);

  return (
    <div className="relative w-full max-w-[540px] aspect-square flex items-center justify-center select-none group">
      {/* Outer ambient glow & technical sphere frame */}
      <div className="absolute inset-2 rounded-full bg-gradient-to-b from-[#F4F4F6] to-[#E9EAEF] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.1),0_0_0_1px_rgba(0,0,0,0.06),inset_0_2px_20px_rgba(255,255,255,0.8)] pointer-events-none" />

      {/* Interactive WebGL Canvas */}
      <canvas
        ref={canvasRef}
        onPointerDown={(e) => {
          pointerInteracting.current = e.clientX - pointerInteractionMovement.current;
          canvasRef.current?.classList.add("cursor-grabbing");
        }}
        onPointerUp={() => {
          pointerInteracting.current = null;
          canvasRef.current?.classList.remove("cursor-grabbing");
        }}
        onPointerOut={() => {
          pointerInteracting.current = null;
          canvasRef.current?.classList.remove("cursor-grabbing");
        }}
        onMouseMove={(e) => {
          if (pointerInteracting.current !== null) {
            const delta = e.clientX - pointerInteracting.current;
            pointerInteractionMovement.current = delta;
            setR({ r: delta / 200 });
          }
        }}
        onTouchMove={(e) => {
          if (pointerInteracting.current !== null && e.touches[0]) {
            const delta = e.touches[0].clientX - pointerInteracting.current;
            pointerInteractionMovement.current = delta;
            setR({ r: delta / 100 });
          }
        }}
        className="w-full h-full relative z-10 cursor-grab transition-opacity duration-500"
        style={{ width: "100%", height: "100%", contain: "layout paint size" }}
      />

      {/* Real-time AI Inference Node Badges */}
      <div className="absolute z-20 top-[14%] left-[16%] flex items-center gap-1 pointer-events-none animate-pulse">
        <span className="bg-black text-white text-[0.62rem] font-mono font-semibold px-2 py-0.5 rounded shadow-sm">
          us-east-1 // 34ms
        </span>
      </div>

      <div className="absolute z-20 top-[20%] right-[18%] flex items-center gap-1 pointer-events-none">
        <span className="bg-white border border-[#E4E4E7] text-[#0A0A0A] text-[0.62rem] font-mono font-bold px-2 py-0.5 rounded shadow-sm">
          eu-central // 41ms
        </span>
      </div>

      <div className="absolute z-20 bottom-[24%] right-[14%] flex items-center gap-1 pointer-events-none">
        <span className="bg-black text-white text-[0.62rem] font-mono font-semibold px-2 py-0.5 rounded shadow-sm">
          ap-south (GPU-H100)
        </span>
      </div>

      <div className="absolute z-20 bottom-[18%] left-[20%] flex items-center gap-1 pointer-events-none">
        <span className="bg-white border border-[#0284C7]/30 text-[#0284C7] text-[0.62rem] font-mono font-bold px-2 py-0.5 rounded shadow-sm">
          ● ROUTING ACTIVE
        </span>
      </div>

      {/* Interactive hint */}
      <div className="absolute bottom-1 right-2 z-20 text-[0.6rem] font-mono text-[#A1A1AA] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
        [ Drag to rotate 3D Mesh ]
      </div>
    </div>
  );
}