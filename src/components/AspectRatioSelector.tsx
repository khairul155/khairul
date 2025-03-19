
import React from 'react';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

export interface AspectRatio {
  id: string;
  label: string;
  width: number;
  height: number;
}

interface AspectRatioSelectorProps {
  aspectRatios: AspectRatio[];
  selectedRatio: string;
  onSelect: (ratio: string) => void;
  className?: string;
}

const AspectRatioSelector: React.FC<AspectRatioSelectorProps> = ({
  aspectRatios,
  selectedRatio,
  onSelect,
  className
}) => {
  return (
    <div className={cn("space-y-2", className)}>
      <h3 className="text-sm font-medium">Aspect Ratios</h3>
      <ToggleGroup 
        type="single" 
        value={selectedRatio} 
        onValueChange={(value) => {
          if (value) onSelect(value);
        }}
        className="flex flex-wrap gap-2"
      >
        {aspectRatios.map((ratio) => (
          <ToggleGroupItem
            key={ratio.id}
            value={ratio.id}
            className="h-9 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
          >
            {ratio.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
};

export default AspectRatioSelector;
