import { LucideIcon } from "lucide-react";

interface FeaturePillProps {
  icon: LucideIcon;
  label: string;
}

export default function FeaturePill({ icon: Icon, label }: FeaturePillProps) {
  return (
    <div
      className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold"
      style={{
        background: 'var(--glass-bg)',
        backdropFilter: 'var(--glass-backdrop)',
        border: '1px solid var(--glass-border)',
        color: 'var(--color-navy)',
      }}
    >
      <Icon className="w-3.5 h-3.5" style={{ color: 'var(--color-primary)' }} />
      {label}
    </div>
  );
}
