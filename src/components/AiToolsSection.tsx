
import { useNavigate } from "react-router-dom";
import AiToolIcon from "./AiToolIcon";

const AiToolsSection = () => {
  const navigate = useNavigate();

  const handleToolClick = (toolName: string, route?: string) => {
    console.log(`${toolName} clicked`);
    
    if (route) {
      navigate(route);
    } else {
      // This is a placeholder for actual tool functionality
      // You can implement specific actions for each tool here
    }
  };

  return (
    <div className="py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-10 text-gray-800 dark:text-white">
          Our AI Tools
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 justify-items-center">
          <AiToolIcon 
            icon="IG"
            label="Image Generator"
            description="AI-powered image generation tool"
            color="blue"
            onClick={() => handleToolClick("Image Generator")}
          />
          
          <AiToolIcon 
            icon="MD"
            label="Meta Data Generator"
            description="Extracts and generates metadata for images"
            color="green"
            onClick={() => handleToolClick("Meta Data Generator", "/metadata-generator")}
          />
          
          <AiToolIcon 
            icon="GD"
            label="Graphic Designer Bot"
            description="AI-based graphic design assistant"
            color="purple"
            onClick={() => handleToolClick("Graphic Designer Bot", "/graphic-designer-bot")}
          />
          
          <AiToolIcon 
            icon="IP"
            label="Image to Prompt"
            description="Converts images into detailed text prompts"
            color="orange"
            onClick={() => handleToolClick("Image to Prompt", "/image-to-prompt")}
          />
          
          <AiToolIcon 
            icon="IU"
            label="Image Upscaler"
            description="AI-powered tool for upscaling images"
            color="pink"
            onClick={() => handleToolClick("Image Upscaler", "/image-upscaler")}
          />
          
          <AiToolIcon 
            icon="BI"
            label="Bulk Image Size Increaser"
            description="Batch processing tool to enlarge multiple images"
            color="yellow"
            onClick={() => handleToolClick("Bulk Image Size Increaser", "/bulk-image-size-increaser")}
          />
        </div>
      </div>
    </div>
  );
};

export default AiToolsSection;
