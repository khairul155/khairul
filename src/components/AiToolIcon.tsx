
import React from "react";
import { cn } from "@/lib/utils";
import { Coins, Wand2, FileSearch, PenTool, ArrowLeftRight, ArrowUpFromLine, LayoutGrid } from "lucide-react";

interface AiToolIconProps {
  icon: "IG" | "MD" | "GD" | "IP" | "IU" | "BI"; // Icon names
  label: string;
  color: string;
  onClick?: () => void;
  className?: string;
  isActive?: boolean;
  isUpcoming?: boolean;
  tokens?: number;
}

const AiToolIcon: React.FC<AiToolIconProps> = ({ 
  icon, 
  label, 
  color, 
  onClick,
  className,
  isActive = false,
  isUpcoming = false,
  tokens
}) => {
  // Map of background colors for each icon type
  const colorMap = {
    IG: "bg-blue-500", // Image Generator
    MD: "bg-gray-800", // Meta Data Generator
    GD: "bg-purple-600", // Graphic Designer Bot
    IP: "bg-orange-500", // Image to Prompt
    IU: "bg-pink-500", // Image Upscaler
    BI: "bg-yellow-500", // Bulk Image Size Increaser
  };

  // Map of icons for each tool
  const iconMap = {
    IG: <Wand2 className="w-6 h-6 text-white" />,
    MD: <FileSearch className="w-6 h-6 text-white" />,
    GD: <PenTool className="w-6 h-6 text-white" />,
    IP: <ArrowLeftRight className="w-6 h-6 text-white" />,
    IU: <ArrowUpFromLine className="w-6 h-6 text-white" />,
    BI: <LayoutGrid className="w-6 h-6 text-white" />,
  };

  return (
    <div 
      className={cn(
        "flex flex-col items-center text-center transition-all duration-300",
        isUpcoming ? "opacity-70 pointer-events-none" : "hover:scale-110 cursor-pointer",
        isActive && "scale-110",
        className
      )}
      onClick={!isUpcoming ? onClick : undefined}
    >
      <div className={cn(
        "w-16 h-16 rounded-full shadow-lg flex items-center justify-center mb-3 relative transform transition-transform duration-300",
        colorMap[icon],
        "hover:shadow-xl",
        isActive && "ring-2 ring-white ring-opacity-70"
      )}>
        {isActive && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full"></div>
        )}
        
        {isUpcoming && (
          <div className="absolute -top-2 -right-2 bg-amber-500 text-[10px] font-bold text-white rounded-full px-2 py-1 z-10">
            SOON
          </div>
        )}
        
        {tokens && (
          <div className="absolute -top-2 -right-2 bg-blue-600 text-[10px] font-bold text-white rounded-full px-1.5 py-1 z-10 flex items-center gap-0.5">
            <Coins className="w-3 h-3" />
            <span>{tokens}</span>
          </div>
        )}
        
        {iconMap[icon] || <span className="text-white text-lg font-bold">{icon}</span>}
      </div>
      <h3 className="font-semibold text-sm md:text-base text-gray-800 dark:text-gray-200">
        {label}
      </h3>
    </div>
  );
};

export default AiToolIcon;
