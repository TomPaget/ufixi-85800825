import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes } from "react";

interface GradientButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  size?: "default" | "lg";
}

export default function GradientButton({ children, className, size = "default", disabled, ...props }: GradientButtonProps) {
  return (
    <button
      className={cn(
        "w-full rounded-2xl font-bold transition-all active:scale-95 hover:scale-[1.02]",
        size === "lg" ? "py-5 px-8 text-base" : "py-4 px-6 text-sm",
        disabled ? "opacity-40 cursor-not-allowed" : "",
        className
      )}
      disabled={disabled}
      style={{
        background: disabled ? "#cbd5e1" : "var(--gradient-primary)",
        boxShadow: disabled ? "none" : "var(--shadow-primary)",
        color: "#fff",
        letterSpacing: "0.01em",
      }}
      {...props}
    >
      {children}
    </button>
  );
}
