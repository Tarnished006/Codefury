import Link from "next/link";
import NeuralNavbar from "@/components/NeuralNavbar";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white text-black flex flex-col justify-between">
      <NeuralNavbar />
      <div className="max-w-[1440px] mx-auto px-6 lg:px-12 py-32 text-center flex flex-col items-center justify-center flex-1">
        <span className="font-mono text-xs tracking-widest text-[#71717A] uppercase mb-4">
          [ 404 // RESOURCE_NOT_FOUND ]
        </span>
        <h1 className="font-sans font-black text-6xl text-black mb-4">404</h1>
        <p className="font-mono text-sm text-[#71717A] max-w-md mb-8">
          The requested endpoint or agent interface does not exist on this network mesh.
        </p>
        <Link
          href="/"
          className="btn-solid-black"
        >
          RETURN_TO_BASE
        </Link>
      </div>
      <footer className="border-t border-[#E4E4E7] py-4 text-center text-xs font-mono text-[#71717A]">
        agentnet // 404 Handled
      </footer>
    </div>
  );
}