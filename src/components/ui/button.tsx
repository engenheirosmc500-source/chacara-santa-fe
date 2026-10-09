import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "gold" | "forest" | "ghost" | "outline" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    const base = "inline-flex items-center justify-center gap-2 font-display font-semibold transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none cursor-pointer rounded-full";
    
    const variants = {
      default: "bg-[#D4A72C] text-[#0F2A1F] hover:bg-[#F0DFA8] shadow-[0_12px_30px_-12px_rgba(212,167,44,0.7)] hover:-translate-y-0.5",
      gold: "bg-[#D4A72C] text-[#0F2A1F] hover:bg-[#F0DFA8] shadow-[0_12px_30px_-12px_rgba(212,167,44,0.7)] hover:-translate-y-0.5",
      forest: "bg-[#0F2A1F] text-white hover:bg-[#1A3B2C] shadow-md hover:-translate-y-0.5",
      ghost: "bg-white/10 text-white border border-white/30 backdrop-blur-md hover:bg-white hover:text-[#0F2A1F] hover:-translate-y-0.5",
      outline: "border border-[#0F2A1F]/20 text-[#0F2A1F] hover:bg-[#0F2A1F]/5",
      destructive: "bg-red-600 text-white hover:bg-red-700 shadow-md"
    };

    const sizes = {
      default: "min-h-[50px] px-6 text-[15px]",
      sm: "min-h-[40px] px-4 text-xs",
      lg: "min-h-[56px] px-8 text-base",
      icon: "w-10 h-10 p-0 rounded-full"
    };

    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
