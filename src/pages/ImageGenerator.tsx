
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Image as ImageIcon, RefreshCcw, ChevronDown, Check, Square, ArrowLeft, ImagePlus, Upload, FolderOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ThemeToggle } from "@/components/ThemeToggle";
import ImageGrid from "@/components/ImageGrid";
import { Link } from "react-router-dom";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import GenerationSidebar, { GenerationSettings } from "@/components/GenerationSidebar";

const ImageGenerator = () => {
  const [prompt, setPrompt] = useState("");
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();
  const [negativePrompt, setNegativePrompt] = useState("");
  const [contentType, setContentType] = useState("art");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [isSettingsOpen, setIsSettingsOpen] = useState(true);
  const [isContentTypeOpen, setIsContentTypeOpen] = useState(true);
  const [isCompositionOpen, setIsCompositionOpen] = useState(true);
  
  // Generation settings
  const [generationSettings, setGenerationSettings] = useState<GenerationSettings>({
    mode: "fast",
    steps: 11, // Default for fast mode
    dimensionId: "1:1",
    width: 832,
    height: 832
  });

  const aspectRatios = {
    "1:1": { width: 1024, height: 1024 },
    "4:3": { width: 1024, height: 768 },
    "3:4": { width: 768, height: 1024 },
    "16:9": { width: 1024, height: 576 },
    "9:16": { width: 576, height: 1024 },
  };

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
          negative_prompt: negativePrompt,
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
              <ArrowLeft className="w-4 h-4" />
              Back
            </Link>
          </div>
          
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-[#443627]">PixcraftAI</h1>
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
              <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-8 rounded-lg mb-6 relative overflow-hidden">
                <div className="absolute -top-6 -right-6 w-16 h-16">
                  <div className="absolute w-full h-full bg-red-500 rotate-45"></div>
                  <ImageIcon className="absolute top-8 right-8 h-6 w-6 text-white" />
                </div>
                <ImageIcon className="h-16 w-16 mx-auto mb-4 text-gray-400 opacity-50" />
              </div>
              <h2 className="text-2xl font-bold mb-4">Start generating images</h2>
              <p className="text-gray-400 mb-6">
                Describe the image you want to generate in the prompt field, or go to Gallery and select images generated with sample prompts for you to try.
              </p>
            </div>
          )}
        </div>

        {/* Bottom Prompt Bar */}
        <div className="border-t border-gray-800 p-4">
          <div className="flex items-start max-w-3xl mx-auto">
            <div className="flex-1">
              <div className="bg-[#1A1A1A] rounded-lg border border-gray-800 overflow-hidden">
                <Textarea
                  ref={textareaRef}
                  placeholder="Enter a prompt to generate an image..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  disabled={isLoading}
                  className="min-h-[60px] px-4 py-3 bg-transparent border-none text-white placeholder:text-gray-500 resize-none focus:outline-none focus:ring-0"
                />
                <div className="px-4 py-2 flex items-center justify-between">
                  <button 
                    className="text-gray-400 hover:text-white"
                    onClick={() => {
                      if (textareaRef.current) {
                        textareaRef.current.focus();
                      }
                    }}
                  >
                    <RefreshCcw className="h-4 w-4" />
                  </button>
                  
                  {isLoading && (
                    <div className="flex-1 mx-4">
                      <Progress value={progress} className="h-1 bg-gray-700" />
                    </div>
                  )}
                  
                  <Button
                    onClick={generateImage}
                    disabled={isLoading || !prompt.trim()}
                    className="bg-[#FFA725] hover:bg-[#e99b22] text-white"
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
      </div>
    </div>
  );
};

export default ImageGenerator;
