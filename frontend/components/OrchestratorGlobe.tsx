"use client";

import React, { useEffect, useRef, useState } from "react";
import { Cpu, Zap, Shield, Server, Activity, ArrowUpRight } from "lucide-react";

interface NodePoint {
  id: string;
  name: string;
  region: string;
  gpu: string;
  lat: number;
  lng: number;
  latency: number;
  models: string[];
  status: "active" | "routing" | "standby";
}

const NODES: NodePoint[] = [
  { id: "us-west",    name: "US West (San Francisco)", region: "us-west-1", gpu: "8x H100 SXM5", lat: 37.7, lng: -122.4, latency: 28, models: ["Llama 3 8B", "DeepSeek Coder"], status: "routing" },
  { id: "us-east",    name: "US East (N. Virginia)",   region: "us-east-1", gpu: "16x A100 80GB", lat: 38.9, lng: -77.0,  latency: 32, models: ["Mistral 7B", "FinGPT"],      status: "active" },
  { id: "eu-west",    name: "EU West (London)",        region: "eu-west-1", gpu: "8x H100 NVL",  lat: 51.5, lng: -0.1,   latency: 41, models: ["BioMistral 7B"],             status: "active" },
  { id: "eu-central", name: "EU Central (Frankfurt)",  region: "eu-central",gpu: "12x A100 80GB", lat: 50.1, lng: 8.6,    latency: 38, models: ["Llama 3 8B", "LLaVA 1.5"],   status: "routing" },
  { id: "ap-south",   name: "AP South (Mumbai)",       region: "ap-south-1",gpu: "8x H100 SXM5", lat: 19.0, lng: 72.8,   latency: 45, models: ["DeepSeek Coder", "FinGPT"],  status: "active" },
  { id: "ap-east",    name: "AP East (Tokyo)",         region: "ap-northeast-1", gpu: "8x A100 80GB", lat: 35.6, lng: 139.6, latency: 44, models: ["LLaVA 1.5", "Mistral 7B"], status: "routing" },
  { id: "ap-se",      name: "AP Southeast (Singapore)",region: "ap-southeast-1", gpu: "8x H100 NVL", lat: 1.3, lng: 103.8,  latency: 39, models: ["Llama 3 8B"],                status: "active" },
];

export default function OrchestratorGlobe() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeNode, setActiveNode] = useState<NodePoint>(NODES[0]);
  const [activeTab, setActiveTab] = useState<"mesh" | "latency" | "routing">("mesh");
  const rotationRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let angle = 0;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.min(width, height) * 0.38;

      ctx.clearRect(0, 0, width, height);

      // 1. Background Grid & Outer Atmospheric Circles
      ctx.strokeStyle = "rgba(0, 0, 0, 0.04)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 1.22, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 1.05, 0, Math.PI * 2);
      ctx.stroke();

      // 2. Base Sphere Fill with Soft Gradient
      const sphereGrad = ctx.createRadialGradient(
        centerX - radius * 0.3,
        centerY - radius * 0.3,
        radius * 0.1,
        centerX,
        centerY,
        radius
      );
      sphereGrad.addColorStop(0, "#FFFFFF");
      sphereGrad.addColorStop(0.7, "#F8F9FB");
      sphereGrad.addColorStop(1, "#E9ECF2");

      ctx.fillStyle = sphereGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fill();

      // Sphere border
      ctx.strokeStyle = "rgba(0, 0, 0, 0.08)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // 3. Rotating 3D Longitudinal & Latitudinal Wireframe Rings
      angle += 0.006;
      rotationRef.current = angle;

      // Draw latitude lines
      for (let i = -2; i <= 2; i++) {
        const latY = centerY + (i * radius) / 3;
        const latRadius = Math.sqrt(Math.max(0, radius * radius - (latY - centerY) * (latY - centerY)));
        ctx.strokeStyle = "rgba(0, 0, 0, 0.05)";
        ctx.beginPath();
        ctx.ellipse(centerX, latY, latRadius, latRadius * 0.28, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Draw rotating longitude lines
      for (let j = 0; j < 6; j++) {
        const rot = angle + (j * Math.PI) / 6;
        const rx = Math.abs(Math.cos(rot)) * radius;
        ctx.strokeStyle = j % 2 === 0 ? "rgba(2, 132, 199, 0.15)" : "rgba(0, 0, 0, 0.04)";
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, rx, radius, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // 4. Draw Simulated Global Network Nodes & Data Arcs
      const nodePositions: { x: number; y: number; node: NodePoint; visible: boolean }[] = [];

      NODES.forEach((node, idx) => {
        // Project 3D sphere coordinate with rotation
        const nodeAngle = (node.lng * Math.PI) / 180 + angle;
        const latRad = (node.lat * Math.PI) / 180;

        const x = centerX + radius * Math.cos(latRad) * Math.sin(nodeAngle);
        const y = centerY - radius * Math.sin(latRad) * 0.9 + Math.cos(latRad) * Math.cos(nodeAngle) * radius * 0.2;
        const z = Math.cos(latRad) * Math.cos(nodeAngle); // z > 0 = front facing

        const isVisible = z > -0.2;
        nodePositions.push({ x, y, node, visible: isVisible });

        if (isVisible) {
          // Glow halo
          const isSelected = activeNode.id === node.id;
          ctx.fillStyle = isSelected
            ? "rgba(2, 132, 199, 0.25)"
            : node.status === "routing"
            ? "rgba(16, 185, 129, 0.2)"
            : "rgba(0, 0, 0, 0.08)";
          ctx.beginPath();
          ctx.arc(x, y, isSelected ? 12 : 7, 0, Math.PI * 2);
          ctx.fill();

          // Node Pin
          ctx.fillStyle = isSelected
            ? "#0284C7"
            : node.status === "routing"
            ? "#10B981"
            : "#18181B";
          ctx.beginPath();
          ctx.arc(x, y, isSelected ? 5 : 3.5, 0, Math.PI * 2);
          ctx.fill();

          // Pin outline
          ctx.strokeStyle = "#FFFFFF";
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      });

      // 5. Connect Front-Facing Active Nodes with Animated Data Arcs
      for (let a = 0; a < nodePositions.length; a++) {
        for (let b = a + 1; b < nodePositions.length; b++) {
          const p1 = nodePositions[a];
          const p2 = nodePositions[b];

          if (p1.visible && p2.visible && (a + b) % 2 === 0) {
            // Draw curved arc between nodes
            const midX = (p1.x + p2.x) / 2;
            const midY = (p1.y + p2.y) / 2 - 25;

            ctx.strokeStyle = p1.node.id === activeNode.id || p2.node.id === activeNode.id
              ? "rgba(2, 132, 199, 0.45)"
              : "rgba(0, 0, 0, 0.08)";
            ctx.lineWidth = p1.node.id === activeNode.id || p2.node.id === activeNode.id ? 1.5 : 1;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.quadraticCurveTo(midX, midY, p2.x, p2.y);
            ctx.stroke();

            // Animated packet moving on arc
            const packetT = ((Date.now() / 1600) + (a * 0.3)) % 1;
            const px = (1 - packetT) * (1 - packetT) * p1.x + 2 * (1 - packetT) * packetT * midX + packetT * packetT * p2.x;
            const py = (1 - packetT) * (1 - packetT) * p1.y + 2 * (1 - packetT) * packetT * midY + packetT * packetT * p2.y;

            ctx.fillStyle = "#0284C7";
            ctx.beginPath();
            ctx.arc(px, py, 2.5, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // 6. Central Core Hub Marker
      ctx.fillStyle = "rgba(2, 132, 199, 0.12)";
      ctx.beginPath();
      ctx.arc(centerX, centerY, 18, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#09090B";
      ctx.beginPath();
      ctx.arc(centerX, centerY, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "#0284C7";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [activeNode]);

  return (
    <div className="w-full max-w-[540px] flex flex-col bg-white border border-[#E4E4E7] rounded-lg shadow-sm overflow-hidden">
      {/* Top Visualizer Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#E4E4E7] bg-[#FAFAFA]">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
          <span className="font-mono text-xs font-bold text-black tracking-wide">
            GLOBAL_INFERENCE_MESH
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab("mesh")}
            className={`px-2.5 py-1 text-[0.68rem] font-mono font-medium rounded transition-colors ${
              activeTab === "mesh" ? "bg-black text-white" : "text-[#71717A] hover:text-black"
            }`}
          >
            3D_SPHERE
          </button>
          <button
            onClick={() => setActiveTab("latency")}
            className={`px-2.5 py-1 text-[0.68rem] font-mono font-medium rounded transition-colors ${
              activeTab === "latency" ? "bg-black text-white" : "text-[#71717A] hover:text-black"
            }`}
          >
            CLUSTERS
          </button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="relative aspect-square w-full flex items-center justify-center p-2 bg-gradient-to-b from-[#FAFAFA] to-white">
        <canvas
          ref={canvasRef}
          width={500}
          height={500}
          className="w-full h-full max-w-[460px] max-h-[460px]"
        />

        {/* Overlay Telemetry Badge (Top Left) */}
        <div className="absolute top-4 left-4 border border-[#E4E4E7] bg-white/90 backdrop-blur-sm p-2.5 rounded shadow-sm text-[0.65rem] font-mono text-[#71717A]">
          <div className="text-black font-bold flex items-center gap-1 mb-0.5">
            <Activity className="w-3 h-3 text-[#0284C7]" />
            LIVE METRICS
          </div>
          <div>P50: <span className="text-black font-semibold">{activeNode.latency}ms</span></div>
          <div>ROUTING: <span className="text-[#10B981] font-semibold">100% OK</span></div>
        </div>

        {/* Selected Cluster Floating Card (Bottom Right) */}
        <div className="absolute bottom-4 right-4 border border-[#E4E4E7] bg-white/95 backdrop-blur-sm p-3 rounded shadow-sm max-w-[210px] text-left">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-xs font-sans font-bold text-black truncate">
              {activeNode.region}
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
          </div>
          <div className="text-[0.65rem] font-mono text-[#71717A] mb-1.5">
            {activeNode.gpu}
          </div>
          <div className="flex items-center justify-between text-[0.62rem] font-mono pt-1.5 border-t border-[#E4E4E7]">
            <span className="text-[#0284C7] font-semibold">{activeNode.latency}ms RTT</span>
            <span className="text-black">{activeNode.models[0]}</span>
          </div>
        </div>
      </div>

      {/* Interactive Cluster Selector Bar */}
      <div className="p-3 bg-[#FAFAFA] border-t border-[#E4E4E7] grid grid-cols-3 sm:grid-cols-4 gap-1.5">
        {NODES.slice(0, 4).map((node) => (
          <button
            key={node.id}
            onClick={() => setActiveNode(node)}
            className={`px-2 py-1.5 rounded border text-left transition-all ${
              activeNode.id === node.id
                ? "border-black bg-white shadow-xs"
                : "border-[#E4E4E7] bg-white/60 hover:bg-white text-[#71717A]"
            }`}
          >
            <div className="text-[0.68rem] font-sans font-bold text-black truncate">
              {node.region}
            </div>
            <div className="text-[0.6rem] font-mono text-[#71717A] flex items-center justify-between mt-0.5">
              <span>{node.latency}ms</span>
              <span className="w-1 h-1 rounded-full bg-[#10B981]" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}