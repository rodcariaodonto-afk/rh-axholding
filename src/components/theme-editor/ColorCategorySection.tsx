import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ColorInput } from './ColorInput';
import type { ColorVariable } from '@/types/appearance';

interface ColorCategorySectionProps {
  title: string;
  variables: ColorVariable[];
  values: Record<string, string>;
  onChange?: (key: string, value: string) => void;
  defaultOpen?: boolean;
}

export function ColorCategorySection({ 
  title, 
  variables, 
  values, 
  onChange,
  defaultOpen = false 
}: ColorCategorySectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const readOnly = !onChange;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2 hover:bg-muted/50 rounded-md text-sm font-medium transition-colors">
        <span>{title}</span>
        <ChevronDown className={`size-4 transition-transform duration-200 ${isOpen ? '' : '-rotate-90'}`} />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="px-3 pb-2">
          {variables.map((variable) => (
            <ColorInput
              key={variable.key}
              label={variable.label}
              value={values[variable.key] || '0 0% 0%'}
              onChange={readOnly ? undefined : (value) => onChange?.(variable.key, value)}
              readOnly={readOnly}
            />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
