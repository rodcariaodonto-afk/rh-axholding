import { ScrollArea } from '@/components/ui/scroll-area';
import { ColorCategorySection } from './ColorCategorySection';
import { COLOR_CATEGORIES } from '@/constants/appearanceOptions';

interface ThemeEditorSidebarProps {
  colorValues: Record<string, string>;
  onColorChange?: (key: string, value: string) => void;
}

export function ThemeEditorSidebar({ colorValues, onColorChange }: ThemeEditorSidebarProps) {
  const readOnly = !onColorChange;
  
  return (
    <div className="flex flex-col h-full border-r bg-background">
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-1">
          {COLOR_CATEGORIES.map((category) => (
            <ColorCategorySection
              key={category.title}
              title={category.title}
              variables={category.variables}
              values={colorValues}
              onChange={onColorChange}
              defaultOpen={category.defaultOpen}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
