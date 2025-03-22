
import React from "react";
import { cn } from "@/lib/utils";

interface AiToolIconProps {
  icon: "IG" | "MD" | "GD" | "IP" | "IU" | "BI"; // Icon names
  label: string;
  description: string;
  color: string;
  onClick?: () => void;
  className?: string;
  isActive?: boolean;
}

const AiToolIcon: React.FC<AiToolIconProps> = ({ 
  icon, 
  label, 
  description, 
  color, 
  onClick,
  className,
  isActive = false
}) => {
  // Map of background colors for each icon type
  const colorMap = {
    IG: "bg-gradient-to-br from-green-400 to-yellow-300", // Image Generator
    MD: "bg-gradient-to-br from-green-300 to-lime-200", // Meta Data Generator
    GD: "bg-gradient-to-br from-purple-400 to-violet-300", // Graphic Designer Bot
    IP: "bg-gradient-to-br from-orange-400 to-amber-300", // Image to Prompt
    IU: "bg-gradient-to-br from-rose-400 to-pink-300", // Image Upscaler
    BI: "bg-gradient-to-br from-amber-400 to-yellow-300", // Bulk Image Size Increaser
  };

  return (
    <div 
      className={cn(
        "flex flex-col items-center text-center cursor-pointer transition-transform hover:scale-105",
        isActive && "scale-105",
        className
      )}
      onClick={onClick}
    >
      <div className={cn(
        "w-24 h-24 rounded-2xl shadow-lg flex items-center justify-center mb-2 relative",
        colorMap[icon],
        isActive && "ring-2 ring-white ring-opacity-50"
      )}>
        {isActive && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full"></div>
        )}
        <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-sm">
          <span className="text-xl font-bold text-gray-800 dark:text-gray-200">{icon}</span>
        </div>
      </div>
      <h3 className="font-semibold text-sm md:text-base text-gray-800 dark:text-gray-200">{label}</h3>
      <p className="text-xs text-gray-600 dark:text-gray-300 max-w-[200px] mt-1">{description}</p>
    </div>
  );
};

export default AiToolIcon;
