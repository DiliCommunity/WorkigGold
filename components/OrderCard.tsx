import { ExternalLink, Calendar, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

const statusColors: Record<string, string> = {
  NEW: "bg-accent-ocean/20 text-secondary border-secondary/30",
  FILTERED: "bg-primary/20 text-primary border-primary/30",
  APPROVED: "bg-accent-green/20 text-accent-green border-accent-green/30",
  REJECTED: "bg-red-500/20 text-red-400 border-red-500/30",
  IN_PROGRESS: "bg-primary/20 text-primary border-primary/30",
};

export type UiOrder = {
  id: string;
  title: string;
  description: string;
  platform: string;
  budget: number | null;
  currency: string;
  clientName: string | null;
  skills: string[];
  status: string;
  filterScore: number | null;
  url: string | null;
  createdAt: string | Date;
};

export function OrderCard({ order }: { order: UiOrder }) {
  const statusStyle = statusColors[order.status] || "bg-white/10 text-foreground";

  return (
    <article className="bg-card rounded-xl border border-white/5 hover:border-primary/20 transition-all p-6">
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold text-foreground truncate">{order.title}</h3>
            <span
              className={cn(
                "px-2 py-0.5 rounded text-xs font-medium border shrink-0",
                statusStyle
              )}
            >
              {order.status}
            </span>
          </div>
          <p className="text-foreground/70 text-sm line-clamp-2 mb-4">
            {order.description}
          </p>
          <div className="flex flex-wrap gap-2 mb-3">
            {order.skills.map((skill) => (
              <span
                key={skill}
                className="px-2 py-0.5 rounded bg-accent-ocean/10 text-secondary text-xs"
              >
                {skill}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-4 text-sm text-foreground/50">
            <span className="flex items-center gap-1">
              <DollarSign className="w-4 h-4" />
              {order.budget ?? "—"} {order.currency}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {order.platform}
            </span>
            {order.clientName && <span>{order.clientName}</span>}
          </div>
        </div>
        <a
          href={order.url || "#"}
          target={order.url ? "_blank" : undefined}
          rel={order.url ? "noreferrer" : undefined}
          className="p-2 rounded-lg hover:bg-card-hover text-primary shrink-0"
          title="Открыть"
        >
          <ExternalLink className="w-5 h-5" />
        </a>
      </div>
      {order.filterScore != null && (
        <p className="text-xs text-foreground/40 mt-3">
          Релевантность: {Math.round(order.filterScore * 100)}%
        </p>
      )}
    </article>
  );
}
