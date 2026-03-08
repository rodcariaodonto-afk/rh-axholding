import { cn } from "@/lib/utils";

interface EvaluationProgressRingProps {
  value: number;
  maxValue: number;
  label: string;
  size?: 'sm' | 'md' | 'lg';
  showNA?: boolean;
}

const sizeConfig = {
  sm: { width: 80, strokeWidth: 6, fontSize: 'text-lg', labelSize: 'text-xs' },
  md: { width: 100, strokeWidth: 8, fontSize: 'text-2xl', labelSize: 'text-sm' },
  lg: { width: 120, strokeWidth: 10, fontSize: 'text-3xl', labelSize: 'text-base' },
};

const getColorByValue = (value: number, maxValue: number) => {
  const ratio = value / maxValue;
  if (ratio <= 0.25) return { stroke: 'stroke-red-500', text: 'text-red-500' };
  if (ratio <= 0.5) return { stroke: 'stroke-orange-500', text: 'text-orange-500' };
  if (ratio <= 0.75) return { stroke: 'stroke-yellow-500', text: 'text-yellow-500' };
  return { stroke: 'stroke-green-500', text: 'text-green-500' };
};

export function EvaluationProgressRing({
  value,
  maxValue,
  label,
  size = 'md',
  showNA = false,
}: EvaluationProgressRingProps) {
  const config = sizeConfig[size];
  const radius = (config.width - config.strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = showNA ? 0 : (value / maxValue);
  const strokeDashoffset = circumference - (progress * circumference);
  const colors = getColorByValue(value, maxValue);
  
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: config.width, height: config.width }}>
        <svg 
          className="transform -rotate-90" 
          width={config.width} 
          height={config.width}
        >
          {/* Background circle */}
          <circle
            cx={config.width / 2}
            cy={config.width / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={config.strokeWidth}
            className="text-muted/20"
          />
          {/* Progress circle */}
          {!showNA && (
            <circle
              cx={config.width / 2}
              cy={config.width / 2}
              r={radius}
              fill="none"
              strokeWidth={config.strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className={cn("transition-all duration-500 ease-out", colors.stroke)}
            />
          )}
        </svg>
        
        {/* Value in center */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn(
            "font-bold",
            config.fontSize,
            showNA ? "text-muted-foreground" : colors.text
          )}>
            {showNA ? "N/A" : value.toFixed(1)}
          </span>
        </div>
      </div>
      
      <span className={cn("font-medium text-muted-foreground text-center", config.labelSize)}>
        {label}
      </span>
    </div>
  );
}
