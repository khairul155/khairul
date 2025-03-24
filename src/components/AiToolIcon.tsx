
import React from "react";
import { cn } from "@/lib/utils";

interface AiToolIconProps {
  icon: "IG" | "MD" | "GD" | "IP" | "IU" | "BI"; // Icon names
  label: string;
  color: string;
  onClick?: () => void;
  className?: string;
  isActive?: boolean;
  isUpcoming?: boolean;
}

const AiToolIcon: React.FC<AiToolIconProps> = ({ 
  icon, 
  label, 
  color, 
  onClick,
  className,
  isActive = false,
  isUpcoming = false
}) => {
  // Map of background colors for each icon type
  const colorMap = {
    IG: "bg-gradient-to-br from-green-400 to-yellow-300", // Image Generator
    MD: "bg-gradient-to-br from-[#0C0C0C] to-[#242424]", // Meta Data Generator
    GD: "bg-gradient-to-br from-purple-400 to-violet-300", // Graphic Designer Bot
    IP: "bg-gradient-to-br from-orange-400 to-amber-300", // Image to Prompt
    IU: "bg-gradient-to-br from-rose-400 to-pink-300", // Image Upscaler
    BI: "bg-gradient-to-br from-amber-400 to-yellow-300", // Bulk Image Size Increaser
  };

  return (
    <div 
      className={cn(
        "flex flex-col items-center text-center cursor-pointer transition-all duration-300",
        isUpcoming ? "opacity-70 pointer-events-none" : "hover:scale-110",
        isActive && "scale-110",
        className
      )}
      onClick={!isUpcoming ? onClick : undefined}
    >
      <div className={cn(
        "w-20 h-20 rounded-full shadow-lg flex items-center justify-center mb-3 relative transform transition-transform duration-300",
        colorMap[icon],
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
        
        <div className="w-14 h-14 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-sm">
          <span className={cn(
            "text-lg font-bold",
            icon === "MD" || icon === "GD" ? "text-[#FAF7F0]" : "text-gray-800 dark:text-gray-200"
          )}>
            {icon}
          </span>
        </div>
      </div>
      <h3 className={cn(
        "font-semibold text-sm md:text-base",
        icon === "MD" || icon === "GD" ? "text-[#FAF7F0]" : "text-gray-800 dark:text-gray-200"
      )}>
        {label}
      </h3>
    </div>
  );
};

export default AiToolIcon;
