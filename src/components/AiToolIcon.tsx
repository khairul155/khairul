
import React from "react";
import { cn } from "@/lib/utils";
import { Coins } from "lucide-react";

interface AiToolIconProps {
  icon: "IG" | "MD" | "GD" | "IP" | "IU" | "BI" | "DM"; // Added DM for Demo
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
  const colorMap = {
    IG: "bg-blue-500",
    MD: "bg-gray-800",
    GD: "bg-purple-600",
    IP: "bg-orange-500",
    IU: "bg-pink-500",
    BI: "bg-yellow-500",
    DM: "bg-green-500", // New Demo icon color
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
        
        <span className="text-white text-lg font-bold">
          {icon}
        </span>
      </div>
      <h3 className="font-semibold text-sm md:text-base text-gray-800 dark:text-gray-200">
        {label}
      </h3>
    </div>
  );
};

export default AiToolIcon;
