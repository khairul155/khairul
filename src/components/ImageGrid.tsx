
import React from 'react';
import { Download, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface ImageGridProps {
  images: string[];
  prompt: string;
}

const ImageGrid: React.FC<ImageGridProps> = ({ images, prompt }) => {
  const { toast } = useToast();

  const downloadImage = (imageUrl: string, index: number) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `ai-generated-image-${Date.now()}-${index}.webp`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Download started",
      description: "Your image is being downloaded",
    });
  };

  const copyPrompt = () => {
    navigator.clipboard.writeText(prompt);
    toast({
      title: "Copied!",
      description: "Prompt copied to clipboard",
    });
  };

  // Calculate grid columns based on number of images
  const getGridClass = () => {
    switch (images.length) {
      case 1: return "grid-cols-1";
      case 2: return "grid-cols-1 md:grid-cols-2";
      case 3: return "grid-cols-1 md:grid-cols-3";
      case 4: return "grid-cols-2";
      default: return "grid-cols-1";
    }
  };

  return (
    <div className="space-y-4">
      <div className={`grid ${getGridClass()} gap-4`}>
        {images.map((image, index) => (
          <div key={index} className="relative group overflow-hidden rounded-lg">
            <img 
              src={image} 
              alt={`Generated image ${index + 1}`}
              className="w-full h-auto object-cover rounded-lg transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
              <div className="flex justify-end gap-2">
                <Button 
                  onClick={() => downloadImage(image, index)} 
                  variant="outline" 
                  size="sm" 
                  className="rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 border-transparent text-white"
                >
                  <Download className="w-4 h-4" />
                </Button>
                <Button 
                  onClick={copyPrompt} 
                  variant="outline" 
                  size="sm" 
                  className="rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 border-transparent text-white"
                >
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="bg-white/10 dark:bg-gray-800/20 backdrop-blur-md rounded-lg p-4">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          <span className="font-semibold">Prompt:</span> {prompt}
        </p>
      </div>
    </div>
  );
};

export default ImageGrid;
