
import React from 'react';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

interface NumberSelectorProps {
  title: string;
  options: number[];
  selectedValue: number;
  onSelect: (value: number) => void;
  className?: string;
}

const NumberSelector: React.FC<NumberSelectorProps> = ({
  title,
  options,
  selectedValue,
  onSelect,
  className
}) => {
  return (
    <div className={cn("space-y-2", className)}>
      <h3 className="text-sm font-medium">{title}</h3>
      <ToggleGroup 
        type="single" 
        value={selectedValue.toString()} 
        onValueChange={(value) => {
          if (value) onSelect(parseInt(value));
        }}
        className="flex flex-wrap gap-2"
      >
        {options.map((value) => (
          <ToggleGroupItem
            key={value}
            value={value.toString()}
            className="h-9 w-9 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
          >
            {value}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
};

export default NumberSelector;
