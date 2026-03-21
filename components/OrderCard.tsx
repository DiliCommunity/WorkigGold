import type { ReactNode } from "react";
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

const iconBtn =
  "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#141b26]";

export function OrderCard({
  order,
  actions,
}: {
  order: UiOrder;
  /** Кнопки избранное / срочно — в одной линии с ссылкой, без наложений */
  actions?: ReactNode;
}) {
  const statusStyle = statusColors[order.status] || "bg-white/10 text-foreground";

  return (
    <article className="bg-card rounded-xl border border-white/5 hover:border-primary/20 transition-all p-5 md:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-start sm:gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start gap-2 mb-2">
            <h3 className="font-semibold text-foreground min-w-0 flex-1 text-[15px] leading-snug">
              <span className="line-clamp-2">{order.title}</span>
            </h3>
            <span
              className={cn(
                "px-2 py-0.5 rounded text-xs font-medium border shrink-0 mt-0.5",
                statusStyle
              )}
            >
              {order.status}
            </span>
          </div>
          <p className="text-foreground/70 text-sm line-clamp-2 mb-3">
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
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-foreground/50">
            <span className="flex items-center gap-1">
              <DollarSign className="w-4 h-4 shrink-0" />
              {order.budget ?? "—"} {order.currency}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4 shrink-0" />
              {order.platform}
            </span>
            {order.clientName && <span className="truncate max-w-[200px]">{order.clientName}</span>}
          </div>
        </div>

        <div className="flex shrink-0 flex-row items-center justify-end gap-1.5 self-end sm:self-start">
          {actions}
          <a
            href={order.url || "#"}
            target={order.url ? "_blank" : undefined}
            rel={order.url ? "noreferrer" : undefined}
            className={cn(iconBtn, "hover:bg-card-hover text-primary border-white/10 hover:border-primary/30")}
            title="Открыть"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
      {order.filterScore != null && (
        <p className="text-xs text-foreground/40 mt-3">
          Релевантность: {Math.round(order.filterScore * 100)}%
        </p>
      )}
    </article>
  );
}

export { iconBtn };
