import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "secondary" | "ghost" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    const baseClasses = "inline-flex items-center justify-center font-mono text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50";
    const variantClasses = {
      default: "bg-black text-white hover:bg-[#FF4500]",
      outline: "border border-black/15 bg-transparent text-black hover:bg-black hover:text-white",
      secondary: "bg-black/[0.04] text-black hover:bg-black/10",
      ghost: "hover:bg-black/5 text-black",
      destructive: "bg-red-600 text-white hover:bg-red-700",
    }[variant];
    const sizeClasses = {
      default: "px-4 py-2",
      sm: "px-3 py-1.5 text-[10px]",
      lg: "px-6 py-3",
      icon: "p-2",
    }[size];

    return (
      <button
        ref={ref}
        className={cn(baseClasses, variantClasses, sizeClasses, className)}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
