import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export default function GlassCard({ children, className, ...props }: GlassCardProps) {
  return (
    <div
      className={cn("rounded-2xl p-4", className)}
      style={{
        background: 'var(--glass-bg)',
        backdropFilter: 'var(--glass-backdrop)',
        border: '1px solid var(--glass-border)',
      }}
      {...props}
    >
      {children}
    </div>
  );
}
