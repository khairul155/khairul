
import React from 'react';

interface AppIconProps {
  letter: string;
  name: string;
  description: string;
  gradient: string;
  textColor?: string;
}

const AppIcon: React.FC<AppIconProps> = ({ 
  letter, 
  name, 
  description, 
  gradient,
  textColor = "white" 
}) => {
  return (
    <div className="flex flex-col items-center">
      <div 
        className={`w-24 h-24 rounded-2xl shadow-lg flex items-center justify-center mb-2 ${gradient}`}
        style={{ position: 'relative', overflow: 'hidden' }}
      >
        {/* Abstract background shapes */}
        <div className="absolute opacity-20 w-16 h-16 rounded-full bg-white top-[-20px] right-[-20px]"></div>
        <div className="absolute opacity-20 w-12 h-12 rounded-full bg-white bottom-[-10px] left-[-10px]"></div>
        
        {/* Letter/Abbreviation */}
        <div className={`w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-md`}>
          <span className={`text-2xl font-bold text-${textColor}`} style={{ color: 'var(--text-color)' }}>
            {letter}
          </span>
        </div>
      </div>
      <span className="font-semibold text-sm">{name}</span>
      <span className="text-xs text-gray-500 text-center max-w-[120px]">{description}</span>
    </div>
  );
};

const AppIcons: React.FC = () => {
  const icons = [
    {
      letter: "IG",
      name: "Image Generator",
      description: "AI-powered image generation tool",
      gradient: "bg-gradient-to-br from-[#0EA5E9] to-[#0FA0CE]",
      textColor: "#0EA5E9"
    },
    {
      letter: "MD",
      name: "Meta Data Generator",
      description: "Extracts and generates metadata for images",
      gradient: "bg-gradient-to-br from-[#F2FCE2] to-[#8E9196]",
      textColor: "#555555"
    },
    {
      letter: "GD",
      name: "Graphic Designer Bot",
      description: "AI-based graphic design assistant",
      gradient: "bg-gradient-to-br from-[#9b87f5] to-[#6E59A5]",
      textColor: "#7E69AB"
    },
    {
      letter: "IP",
      name: "Image to Prompt",
      description: "Converts images into detailed text prompts",
      gradient: "bg-gradient-to-br from-[#F97316] to-[#FEC6A1]",
      textColor: "#F97316"
    },
    {
      letter: "IU",
      name: "Image Upscaler",
      description: "AI-powered tool for upscaling images",
      gradient: "bg-gradient-to-br from-[#ea384c] to-[#FDE1D3]",
      textColor: "#ea384c"
    },
    {
      letter: "BI",
      name: "Bulk Image Size Increaser",
      description: "Batch processing tool to enlarge multiple images",
      gradient: "bg-gradient-to-br from-[#FEF7CD] to-[#F97316]",
      textColor: "#F97316"
    }
  ];

  return (
    <div className="w-full">
      <h2 className="text-2xl font-bold text-center mb-8">Our AI Tools</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 justify-items-center">
        {icons.map((icon, index) => (
          <AppIcon
            key={index}
            letter={icon.letter}
            name={icon.name}
            description={icon.description}
            gradient={icon.gradient}
            textColor={icon.textColor}
          />
        ))}
      </div>
    </div>
  );
};

export default AppIcons;
