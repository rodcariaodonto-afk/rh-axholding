import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface StarRatingProps {
  value: number | null;
  onChange: (value: number) => void;
  levels: 4 | 5;
  labels: string[];
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'size-5',
  md: 'size-7',
  lg: 'size-9',
};

const getStarColor = (index: number, total: number, isActive: boolean) => {
  if (!isActive) return 'text-muted-foreground/30';
  const ratio = index / (total - 1);
  if (ratio <= 0.25) return 'text-red-500 fill-red-500';
  if (ratio <= 0.5) return 'text-orange-500 fill-orange-500';
  if (ratio <= 0.75) return 'text-yellow-500 fill-yellow-500';
  return 'text-green-500 fill-green-500';
};

const getLabelColor = (index: number, total: number) => {
  const ratio = index / (total - 1);
  if (ratio <= 0.25) return 'text-red-500';
  if (ratio <= 0.5) return 'text-orange-500';
  if (ratio <= 0.75) return 'text-yellow-500';
  return 'text-green-500';
};

export function StarRating({
  value,
  onChange,
  levels,
  labels,
  disabled = false,
  size = 'md',
}: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);
  
  const displayValue = hoverValue ?? value;
  const currentLabel = displayValue ? labels[displayValue - 1] : null;

  return (
    <div className="flex flex-col items-center gap-2">
      <div 
        className="flex items-center gap-1"
        onMouseLeave={() => setHoverValue(null)}
      >
        {Array.from({ length: levels }, (_, i) => i + 1).map((starIndex) => {
          const isActive = displayValue !== null && starIndex <= displayValue;
          
          return (
            <button
              key={starIndex}
              type="button"
              disabled={disabled}
              className={cn(
                "transition-all duration-150",
                disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:scale-110"
              )}
              onClick={() => !disabled && onChange(starIndex)}
              onMouseEnter={() => !disabled && setHoverValue(starIndex)}
              aria-label={`${starIndex} de ${levels} estrelas: ${labels[starIndex - 1]}`}
            >
              <Star 
                className={cn(
                  sizeClasses[size],
                  "transition-colors duration-150",
                  getStarColor(starIndex - 1, levels, isActive)
                )} 
              />
            </button>
          );
        })}
      </div>
      
      {currentLabel && (
        <span className={cn(
          "text-sm font-medium transition-colors duration-150",
          getLabelColor((displayValue ?? 1) - 1, levels)
        )}>
          {currentLabel}
        </span>
      )}
    </div>
  );
}
