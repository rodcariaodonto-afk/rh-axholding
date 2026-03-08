import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ArrowLeftRight } from 'lucide-react';

interface ColorInputProps {
  value: string;
  onChange?: (value: string) => void;
  label: string;
  readOnly?: boolean;
}

function hslToHex(hsl: string): string {
  const parts = hsl.match(/([\d.]+)\s+([\d.]+)%\s+([\d.]+)%/);
  if (!parts) return '#000000';
  
  const h = parseFloat(parts[1]) / 360;
  const s = parseFloat(parts[2]) / 100;
  const l = parseFloat(parts[3]) / 100;

  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };

  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  const toHex = (x: number) => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function hexToHsl(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '0 0% 0%';
  
  const r = parseInt(result[1], 16) / 255;
  const g = parseInt(result[2], 16) / 255;
  const b = parseInt(result[3], 16) / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export function ColorInput({ value, onChange, label, readOnly = false }: ColorInputProps) {
  const [hexValue, setHexValue] = useState(hslToHex(value));
  const isInternalUpdate = useRef(false);

  useEffect(() => {
    if (!isInternalUpdate.current) {
      setHexValue(hslToHex(value));
    }
    isInternalUpdate.current = false;
  }, [value]);

  const handleHexChange = (hex: string) => {
    if (readOnly) return;
    setHexValue(hex);
    const newHsl = hexToHsl(hex);
    isInternalUpdate.current = true;
    onChange?.(newHsl);
  };

  const handleColorPickerChange = (hex: string) => {
    if (readOnly) return;
    setHexValue(hex);
    const newHsl = hexToHsl(hex);
    isInternalUpdate.current = true;
    onChange?.(newHsl);
  };

  return (
    <div className="space-y-1.5 py-2">
      <label className="text-xs text-muted-foreground">{label}</label>
      <div className="flex items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="size-8 rounded-md border border-input shrink-0 cursor-pointer hover:ring-2 hover:ring-ring hover:ring-offset-1 hover:ring-offset-background transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: hexValue }}
              disabled={readOnly}
            />
          </PopoverTrigger>
          {!readOnly && (
            <PopoverContent className="w-auto p-3" align="start">
              <input
                type="color"
                value={hexValue}
                onChange={(e) => handleColorPickerChange(e.target.value)}
                className="w-48 h-32 rounded cursor-pointer border-0"
              />
            </PopoverContent>
          )}
        </Popover>
        
        <Input
          value={hexValue}
          onChange={(e) => handleHexChange(e.target.value)}
          className="flex-1 font-mono text-sm h-8"
          readOnly={readOnly}
          disabled={readOnly}
        />

        {!readOnly && (
          <Button
            variant="ghost"
            size="icon"
            className="size-8 shrink-0"
            onClick={() => {
              navigator.clipboard.writeText(hexValue);
            }}
          >
            <ArrowLeftRight className="size-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
