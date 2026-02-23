import { ShieldCheck } from "lucide-react";

export default function ZKBadge() {
  return (
    <span className="inline-flex items-center gap-1 font-mono text-sm text-green-400 border border-green-400/25 px-2 py-px tracking-widest uppercase">
      <ShieldCheck className="w-3 h-3" />
      zk
    </span>
  );
}
