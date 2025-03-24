
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
  isUpcoming?: boolean;
}

const AiToolIcon: React.FC<AiToolIconProps> = ({ 
  icon, 
  label, 
  description, 
  color, 
  onClick,
  className,
  isActive = false,
  isUpcoming = false
}) => {
  // Map of background colors for each icon type - using vibrant gradient colors
  const colorMap = {
    IG: "bg-gradient-to-br from-purple-500 to-blue-500", // Image Generator
    MD: "bg-gradient-to-br from-blue-500 to-teal-400", // Meta Data Generator
    GD: "bg-gradient-to-br from-pink-500 to-orange-400", // Graphic Designer Bot
    IP: "bg-gradient-to-br from-yellow-400 to-amber-500", // Image to Prompt
    IU: "bg-gradient-to-br from-red-500 to-pink-500", // Image Upscaler
    BI: "bg-gradient-to-br from-green-500 to-emerald-400", // Bulk Image Size Increaser
  };

  // Map of complementary text colors
  const textColorMap = {
    IG: "text-white",
    MD: "text-white",
    GD: "text-white",
    IP: "text-black",
    IU: "text-white",
    BI: "text-white",
  };

  return (
    <div 
      className={cn(
        "flex flex-col items-center text-center cursor-pointer transition-all duration-300 hover:scale-110",
        isActive && "scale-105",
        className
      )}
      onClick={onClick}
    >
      <div className="relative">
        {isUpcoming && (
          <div className="absolute -top-2 -right-2 z-10 bg-amber-500 text-xs font-bold text-white rounded-full px-2 py-0.5">
            SOON
          </div>
        )}
        <div className={cn(
          "w-16 h-16 rounded-full shadow-lg flex items-center justify-center mb-2 transition-transform duration-300 hover:shadow-xl",
          colorMap[icon],
          isActive && "ring-2 ring-white"
        )}>
          {isActive && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
          )}
          <span className={cn(
            "text-xl font-bold",
            textColorMap[icon]
          )}>
            {icon}
          </span>
        </div>
      </div>
      <h3 className="font-semibold text-sm md:text-base text-gray-800 dark:text-gray-200">
        {label}
      </h3>
      <p className="text-xs text-gray-600 dark:text-gray-300 max-w-[120px] mt-1">{description}</p>
    </div>
  );
};

export default AiToolIcon;
