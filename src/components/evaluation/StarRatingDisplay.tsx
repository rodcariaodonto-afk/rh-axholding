import { Star, StarHalf } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingDisplayProps {
  value: number;
  maxValue: 4 | 5;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
}

const sizeClasses = {
  sm: 'size-3',
  md: 'size-4',
  lg: 'size-5',
};

const getStarColor = (ratio: number) => {
  if (ratio <= 0.25) return 'text-red-500';
  if (ratio <= 0.5) return 'text-orange-500';
  if (ratio <= 0.75) return 'text-yellow-500';
  return 'text-green-500';
};

export function StarRatingDisplay({
  value,
  maxValue,
  size = 'sm',
  showValue = true,
}: StarRatingDisplayProps) {
  const fullStars = Math.floor(value);
  const hasHalfStar = value - fullStars >= 0.5;
  const emptyStars = maxValue - fullStars - (hasHalfStar ? 1 : 0);
  const colorClass = getStarColor(value / maxValue);

  return (
    <div className="flex items-center gap-0.5">
      {/* Full stars */}
      {Array.from({ length: fullStars }).map((_, i) => (
        <Star key={`full-${i}`} className={cn(sizeClasses[size], colorClass, "fill-current")} />
      ))}
      
      {/* Half star */}
      {hasHalfStar && (
        <div className="relative">
          <Star className={cn(sizeClasses[size], "text-muted-foreground/30")} />
          <div className="absolute inset-0 overflow-hidden w-1/2">
            <Star className={cn(sizeClasses[size], colorClass, "fill-current")} />
          </div>
        </div>
      )}
      
      {/* Empty stars */}
      {Array.from({ length: emptyStars }).map((_, i) => (
        <Star key={`empty-${i}`} className={cn(sizeClasses[size], "text-muted-foreground/30")} />
      ))}
      
      {showValue && (
        <span className={cn("ml-1.5 text-sm font-medium", colorClass)}>
          {value.toFixed(1)}
        </span>
      )}
    </div>
  );
}
