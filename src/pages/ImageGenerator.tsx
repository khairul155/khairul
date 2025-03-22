
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ChevronLeft, ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ThemeToggle } from "@/components/ThemeToggle";
import ImageGrid from "@/components/ImageGrid";
import { Link } from "react-router-dom";
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import GenerationSidebar, { GenerationSettings } from "@/components/GenerationSidebar";

const ImageGenerator = () => {
  const [prompt, setPrompt] = useState("");
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();
  
  // Generation settings with updated default steps for fast mode
  const [generationSettings, setGenerationSettings] = useState<GenerationSettings>({
    mode: "fast",
    steps: 7, // Default for fast mode updated to 7
    dimensionId: "1:1",
    width: 832,
    height: 832,
    negativePrompt: ""
  });

  const generateImage = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Error",
        description: "Please enter a prompt first",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setProgress(0);
    const progressInterval = setInterval(() => {
      setProgress((prev) => Math.min(prev + 5, 90));
    }, 400);

    try {
      const { data, error } = await supabase.functions.invoke('generate-image', {
        body: { 
          prompt,
          width: generationSettings.width,
          height: generationSettings.height,
          negative_prompt: generationSettings.negativePrompt || "",
          num_images: 1,
          num_inference_steps: generationSettings.steps
        }
      });

      if (error) throw error;

      // Handle multiple images if the API supports it
      const images = data.data.map((item: any) => `data:image/webp;base64,${item.b64_json}`);
      setGeneratedImages(images);
      
      toast({
        title: "Success",
        description: `Generated ${images.length} image${images.length > 1 ? 's' : ''}!`,
      });
    } catch (error) {
      console.error('Error generating image:', error);
      toast({
        title: "Error",
        description: "Failed to generate image. Please try again.",
        variant: "destructive",
      });
    } finally {
      clearInterval(progressInterval);
      setProgress(100);
      setTimeout(() => {
        setProgress(0);
        setIsLoading(false);
      }, 500);
    }
  };

  // Handle generation settings changes
  const handleSettingsChange = (settings: Partial<GenerationSettings>) => {
    setGenerationSettings(prev => ({
      ...prev,
      ...settings
    }));
  };

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white flex">
      {/* Left Sidebar */}
      <GenerationSidebar 
        settings={generationSettings}
        onSettingsChange={handleSettingsChange}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Navigation */}
        <div className="border-b border-gray-800 p-4 flex items-center justify-between">
          <div className="flex items-center">
            <Link to="/" className="text-gray-300 hover:text-white flex items-center gap-1 transition-colors mr-4">
              <ChevronLeft className="w-4 h-4" />
              Back
            </Link>
          </div>
          
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-[#FFA725]">PixcraftAI</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <ThemeToggle />
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-auto p-6 flex items-center justify-center">
          {generatedImages.length > 0 && !isLoading ? (
            <div className="max-w-xl w-full">
              <ImageGrid images={generatedImages} prompt={prompt} />
            </div>
          ) : (
            <div className="text-center max-w-md mx-auto">
              <div className="flex flex-col items-center justify-center gap-6">
                <div className="rounded-full bg-gradient-to-br from-[#FF5353]/20 to-[#FFA725]/20 p-6">
                  <ImageIcon className="h-12 w-12 text-[#FFA725]" />
                </div>
                <h2 className="text-2xl font-bold">Turn your imagination into reality</h2>
                <p className="text-gray-400">
                  We provide you only one best result✨
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Prompt Bar - Redesigned to be wider with external button */}
        <div className="border-t border-gray-800 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col items-center">
              <div className="w-full bg-[#1A1A1A] rounded-lg border border-gray-800 overflow-hidden mb-4">
                <Textarea
                  ref={textareaRef}
                  placeholder="Enter prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  disabled={isLoading}
                  className="min-h-[60px] px-4 py-3 bg-transparent border-none text-white placeholder:text-gray-500 resize-none focus:outline-none focus:ring-0 w-full"
                />
                {isLoading && (
                  <div className="px-4 py-2">
                    <Progress value={progress} className="h-1 bg-gray-700" />
                  </div>
                )}
              </div>
              
              <Button
                onClick={generateImage}
                disabled={isLoading || !prompt.trim()}
                className="bg-[#2776FF] hover:bg-[#1665F2] text-white px-8 py-2 rounded-full"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Generate"
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageGenerator;
