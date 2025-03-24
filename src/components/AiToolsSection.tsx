
import { useNavigate, useLocation } from "react-router-dom";
import AiToolIcon from "./AiToolIcon";

const AiToolsSection = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleToolClick = (toolName: string, route?: string) => {
    console.log(`${toolName} clicked`);
    
    if (route) {
      navigate(route);
    } else {
      // This is a placeholder for actual tool functionality
      // You can implement specific actions for each tool here
    }
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="py-12 px-4 bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-10 text-gray-800 dark:text-white bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
          Our AI Tools
        </h2>
        
        <div className="grid grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-8 justify-items-center">
          <AiToolIcon 
            icon="IG"
            label="Image Generator"
            color="blue"
            isActive={isActive("/image-generator")}
            onClick={() => handleToolClick("Image Generator", "/image-generator")}
          />
          
          <AiToolIcon 
            icon="MD"
            label="Meta Data Generator"
            color="gray"
            isActive={isActive("/metadata-generator")}
            onClick={() => handleToolClick("Meta Data Generator", "/metadata-generator")}
          />
          
          <AiToolIcon 
            icon="GD"
            label="Graphic Designer Bot"
            color="purple"
            isActive={isActive("/graphic-designer-bot")}
            onClick={() => handleToolClick("Graphic Designer Bot", "/graphic-designer-bot")}
          />
          
          <AiToolIcon 
            icon="IP"
            label="Image to Prompt"
            color="orange"
            isActive={isActive("/image-to-prompt")}
            onClick={() => handleToolClick("Image to Prompt", "/image-to-prompt")}
          />
          
          <AiToolIcon 
            icon="IU"
            label="Image Upscaler"
            color="pink"
            isActive={isActive("/image-upscaler")}
            isUpcoming={true} 
            onClick={() => handleToolClick("Image Upscaler", "/image-upscaler")}
          />
          
          <AiToolIcon 
            icon="BI"
            label="Bulk Image Tool"
            color="yellow"
            isActive={isActive("/bulk-image-size-increaser")}
            isUpcoming={true}
            onClick={() => handleToolClick("Bulk Image Size Increaser", "/bulk-image-size-increaser")}
          />
        </div>
      </div>
    </div>
  );
};

export default AiToolsSection;
