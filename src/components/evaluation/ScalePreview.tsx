import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface ScalePreviewProps {
  levels: 4 | 5;
  labels: string[];
  className?: string;
}

const getLabelColor = (index: number, total: number) => {
  const ratio = index / (total - 1);
  if (ratio <= 0.25) return "text-red-500";
  if (ratio <= 0.5) return "text-orange-500";
  if (ratio <= 0.75) return "text-yellow-500";
  return "text-emerald-500";
};

export function ScalePreview({ levels, labels, className }: ScalePreviewProps) {
  const items = Array.from({ length: levels }, (_, i) => i);
  return (
    <div className={cn("space-y-3", className)}>
      {items.map((index) => (
        <div key={index} className="flex items-center gap-3">
          <div className="flex gap-0.5">
            {items.map((starIndex) => (
              <Star
                key={starIndex}
                className={cn(
                  "h-5 w-5",
                  starIndex <= index ? "fill-amber-400 text-amber-400" : "fill-muted text-muted"
                )}
              />
            ))}
          </div>
          <span className={cn("text-sm font-medium", getLabelColor(index, levels))}>
            {labels[index] || `Nível ${index + 1}`}
          </span>
        </div>
      ))}
    </div>
  );
}
