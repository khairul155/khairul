
import React from 'react';
import { Download, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useCreditsContext } from '@/components/CreditsProvider';

interface ImageGridProps {
  images: string[];
  prompt: string;
  onRegenerate: () => void;
  generationTime?: string;
}

const ImageGrid: React.FC<ImageGridProps> = ({ images, prompt, onRegenerate, generationTime }) => {
  const { toast } = useToast();
  const { useTool } = useCreditsContext();
  
  const downloadImage = async (imageUrl: string, index: number) => {
    // Convert webp to jpg for download
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      
      // Export as JPG
      const jpgUrl = canvas.toDataURL('image/jpeg', 0.9);
      
      const link = document.createElement('a');
      link.href = jpgUrl;
      link.download = `pixcraft-ai-image-${Date.now()}-${index}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };
    
    img.src = imageUrl;
  };

  const handleRegenerate = async () => {
    // Use 1 credit for regeneration
    const result = await useTool('image_generator', 1, 
      // On success, call the onRegenerate callback
      () => onRegenerate(),
      // On error, show a toast (useTool already shows a toast, but this is a fallback)
      (message) => {
        // The useTool function already shows a toast, so this is just a fallback
      }
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-center">
        {images.map((image, index) => (
          <div key={index} className="relative group overflow-hidden rounded-lg max-w-full mx-auto w-[90%]">
            <img 
              src={image} 
              alt={`Generated image ${index + 1}`}
              className="w-full h-auto object-contain rounded-lg"
              style={{ maxWidth: "90vw", maxHeight: "70vh" }}
            />
            
            {/* Show generation time if available */}
            {generationTime && (
              <div className="absolute top-3 left-3 bg-black/60 px-3 py-1 rounded-full text-xs text-white">
                Generated in {generationTime}
              </div>
            )}
            
            {/* Buttons without darkening overlay */}
            <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <Button 
                onClick={handleRegenerate} 
                variant="outline" 
                size="sm" 
                className="rounded-full bg-black/70 backdrop-blur-sm hover:bg-[#3C3D37] hover:text-[#FFA725] border-white/20 text-white"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
              <Button 
                onClick={() => downloadImage(image, index)} 
                variant="outline" 
                size="sm" 
                className="rounded-full bg-black/70 backdrop-blur-sm hover:bg-[#3C3D37] hover:text-[#FFA725] border-white/20 text-white"
              >
                <Download className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ImageGrid;
